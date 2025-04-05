import mongoose from "mongoose";
import { verifyToken } from "../lib/auth.js";

const MONGODB_URI = process.env.MONGODB_URI;

const ItemSchema = new mongoose.Schema({
  ratings: { type: Array, default: [] },
  rating: { type: Number, default: 0 }
}, { strict: false });
const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);

const UserSchema = new mongoose.Schema({
  averageRating: { type: Number, default: 0 }
}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST requests are allowed.");
  }

  if (!MONGODB_URI) {
    return res.status(500).send("MONGODB_URI is not defined.");
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  const auth = verifyToken(token);

  if (!auth || !auth.username) {
    return res.status(401).send("Unauthorized.");
  }

  const username = auth.username;
  const { itemId, rating } = req.body;

  if (!itemId || typeof rating !== "number") {
    return res.status(400).send("Missing or invalid parameters.");
  }

  if (rating < 1 || rating > 10) {
    return res.status(400).send("Rating must be between 1 and 10.");
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    const item = await Item.findById(itemId);
    const user = await User.findOne({ username });

    if (!item || !user) {
      return res.status(404).send("Item or user not found.");
    }

    if (!Array.isArray(item.ratings)) {
      item.ratings = [];
    }

    item.ratings = item.ratings.filter(r => r.username !== username);
    item.ratings.push({ username, value: rating });

    const sum = item.ratings.reduce((acc, r) => acc + r.value, 0);
    item.rating = Math.round((sum / item.ratings.length) * 10) / 10;

    await item.save();

    const ratedItems = await Item.find({ "ratings.username": username });
    const allRatings = ratedItems.flatMap(i =>
      Array.isArray(i.ratings)
        ? i.ratings.filter(r => r.username === username).map(r => r.value)
        : []
    );

    const userAvg = allRatings.length
      ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
      : 0;

    user.averageRating = userAvg;
    await user.save();

    res.status(200).json({
      message: "Rating submitted.",
      itemRating: item.rating,
      userAverage: user.averageRating
    });

  } catch (err) {
    console.error("Rating error:", err);
    res.status(500).send("Database error occurred.");
  }
}
