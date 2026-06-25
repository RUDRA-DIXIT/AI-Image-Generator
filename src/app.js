const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const imageRoutes = require("./routes/imageRoutes");

const app = express();

// ---- Core middlewares ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — restrict to the configured frontend origin(s)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") || "*",
    credentials: true,
  })
);

// HTTP request logging — verbose in dev, concise in production
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ---- Health check ----
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    data: { uptime: process.uptime() },
  });
});

// ---- Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/images", imageRoutes);

// ---- Error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
