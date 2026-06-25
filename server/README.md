# AI Image Generator — Backend Setup

This is the base Express server setup per the architecture document.
**Models, Controllers, Routes, and Authentication are intentionally NOT included** — only the server bootstrap, MongoDB connection, and centralized error handling.

## Folder structure

```
server/
├── src/
│   ├── config/
│   │   └── db.js                # MongoDB Atlas connection
│   ├── models/                  # empty (placeholder, .gitkeep)
│   ├── controllers/             # empty (placeholder, .gitkeep)
│   ├── routes/                  # empty (placeholder, .gitkeep)
│   ├── middlewares/
│   │   └── errorMiddleware.js   # notFound + centralized errorHandler
│   ├── services/                # empty (placeholder, .gitkeep)
│   ├── utils/
│   │   └── apiError.js          # custom ApiError class
│   ├── validators/               # empty (placeholder, .gitkeep)
│   └── app.js                    # express app: cors, morgan, json, health check, error handlers
├── server.js                      # entry point: loads dotenv, connects DB, starts server
├── package.json
├── .env                            # local env vars (gitignored)
├── .env.example                     # template for .env
└── .gitignore
```

## Setup

```bash
cd server
npm install
```

> Note: dependencies were not pre-installed in this sandbox (no internet access here), so `node_modules/` is not included. Running `npm install` locally will install exactly what's listed in `package.json`: express, mongoose, dotenv, cors, morgan (+ nodemon as a dev dependency).

## Configure environment variables

Copy `.env.example` to `.env` and fill in your real MongoDB Atlas URI:

```bash
cp .env.example .env
```

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/ai-image-generator?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173
```

## Run

```bash
npm run dev    # nodemon, auto-restarts on file changes
# or
npm start      # plain node
```

On a successful start you should see:
```
MongoDB connected: <your-cluster-host>
Server running in development mode on port 5000
```

## Verify it's working

```bash
curl http://localhost:5000/api/health
```
Expected response:
```json
{ "success": true, "message": "Server is healthy", "data": { "uptime": 1.23 } }
```

## What's configured

| Requirement | File |
|---|---|
| Node.js project init | `package.json` |
| Dependencies | `package.json` → `dependencies` / `devDependencies` |
| Folder structure | `src/` tree above (matches architecture doc) |
| Express server | `src/app.js`, `server.js` |
| dotenv | `server.js` (`require("dotenv").config()`), `.env` / `.env.example` |
| cors | `src/app.js` (restricted to `CLIENT_ORIGIN`) |
| morgan | `src/app.js` (`dev` format locally, `combined` in production) |
| Centralized error handling | `src/middlewares/errorMiddleware.js` + `src/utils/apiError.js` |
| MongoDB connection | `src/config/db.js` |

## Next steps (not included here, per scope)

- Add Mongoose schemas in `src/models/` (`User.js`, `Image.js`, `Transaction.js`, `CreditPlan.js`)
- Add JWT auth middleware in `src/middlewares/authMiddleware.js`
- Add controllers/routes and mount them in `src/app.js` where the placeholder comment indicates
