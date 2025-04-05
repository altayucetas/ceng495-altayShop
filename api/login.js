import mongoose from "mongoose";
import { generateToken } from "../lib/auth.js";

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests are allowed." });
  }

  if (!MONGODB_URI) {
    return res.status(500).json({ message: "MONGODB_URI not set" });
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Missing credentials." });
    }

    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful.",
      token
    });

  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
}
