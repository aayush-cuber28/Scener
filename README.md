# Scener

A community-driven platform for **movie, music and series reviews**. The site owner posts an in-depth review with a poster, registered users discuss it, and every title gets a combined rating out of 10.

## Features

| Module | What it does |
|---|---|
| Authentication | Sign up / log in with JWT + bcrypt. Nicknames are unique (case-insensitive). Guests can read everything but can't post. |
| Content & reviews | Owner (admin) adds, edits and deletes reviews with poster, year, score, and **genres per type** (e.g. Movies: Action, Sci-Fi; Songs: Pop, Rock; Series: Anime, Crime). |
| Browse | Tabs for Movies / Songs / Series, genre filter chips, search by name, sort by newest / top rated / A–Z. |
| Discussion | Comments, one-level replies, 👍 likes, delete own comment (owner can delete any). |
| Rating engine | Rating = (owner score × 3 + all user scores) ÷ (3 + number of user scores). Recalculated whenever a rating is added or removed. One rating per user per title. |
| Requests & voting | Users request titles and upvote others' requests; list is sorted by votes. Publishing a review for a requested title marks the request as reviewed automatically. |
| Moderation & age | Profanity filter on comments and requests. 18+ titles are hidden (review + discussion) from guests and under-18 users, based on date of birth given at sign-up. |
| Posters | Uploaded to **Cloudinary** when `CLOUDINARY_URL` is set, otherwise saved to `backend/uploads` (local development). Max 3 MB, images only. |

**Tech stack:** React 19 + Vite, Node.js + Express 5, MongoDB Atlas + Mongoose, JWT, bcrypt, Multer, Cloudinary, Jest + Supertest.

## Project structure

```
backend/
  app.js            Express app (routes, error handling, serves the React build in production)
  server.js         Connects to MongoDB and starts the server
  scripts/          makeAdmin.js
  src/              config, controllers, middleware, models, routes, utils
  tests/            unit + integration tests
frontend/
  src/pages/        Home, TitleDetail, ReviewForm (add/edit), Requests, Login, Register
render.yaml         Render deployment blueprint
```

## Run locally

```bash
cd backend
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
npm install
npm run dev               # API on http://localhost:5000
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev               # site on http://localhost:5173
```

## Becoming the owner (admin)

Sign up on the site, then run this once from the `backend` folder:

```bash
npm run make-admin -- your-email@example.com
```

Log out and back in. You'll see **+ Add review** in the top bar, and **Edit / Delete** buttons on every review.

## Tests

```bash
cd backend
npm test                  # 61 tests: unit + integration (in-memory MongoDB, no setup needed)
npm run test:coverage     # same, with a coverage report
```

## Deploy (free, Render + MongoDB Atlas + Cloudinary)

One Render web service builds the React app and serves it together with the API, so the whole site has one link.

1. **MongoDB Atlas** → *Network Access* → *Add IP Address* → `0.0.0.0/0` (Render has no fixed IP).
2. **Cloudinary** → Dashboard → copy the *API environment variable* (`cloudinary://...`).
3. **GitHub**: push this project to a repository.
4. **Render** → *New* → *Blueprint* → pick the repository. Render reads `render.yaml` and asks for:
   - `MONGO_URI`: the same value as in `backend/.env`
   - `CLOUDINARY_URL`: from step 2

   `JWT_SECRET` is generated automatically. Click *Deploy*.

   *(Manual alternative: New → Web Service, Build command `npm run build`, Start command `npm start`, and add the env vars `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_URL`.)*
5. Open the `https://<name>.onrender.com` link. It uses the same database, so your existing accounts work.

The free plan sleeps after 15 minutes of no traffic; the first visit after that takes about a minute. Open the site a minute before a demo.
