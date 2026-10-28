// Integration tests: real HTTP requests against the Express app with an in-memory MongoDB.
process.env.JWT_SECRET = "test-secret";
delete process.env.CLOUDINARY_URL;

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const User = require("../src/models/User");

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  // Jest can't run the driver's dynamic import("os"), so hand it the os module directly.
  await mongoose.connect(mongo.getUri(), { runtimeAdapters: { os: require("os") } });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function signUp(nickname, dateOfBirth = "2000-01-01") {
  const res = await request(app).post("/api/auth/register").send({
    nickname,
    email: `${nickname}@test.com`,
    password: "secret123",
    dateOfBirth,
  });
  return res;
}

async function login(nickname) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: `${nickname}@test.com`, password: "secret123" });
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

let adminToken, userToken, teenToken, friendToken, titleId, matureId;

describe("Authentication module", () => {
  test("registers a new user and returns a token", async () => {
    const res = await signUp("owner");
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("user");
  });

  test("rejects a nickname that is already taken (case-insensitive)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      nickname: "OWNER", email: "other@test.com", password: "secret123", dateOfBirth: "2000-01-01",
    });
    expect(res.statusCode).toBe(409);
  });

  test("rejects an invalid email and a short password", async () => {
    const bad = { nickname: "newbie", dateOfBirth: "2000-01-01" };
    expect((await request(app).post("/api/auth/register").send({ ...bad, email: "x", password: "secret123" })).statusCode).toBe(400);
    expect((await request(app).post("/api/auth/register").send({ ...bad, email: "n@t.com", password: "123" })).statusCode).toBe(400);
  });

  test("logs in with the right password and rejects the wrong one", async () => {
    await User.updateOne({ nickname: "owner" }, { role: "admin" });
    adminToken = await login("owner");
    expect(adminToken).toBeDefined();
    const wrong = await request(app).post("/api/auth/login").send({ email: "owner@test.com", password: "nope123" });
    expect(wrong.statusCode).toBe(401);
  });

  test("creates the other test accounts", async () => {
    await signUp("viewer");
    await signUp("friend");
    const teenDob = new Date();
    teenDob.setFullYear(teenDob.getFullYear() - 15);
    await signUp("teen", teenDob.toISOString().slice(0, 10));
    userToken = await login("viewer");
    friendToken = await login("friend");
    teenToken = await login("teen");
    expect(userToken && friendToken && teenToken).toBeTruthy();
  });
});

describe("Content & review module", () => {
  test("a normal user cannot add a review", async () => {
    const res = await request(app).post("/api/titles").set(auth(userToken))
      .field("name", "Inception").field("category", "movie").field("reviewText", "Great").field("ownerScore", "9");
    expect(res.statusCode).toBe(403);
  });

  test("the owner adds a movie review with genres", async () => {
    const res = await request(app).post("/api/titles").set(auth(adminToken))
      .field("name", "Inception").field("category", "movie").field("genres", "Sci-Fi,Thriller")
      .field("year", "2010").field("reviewText", "A mind-bending heist.").field("ownerScore", "9");
    expect(res.statusCode).toBe(201);
    expect(res.body.genres).toEqual(["Sci-Fi", "Thriller"]);
    expect(res.body.rating).toBe(9);
    titleId = res.body._id;
  });

  test("rejects a genre that does not belong to the category", async () => {
    const res = await request(app).post("/api/titles").set(auth(adminToken))
      .field("name", "Song X").field("category", "song").field("genres", "Action")
      .field("reviewText", "ok").field("ownerScore", "5");
    expect(res.statusCode).toBe(400);
  });

  test("rejects a poster that is not an image", async () => {
    const res = await request(app).post("/api/titles").set(auth(adminToken))
      .field("name", "Bad poster").field("category", "movie").field("reviewText", "ok").field("ownerScore", "5")
      .attach("poster", Buffer.from("not an image"), { filename: "notes.txt", contentType: "text/plain" });
    expect(res.statusCode).toBe(400);
  });

  test("guests can browse and filter titles by category and genre", async () => {
    await request(app).post("/api/titles").set(auth(adminToken))
      .field("name", "Blinding Lights").field("category", "song").field("genres", "Pop")
      .field("reviewText", "Catchy synth-pop.").field("ownerScore", "8");

    expect((await request(app).get("/api/titles")).body).toHaveLength(2);
    expect((await request(app).get("/api/titles?category=song")).body).toHaveLength(1);
    expect((await request(app).get("/api/titles?category=movie&genre=Thriller")).body[0].name).toBe("Inception");
    expect((await request(app).get("/api/titles?category=movie&genre=Comedy")).body).toHaveLength(0);
  });

  test("search finds titles by part of the name", async () => {
    const res = await request(app).get("/api/titles?search=incep");
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Inception");
  });

  test("the owner can edit a review", async () => {
    const res = await request(app).put(`/api/titles/${titleId}`).set(auth(adminToken))
      .field("name", "Inception").field("category", "movie").field("genres", "Sci-Fi,Action")
      .field("year", "2010").field("reviewText", "Updated review.").field("ownerScore", "9");
    expect(res.statusCode).toBe(200);
    expect(res.body.reviewText).toBe("Updated review.");
    expect(res.body.genres).toEqual(["Sci-Fi", "Action"]);
  });
});

