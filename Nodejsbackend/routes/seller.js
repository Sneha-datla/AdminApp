const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pool = require("../db");

const router = express.Router();

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Add seller gold with multiple images
router.post("/add", upload.array("images", 10), async (req, res) => {
  const {
    name,
    category,
    weight,
    purity,
    condition,
    price,
    description
  } = req.body;

  const files = req.files || [];

  try {
    const imagePaths = files.map(file => `/uploads/${file.filename}`);

    const result = await pool.query(
      `INSERT INTO sellergold (name, category, weight, purity, condition, price, description, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, category, weight, purity, condition, price, description, imagePaths]
    );

    res.status(201).json({
      message: "Seller gold product added successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error inserting seller gold product:", err.message);
    res.status(500).json({ error: "Failed to add seller gold product" });
  }
});

module.exports = router;
