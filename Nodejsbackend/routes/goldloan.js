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
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// POST: /api/goldloan/add
router.post("/add", upload.array("image", 5), async (req, res) => {
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
      `INSERT INTO goldloanrequest (
        image, bank, fullname, mobile, address,
        goldweight, goldtype, idproof, loanamount, remarks
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


router.get("/all",async(req,res)=>{
    try{
 const result=await pool.query("SELECT * FROM goldloanrequest ORDER BY id ASC")
     res.status(200).json(result.rows);

    }catch{ 
    res.status(500).json({ error: "Failed to fetch products" });

    }

});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // First fetch the record to get image paths
    const getResult = await pool.query("SELECT image FROM goldloanrequest WHERE id = $1", [id]);

    if (getResult.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    const imagePaths = getResult.rows[0].image;

    // Delete images from disk
    imagePaths.forEach((filePath) => {
      fs.unlink(filePath, (err) => {
        if (err) console.warn("Failed to delete image:", filePath);
      });
    });

    // Delete record from database
    await pool.query("DELETE FROM goldloanrequest WHERE id = $1", [id]);

    res.json({ message: "Gold loan request deleted successfully" });
  } catch (err) {
    console.error("Error deleting gold loan request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
