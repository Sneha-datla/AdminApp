const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pool = require("../db"); // PostgreSQL pool
const router = express.Router();

// Upload folder setup
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// POST: /api/goldloan/add
router.post("/add", upload.array("images", 5), async (req, res) => {
  try {
    const {
      bank,
      fullname,
      mobile,
      address,
      goldweight,
      goldtype,
      idproof,
      loanamount,
      remarks
    } = req.body;

    // Get file paths from uploaded images
    const imagePaths = req.files.map(file => file.path);

    const result = await pool.query(
      `INSERT INTO GoldLoanRequest (
         bank, fullname, mobile, address,
        goldweight, goldtype, idproof, loanamount, remarks,image
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10
      ) RETURNING *`,
      [
        imagePaths,
        bank,
        fullname,
        mobile,
        address,
        goldweight,
        goldtype,
        idproof,
        loanamount,
        remarks
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting gold loan request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
