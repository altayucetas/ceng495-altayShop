import mongoose from "mongoose";

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

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const { username } = req.query;

    if (!username) {
      return res.status(401).send("Authentication required.");
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    res.status(200).json({
      username: user.username,
      averageRating: user.averageRating || 0,
      reviews: user.reviews || []
    });

  } catch (err) {
    console.error("User info error:", err);
    res.status(500).send("Database error occurred.");
  }
}
