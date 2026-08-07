import express from "express";
import cors from "cors"; // 💡 Added the missing import here!
import db from "./config/db.js";
import dotenv from "dotenv";
import user from './routes/user.js';
import products from './routes/products.js'
import categories from './routes/categories.js'
import subcategories from "./routes/subcategories.js"

dotenv.config();

const app = express();

// Fallback to port 5000 if process.env.PORT isn't defined in your .env
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Expose the "uploads" folder publicly so the browser can read images from it
app.use("/uploads", express.static("uploads"));

// CORS configuration supporting your new Next.js front-end port
app.use(
  cors({
    origin: "http://localhost:3000", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, 
  })
);

// Routes
app.use("/api/auth", user);
app.use("/api/auth", products);
app.use("/api/auth", categories);
app.use("/api/auth", subcategories);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});