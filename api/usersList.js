import mongoose from "mongoose";
import { verifyToken } from "../lib/auth.js";

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Only GET requests are allowed.");
  }

  if (!MONGODB_URI) {
    return res.status(500).send("MONGODB_URI is not defined.");
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  const auth = verifyToken(token);

  if (!auth || auth.role !== "admin") {
    return res.status(403).send("Only admins can access user list.");
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const users = await User.find({}, { password: 0 });
    res.status(200).json(users);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send("Database error occurred.");
  }
}