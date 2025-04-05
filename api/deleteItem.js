import mongoose from "mongoose";
import { verifyToken } from "../lib/auth.js";

const MONGODB_URI = process.env.MONGODB_URI;

const ItemSchema = new mongoose.Schema({}, { strict: false });
const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).send("Only DELETE requests are allowed.");
  }
  if (!MONGODB_URI) return res.status(500).send("MONGODB_URI not set");

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  const auth = verifyToken(token);
  if (!auth || auth.role !== "admin") {
    return res.status(403).send("Only admins can delete items.");
  }

  const { itemId } = req.body;
  if (!itemId) {
    return res.status(400).send("Missing itemId.");
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    const product = await Item.findById(itemId);
    if (!product) {
      return res.status(404).send("Item not found.");
    }

    const affectedUsers = new Set();
    if (Array.isArray(product.ratings)) {
      product.ratings.forEach(r => affectedUsers.add(r.username));
    }
    if (Array.isArray(product.reviews)) {
      product.reviews.forEach(r => affectedUsers.add(r.username));
    }

    await Item.deleteOne({ _id: itemId });

    await User.updateMany(
      { "reviews.itemId": itemId },
      { $pull: { reviews: { itemId: itemId } } }
    );

    for (const username of affectedUsers) {
      const ratedItems = await Item.find({ "ratings.username": username });
      let allRatings = [];
      ratedItems.forEach(item => {
        if (Array.isArray(item.ratings)) {
          item.ratings.forEach(r => {
            if (r.username === username) {
              allRatings.push(r.value);
            }
          });
        }
      });
      const newAvg = allRatings.length ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10 : 0;
      await User.updateOne({ username: username }, { averageRating: newAvg });
    }

    res.status(200).json({ message: "Item and associated reviews/ratings deleted and user data updated." });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).send("Server error.");
  }
}
