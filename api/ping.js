import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (!MONGODB_URI) return res.status(500).send("MONGODB_URI tanımlı değil.");
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    await mongoose.connection.db.admin().ping();
    res.status(200).send("MongoDB bağlantısı başarılı.");
  } catch (err) {
    console.error(err);
    res.status(500).send("MongoDB bağlantı hatası.");
  }
}