describe("Comment, rating & moderation modules", () => {
  test("guests cannot comment", async () => {
    const res = await request(app).post(`/api/comments/${titleId}`).send({ text: "hi" });
    expect(res.statusCode).toBe(401);
  });

  test("a comment with bad language is blocked and not saved", async () => {
    const res = await request(app).post(`/api/comments/${titleId}`).set(auth(userToken)).send({ text: "this is shit" });
    expect(res.statusCode).toBe(400);
    const list = await request(app).get(`/api/comments/${titleId}`);
    expect(list.body).toHaveLength(0);
  });

  test("register → login → comment with rating → rating recalculates", async () => {
    const res = await request(app).post(`/api/comments/${titleId}`).set(auth(userToken)).send({ text: "Loved it", score: 6 });
    expect(res.statusCode).toBe(201);
    await request(app).post(`/api/comments/${titleId}`).set(auth(friendToken)).send({ text: "Good", score: 6 });
    const title = await request(app).get(`/api/titles/${titleId}`);
    // (9*3 + 6 + 6) / 5 = 7.8
    expect(title.body.rating).toBe(7.8);
    expect(title.body.voteCount).toBe(2);
  });

  test("a user can only rate a title once", async () => {
    const res = await request(app).post(`/api/comments/${titleId}`).set(auth(userToken)).send({ text: "Again", score: 10 });
    expect(res.statusCode).toBe(409);
  });

  test("users can reply to a comment, and replies cannot carry a rating", async () => {
    const [first] = (await request(app).get(`/api/comments/${titleId}`)).body.filter((c) => c.nickname === "viewer");
    const reply = await request(app).post(`/api/comments/${titleId}`).set(auth(friendToken))
      .send({ text: "Agreed!", parentId: first._id });
    expect(reply.statusCode).toBe(201);
    expect(reply.body.parent).toBe(first._id);

    const ratedReply = await request(app).post(`/api/comments/${titleId}`).set(auth(friendToken))
      .send({ text: "Agreed!", parentId: first._id, score: 3 });
    expect(ratedReply.statusCode).toBe(400);
  });

  test("users can like and unlike a comment, but not their own", async () => {
    const [first] = (await request(app).get(`/api/comments/${titleId}`)).body.filter((c) => c.nickname === "viewer");
    const like = await request(app).post(`/api/comments/${first._id}/like`).set(auth(friendToken));
    expect(like.body).toEqual({ likeCount: 1, liked: true });
    const unlike = await request(app).post(`/api/comments/${first._id}/like`).set(auth(friendToken));
    expect(unlike.body).toEqual({ likeCount: 0, liked: false });
    const own = await request(app).post(`/api/comments/${first._id}/like`).set(auth(userToken));
    expect(own.statusCode).toBe(400);
  });

  test("users cannot delete someone else's comment", async () => {
    const [first] = (await request(app).get(`/api/comments/${titleId}`)).body.filter((c) => c.nickname === "viewer");
    const res = await request(app).delete(`/api/comments/${first._id}`).set(auth(friendToken));
    expect(res.statusCode).toBe(403);
  });

  test("the owner deletes a rated comment and its replies; rating recalculates", async () => {
    const [first] = (await request(app).get(`/api/comments/${titleId}`)).body.filter((c) => c.nickname === "viewer" && !c.parent);
    const res = await request(app).delete(`/api/comments/${first._id}`).set(auth(adminToken));
    expect(res.statusCode).toBe(200);
    const left = (await request(app).get(`/api/comments/${titleId}`)).body;
    expect(left.some((c) => c.parent === first._id)).toBe(false);
    const title = await request(app).get(`/api/titles/${titleId}`);
    // (9*3 + 6) / 4 = 8.25 -> 8.3
    expect(title.body.rating).toBe(8.3);
  });
});

