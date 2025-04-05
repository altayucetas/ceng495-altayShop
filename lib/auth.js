import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secCyb4444";

export function generateToken(user) {
  return jwt.sign(
    { username: user.username, role: user.role },
    SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}
