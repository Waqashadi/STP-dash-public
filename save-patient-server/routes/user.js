import express from "express";
import bcrypt from "bcrypt"; 
import jwt from "jsonwebtoken"; 
import db from "../config/db.js";

const router = express.Router();

// 1. GOOGLE AUTHENTICATION ENDPOINT
router.post("/google-login", async (req, res) => {
  try {
    const { name, email, profile_image } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    const [users] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length > 0) {
      return res.json({
        success: true,
        message: "User already exists",
        user: users[0],
      });
    }

    // Save user
    const [result] = await db.execute(
      `INSERT INTO users 
      (name, email, profile_image) 
      VALUES (?, ?, ?)`,
      [name, email, profile_image]
    );

    res.status(201).json({
      success: true,
      message: "User created",
      id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// 2. STANDARD ADMIN USERNAME/PASSWORD ENDPOINT
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }

  try {
    // FIX: Changed 'pool.query' to 'db.execute' to match your file's database instance name
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Compares cleartext password with your database 'password_hash' field
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Generates a secure JSON Web Token for your Next.js client to consume
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN}
    );

    // Returns payload format matching your Next.js application requirements
    res.json({ 
      token, 
      user: { id: user.id, email: user.email } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong while logging in." });
  }
});

export default router;