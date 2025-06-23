const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pool = require("../db");
const router = express.Router();

// Create uploads folder if not exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

// POST /orders with file upload
router.post("/orders", upload.array("image", 5), async (req, res) => {
  try {
    const { title, description, purity, price, status } = req.body;

    // Get file paths from uploaded images
    const imagePaths = req.files.map((file) => file.path);

    const result = await pool.query(
      `INSERT INTO orders (image, title, description, purity, price, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [imagePaths, title, description, purity, price, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});




router.get("/all", async(req,res) =>{
try{
    const result = await pool.query(`SELECT * FROM orders ORDER BY created_at DESC`);
    res.status(200).json(result.rows);

}catch{
    res.status(500).json({ error: "Server error" });

}
});
module.exports = router;
