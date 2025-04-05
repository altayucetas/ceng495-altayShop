import mongoose from "mongoose";
import { verifyToken } from "../lib/auth.js";

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const ItemSchema = new mongoose.Schema({}, { strict: false });
const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).send("Only DELETE requests are allowed.");
  }
  if (!MONGODB_URI) return res.status(500).send("MONGODB_URI not set");

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  const auth = verifyToken(token);
  if (!auth || auth.role !== "admin") {
    return res.status(403).send("Only admins can delete users.");
  }

  const { username } = req.body;
  if (!username) {
    return res.status(400).send("Missing username.");
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send("User not found.");
    }

    await User.deleteOne({ username });

    await Item.updateMany(
      { "reviews.username": username },
      { $pull: { reviews: { username } } }
    );

    await Item.updateMany(
      { "ratings.username": username },
      { $pull: { ratings: { username } } }
    );

    const items = await Item.find({ "ratings": { $exists: true } });
    for (const item of items) {
      const sum = item.ratings.reduce((acc, r) => acc + r.value, 0);
      const newRating = item.ratings.length > 0 ? Math.round((sum / item.ratings.length) * 10) / 10 : 0;
      await Item.findByIdAndUpdate(item._id, { rating: newRating });
    }

    res.status(200).json({ message: `User and associated reviews/ratings deleted and item data updated.` });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).send("Server error.");
  }
}
