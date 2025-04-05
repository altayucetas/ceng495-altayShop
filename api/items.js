
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

const ItemSchema = new mongoose.Schema({}, { strict: false });
const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);

export default async function handler(req, res) {
  if (!MONGODB_URI) {
    return res.status(500).send("MONGODB_URI is not defined.");
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const items = await Item.find({});
    res.status(200).json(items);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send("Database error occurred.");
  }
}