const request = require("supertest");
const app = require("../app");

describe("GET / (API test)", () => {
  test("responds with 200 status code", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
  });

  test("responds with the correct confirmation message", async () => {
    const res = await request(app).get("/");
    expect(res.text).toBe("Scener backend is running!");
  });

  test("an undefined route responds with 404", async () => {
    const res = await request(app).get("/this-route-does-not-exist");
    expect(res.statusCode).toBe(404);
  });
});
