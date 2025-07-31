const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary");
const pool = require("../db");

const router = express.Router();

// Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "goldloan",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const upload = multer({ storage });

/**
 * POST /goldloan/add
 */
router.post("/add", upload.array("image", 5), async (req, res) => {
  const {
    bank,
    fullname,
    mobile,
    address,
    goldweight,
    goldtype,
    idproof,
    loanamount,
    remarks,
  } = req.body;

  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ error: "No images uploaded" });
  }

  const imagePaths = files.map((file) => file.path);

  try {
    const query = `
      INSERT INTO goldloanrequest (
        image, bank, fullname, mobile, address,
        goldweight, goldtype, idproof, loanamount, remarks, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, NOW()
      ) RETURNING *;
    `;

    const values = [
      imagePaths,
      bank,
      fullname,
      mobile,
      address,
      goldweight,
      goldtype,
      idproof,
      parseFloat(loanamount),
      remarks,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Gold loan request added successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("DB Insert Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /goldloan/all
 */
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM goldloanrequest ORDER BY created_at ASC");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

/**
 * DELETE /goldloan/:id
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const selectQuery = "SELECT * FROM goldloanrequest WHERE id = $1";
    const selectResult = await pool.query(selectQuery, [id]);

    if (selectResult.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    const images = selectResult.rows[0].image || [];

    await Promise.all(
      images.map(async (imgUrl) => {
        const publicId = imgUrl.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`goldloan/${publicId}`);
        } catch (err) {
          console.warn("Cloudinary delete failed:", err.message);
        }
      })
    );

    await pool.query("DELETE FROM goldloanrequest WHERE id = $1", [id]);

    res.status(200).json({ message: "Gold loan request deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
