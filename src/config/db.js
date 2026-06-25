const mongoose = require("mongoose");

/**
 * Establishes connection to MongoDB Atlas using the URI from environment variables.
 * Exits the process on failure since the app cannot function without a DB connection.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Optional: log unexpected disconnects (useful in production)
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

module.exports = connectDB;
