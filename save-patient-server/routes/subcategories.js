import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";

const router = express.Router();

// Ensure the local upload folder target directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 🛠️ CONFIG MULTER STORAGE DISK STRATEGY (Prefixes filename with -subcategory)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-subcategory${ext}`);
  }
});

const upload = multer({ storage });

// Helper validation function
function validateSubcategory(body) {
  const errors = [];
  const { name, category_id, slug } = body;

  if (!name || !String(name).trim()) errors.push("Subcategory name is required.");
  if (!category_id || isNaN(Number(category_id))) errors.push("Valid Parent Category ID is required.");
  if (!slug || !String(slug).trim()) errors.push("Slug is required.");

  return errors;
}

// 1. GET ALL SUBCATEGORIES (includes joined category_name)
router.get("/subcategories", async (_req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT s.*, c.name AS category_name 
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY s.name ASC
    `);
    res.json({ subcategories: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load subcategories." });
  }
});

// 2. CREATE NEW SUBCATEGORY (With upload.single middleware)
router.post("/subcategories", upload.single("imageFile"), async (req, res) => {
  const errors = validateSubcategory(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const { name, category_id, slug, description = "" } = req.body;
  
  // Grab the file name if uploaded, otherwise null
  const image = req.file ? req.file.filename : null;

  try {
    const [result] = await db.execute(
      `INSERT INTO subcategories (name, category_id, slug, description, image) VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), category_id, slug.trim().toLowerCase().replace(/\s+/g, "-"), description, image]
    );

    const [newRow] = await db.execute(`
      SELECT s.*, c.name AS category_name 
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `, [result.insertId]);

    res.status(201).json({ subcategory: newRow[0] });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Slug must be unique." });
    }
    res.status(500).json({ error: "Could not create subcategory." });
  }
});

// 3. UPDATE SUBCATEGORY (With upload.single middleware)
router.put("/subcategories/:id", upload.single("imageFile"), async (req, res) => {
  const errors = validateSubcategory(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const { name, category_id, slug, description = "" } = req.body;

  try {
    // 1. Fetch current subcategory to retain existing image fallback if no new file is uploaded
    const [current] = await db.execute("SELECT image FROM subcategories WHERE id = ?", [req.params.id]);
    if (!current.length) return res.status(404).json({ error: "Subcategory not found." });

    let image = current[0].image;
    if (req.file) {
      image = req.file.filename;
    }

    const [result] = await db.execute(
      `UPDATE subcategories SET name = ?, category_id = ?, slug = ?, description = ?, image = ? WHERE id = ?`,
      [name.trim(), category_id, slug.trim().toLowerCase().replace(/\s+/g, "-"), description, image, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Subcategory not found." });

    const [updatedRow] = await db.execute(`
      SELECT s.*, c.name AS category_name 
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `, [req.params.id]);

    res.json({ subcategory: updatedRow[0] });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Slug must be unique." });
    }
    res.status(500).json({ error: "Could not update subcategory." });
  }
});

// 4. DELETE SUBCATEGORY
router.delete("/subcategories/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM subcategories WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Subcategory not found." });
    res.json({ message: "Subcategory deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete subcategory." });
  }
});

export default router;