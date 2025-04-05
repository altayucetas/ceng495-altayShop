import mongoose from "mongoose";
import { verifyToken } from "../lib/auth.js";

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  averageRating: { type: Number, default: 0 },
  reviews: { type: Array, default: [] }
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST requests are allowed.");
  }
  if (!MONGODB_URI) return res.status(500).send("MONGODB_URI not set");

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).send("Missing username or password.");
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).send("User already exists.");
    }

    let finalRole = "user";

    const authHeader = req.headers.authorization || "";
    let tokenAuth = null;
    if (authHeader) {
      tokenAuth = verifyToken(authHeader.replace("Bearer ", ""));
    }

    if (tokenAuth) {
      if (tokenAuth.role !== "admin") {
        if (role && role === "admin") {
          return res.status(403).send("A user cannot register admin accounts.");
        } else {
          return res.status(403).send("A user cannot register new accounts.");
        }
      }
      finalRole = role ? role : "user";
    } else {
      if (role) {
        return res.status(403).send("Self-registration cannot specify a role.");
      }
      finalRole = "user";
    }

    const user = new User({
      username,
      password,
      role: finalRole,
      averageRating: 0,
      reviews: []
    });

    await user.save();
    res.status(200).json({ message: `User registered as ${finalRole}.` });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).send("Server error.");
  }
}
