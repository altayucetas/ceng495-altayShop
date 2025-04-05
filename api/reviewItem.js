import mongoose from "mongoose";
import { verifyToken } from "../lib/auth.js";

const MONGODB_URI = process.env.MONGODB_URI;

const ItemSchema = new mongoose.Schema({}, { strict: false });
const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST requests are allowed.");
  }
  
  if (!MONGODB_URI) {
    return res.status(500).send("MONGODB_URI is not defined.");
  }
  
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    }
    
    console.log("Request body:", req.body);
    
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    const auth = verifyToken(token);
    if (!auth || !auth.username) {
      return res.status(401).send("Unauthorized or invalid token.");
    }
    
    const username = auth.username;
    const { itemId, comment } = req.body;
    
    if (!itemId || !comment) {
      return res.status(400).send("Missing parameters.");
    }
    
    const item = await Item.findById(itemId);
    const user = await User.findOne({ username });
    
    if (!item || !user) {
      return res.status(404).send("Item or user not found.");
    }
    
    if (!Array.isArray(item.reviews)) {
      item.reviews = [];
    }
    
    const existingReview = item.reviews.find(r => r.username === username);
    if (existingReview) {
      existingReview.comment = comment;
      existingReview.timestamp = new Date().toISOString();
    } else {
      item.reviews.push({
        username,
        comment,
        timestamp: new Date().toISOString()
      });
    }
    
    item.markModified("reviews");
    await item.save();
    
    if (!Array.isArray(user.reviews)) {
      user.reviews = [];
    }
    
    const itemName = item.name || "Unnamed Item";
    const existingUserReview = user.reviews.find(r => r.itemId === itemId);
    if (existingUserReview) {
      existingUserReview.comment = comment;
      existingUserReview.itemName = itemName;
      existingUserReview.timestamp = new Date().toISOString();
    } else {
      user.reviews.push({
        itemId,
        itemName,
        comment,
        timestamp: new Date().toISOString()
      });
    }
    
    user.markModified("reviews");
    await user.save();
    
    res.status(200).json({ message: "Review submitted." });
    
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).send("Database error occurred.");
  }
}
