import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let gfs;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Initialize GridFS after successful connection
    gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });

    console.log("MongoDB connected successfully");
    return gfs; // Return gfs so it can be used elsewhere if needed
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export { connectDB, gfs };
