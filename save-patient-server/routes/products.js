import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";

const router = express.Router();
const VALID_STATUS = ["Active", "Draft"];

// Ensure upload directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 🛠️ CONFIG MULTER STORAGE FOR PRODUCTS
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-product${ext}`);
  }
});

const upload = multer({ storage });

// Helper validation function
function validatePayload(body, { partial = false } = {}) {
  const errors = [];
  const { name, category_id, subcategory_id, country, price, status } = body;

  if (!partial || name !== undefined) {
    if (!name || !String(name).trim()) errors.push("Name is required.");
  }
  if (!partial || category_id !== undefined) {
    if (!category_id) errors.push("Category ID is required.");
  }
  // Optional Subcategory ID Validation
  if (subcategory_id !== undefined && subcategory_id !== null && subcategory_id !== "") {
    if (isNaN(Number(subcategory_id))) {
      errors.push("Subcategory ID must be a valid number.");
    }
  }
  if (!partial || country !== undefined) {
    if (!country || !String(country).trim()) errors.push("Destination country is required.");
  }
  if (!partial || price !== undefined) {
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
      errors.push("Price must be a number greater than 0.");
    }
  }
  if (status !== undefined && !VALID_STATUS.includes(status)) {
    errors.push("Status must be 'Active' or 'Draft'.");
  }

  return errors;
}

/* ==========================================================================
   PRODUCT CRUD ROUTES
   ========================================================================== */

// 1. GET ALL PRODUCTS (Joins both categories and subcategories)
router.get("/products", async (_req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, c.name AS category, s.name AS subcategory 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      ORDER BY p.id DESC
    `);
    res.json({ products: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load products." });
  }
});

// 2. GET SINGLE PRODUCT BY ID
router.get("/products/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, c.name AS category, s.name AS subcategory 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (!rows[0]) return res.status(404).json({ error: "Product not found." });
    res.json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load product." });
  }
});

// 3. CREATE NEW PRODUCT
router.post("/products", upload.single("imageFile"), async (req, res) => {
  const errors = validatePayload(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const { 
    name, 
    category_id, 
    subcategory_id = null, // Defaults to null if not provided
    country, 
    price, 
    duration = "", 
    status = "Active", 
    description = "" 
  } = req.body;
  
  const image = req.file ? req.file.filename : null;

  // Ensure subcategory_id is stored as null if empty string is sent
  const finalSubcategoryId = subcategory_id === "" ? null : subcategory_id;

  try {
    const [result] = await db.execute(
      `INSERT INTO products (name, category_id, subcategory_id, country, price, duration, status, description, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(), 
        category_id, 
        finalSubcategoryId, 
        country, 
        Number(price), 
        duration, 
        status, 
        description, 
        image
      ]
    );
    
    // Fetch newly created product with joins
    const [rows] = await db.execute(`
      SELECT p.*, c.name AS category, s.name AS subcategory 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE p.id = ?
    `, [result.insertId]);

    res.status(201).json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create product." });
  }
});

// 4. UPDATE PRODUCT (PARTIAL OR FULL)
router.put("/products/:id", upload.single("imageFile"), async (req, res) => {
  const errors = validatePayload(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const [current] = await db.execute("SELECT image FROM products WHERE id = ?", [req.params.id]);
  if (!current.length) return res.status(404).json({ error: "Product not found." });

  // 🚀 Included subcategory_id in the allowed fields list
  const fields = ["name", "category_id", "subcategory_id", "country", "price", "duration", "status", "description", "image"];
  const updates = [];
  const values = [];

  try {
    for (const f of fields) {
      if (f === "image") {
        if (req.file) {
          updates.push("image = ?");
          values.push(req.file.filename);
        }
      } else if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        
        let val = req.body[f];
        if (f === "price") val = Number(val);
        if (f === "subcategory_id" && val === "") val = null; // Convert empty selection to SQL Null
        
        values.push(val);
      }
    }

    if (!updates.length) return res.status(400).json({ error: "No fields to update." });

    values.push(req.params.id);

    const [result] = await db.execute(
      `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) return res.status(404).json({ error: "Product not found." });

    const [rows] = await db.execute(`
      SELECT p.*, c.name AS category, s.name AS subcategory 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE p.id = ?
    `, [req.params.id]);

    res.json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update product." });
  }
});

// 5. DELETE PRODUCT
router.delete("/products/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM products WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Product not found." });
    res.json({ message: "Product deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete product." });
  }
});

export default router;