describe("Content maturity & age module", () => {
  beforeAll(async () => {
    const res = await request(app).post("/api/titles").set(auth(adminToken))
      .field("name", "Dark Show").field("category", "series").field("genres", "Crime")
      .field("reviewText", "Very graphic.").field("ownerScore", "7").field("isMature", "true");
    matureId = res.body._id;
  });

  test("guests see an 18+ title as locked, without the review text", async () => {
    const res = await request(app).get(`/api/titles/${matureId}`);
    expect(res.body.locked).toBe(true);
    expect(res.body.reviewText).toBeUndefined();
    expect((await request(app).get(`/api/comments/${matureId}`)).statusCode).toBe(403);
  });

  test("an under-18 user cannot read or comment on 18+ content", async () => {
    const res = await request(app).get(`/api/titles/${matureId}`).set(auth(teenToken));
    expect(res.body.locked).toBe(true);
    const comment = await request(app).post(`/api/comments/${matureId}`).set(auth(teenToken)).send({ text: "hi" });
    expect(comment.statusCode).toBe(403);
  });

  test("an adult user can read and comment on 18+ content", async () => {
    const res = await request(app).get(`/api/titles/${matureId}`).set(auth(userToken));
    expect(res.body.locked).toBe(false);
    expect(res.body.reviewText).toBe("Very graphic.");
    const comment = await request(app).post(`/api/comments/${matureId}`).set(auth(userToken)).send({ text: "Intense" });
    expect(comment.statusCode).toBe(201);
  });

  test("the owner deletes a review along with its comments", async () => {
    const res = await request(app).delete(`/api/titles/${matureId}`).set(auth(adminToken));
    expect(res.statusCode).toBe(200);
    expect((await request(app).get(`/api/titles/${matureId}`)).statusCode).toBe(404);
  });
});

describe("Request & voting module", () => {
  let requestA, requestB;

  test("users post requests; duplicates are rejected", async () => {
    requestA = (await request(app).post("/api/requests").set(auth(userToken)).send({ name: "Dune", category: "movie" })).body;
    requestB = (await request(app).post("/api/requests").set(auth(userToken)).send({ name: "Shogun", category: "series" })).body;
    expect(requestA.upvoteCount).toBe(1);
    const dup = await request(app).post("/api/requests").set(auth(friendToken)).send({ name: "dune", category: "movie" });
    expect(dup.statusCode).toBe(409);
  });

  test("upvotes reorder the request list by popularity", async () => {
    await request(app).post(`/api/requests/${requestB._id}/upvote`).set(auth(friendToken));
    const list = (await request(app).get("/api/requests")).body;
    expect(list[0].name).toBe("Shogun");
    expect(list[0].upvoteCount).toBe(2);
  });

  test("publishing a review for a requested title marks the request as reviewed", async () => {
    await request(app).post("/api/titles").set(auth(adminToken))
      .field("name", "Dune").field("category", "movie").field("reviewText", "Epic.").field("ownerScore", "8");
    const reviewed = (await request(app).get("/api/requests?status=reviewed")).body;
    expect(reviewed.map((r) => r.name)).toContain("Dune");
  });

  test("only the owner can mark a request as reviewed", async () => {
    expect((await request(app).patch(`/api/requests/${requestB._id}/reviewed`).set(auth(userToken))).statusCode).toBe(403);
    expect((await request(app).patch(`/api/requests/${requestB._id}/reviewed`).set(auth(adminToken))).statusCode).toBe(200);
  });
});
