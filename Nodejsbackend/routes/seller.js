const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { db } = require("../firebase"); // Make sure firebase.js exports { db }

const router = express.Router();

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 🔧 Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/**
 * 🔹 POST /sellergold/add
 * Adds seller gold with multiple images
 */
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

    const newDoc = {
      name,
      category,
      weight,
      purity,
      condition,
      price: parseFloat(price),
      description,
      images: imagePaths,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("sellergold").add(newDoc);

    res.status(201).json({
      message: "Seller gold product added successfully",
      id: docRef.id,
      data: newDoc
    });
  } catch (err) {
    console.error("Error adding seller gold:", err.message);
    res.status(500).json({ error: "Failed to add seller gold product" });
  }
});

/**
 * 🔹 GET /sellergold/all
 * Fetch all seller gold products
 */
router.get("/all", async (req, res) => {
  try {
    const snapshot = await db.collection("sellergold").orderBy("createdAt", "desc").get();

    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching seller gold:", err.message);
    res.status(500).json({ error: "Failed to fetch seller gold products" });
  }
});

/**
 * 🔹 DELETE /sellergold/:id
 * Deletes a product and its images from disk
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = db.collection("sellergold").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const { images = [] } = doc.data();

    // Delete images from filesystem
    images.forEach((imgPath) => {
      const filePath = imgPath.replace("/uploads/", "uploads/");
      fs.unlink(filePath, (err) => {
        if (err) console.warn("Image delete failed:", filePath, err.message);
      });
    });

    // Delete Firestore document
    await docRef.delete();

    res.status(200).json({ message: "Seller gold product deleted successfully" });
  } catch (err) {
    console.error("Error deleting seller gold:", err.message);
    res.status(500).json({ error: "Failed to delete seller gold product" });
  }
});

module.exports = router;
