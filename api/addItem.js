import mongoose from "mongoose";
import { verifyToken } from "../lib/auth.js";

const MONGODB_URI = process.env.MONGODB_URI;

const ItemSchema = new mongoose.Schema({}, { strict: false });
const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST requests are allowed.");
  }

  if (!MONGODB_URI) return res.status(500).send("MONGODB_URI not set");

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  const auth = verifyToken(token);

  if (!auth || auth.role !== "admin") {
    return res.status(403).send("Only admins can add items.");
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    const newItem = req.body;
    if (!newItem.name || !newItem.description || !newItem.price || !newItem.seller) {
      return res.status(400).send("Missing required item fields.");
    }

    newItem.rating = 0;
    newItem.reviews = [];

    const item = new Item(newItem);
    await item.save();

    res.status(200).json({ message: "Item added successfully." });
  } catch (err) {
    console.error("Add item error:", err);
    res.status(500).send("Server error.");
  }
}
