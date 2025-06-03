import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import leaveRequestRoutes from "./routes/RequestRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import checkInRoutes from "./routes/checkInRoutes.js";
import { connectDB, gfs } from "./config/db.js";
import cors from "cors";
import searchRoutes from "./routes/searchRoutes.js";

// Load environment variables from .env file
dotenv.config();
//engine
const app = express();

app.use(
  cors({
    origin: "http://localhost:8081",
    credentials: true,
  })
);

// Connect to the database
const initializeApp = async () => {
  try {
    await connectDB(); // Wait for database connection

    app.use(express.json());

    // // Add GridFS endpoint for serving images
    // app.get("/api/images/:filename", async (req, res) => {
    //   try {
    //     const file = await gfs
    //       .find({ filename: req.params.filename })
    //       .toArray();
    //     if (!file || file.length === 0) {
    //       return res.status(404).json({ message: "File not found" });
    //     }

    //     const readStream = gfs.openDownloadStreamByName(req.params.filename);
    //     readStream.pipe(res);
    //   } catch (error) {
    //     res.status(500).json({ message: "Error retrieving file" });
    //   }
    // });

    // Register routes with corresponding paths
    app.use("/api/auth", authRoutes);
    app.use("/api/employees", employeeRoutes);
    app.use("/api/tasks", taskRoutes);
    app.use("/api/requests", leaveRequestRoutes);
    app.use("/api/issues", issueRoutes);
    app.use("/api/announcements", announcementRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/uploads", express.static("uploads"));
    app.use("/api/check-in", checkInRoutes);
    app.use("/api/search", searchRoutes);
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
};

initializeApp();
