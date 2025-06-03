import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("config/serviceAccountKey.json", "utf8"));

import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

export default admin;
