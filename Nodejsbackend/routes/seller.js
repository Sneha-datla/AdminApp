const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { db } = require("../firebase");
const cloudinary = require("../cloudinary"); // Cloudinary config
const router = express.Router();

// ✅ Setup Cloudinary storage with multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "seller",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const upload = multer({ storage });

/**
 * 🔹 POST /sellergold/add
 * Add a new product with image uploads to Cloudinary
 */
router.post("/add", upload.array("images", 10), async (req, res) => {
  const {
    name,
    category,
    weight,
    purity,
    condition,
    price,
    description,
  } = req.body;

  const files = req.files || [];

  if (files.length === 0) {
    return res.status(400).json({ error: "No images uploaded" });
  }

  try {
    const imageData = files.map(file => file.path);

    const newDoc = {
      name,
      category,
      weight,
      purity,
      condition,
      price: parseFloat(price),
      description,
      images: imageData,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("sellergold").add(newDoc);

    res.status(201).json({
      message: "Seller gold product added successfully",
      id: docRef.id,
      data: newDoc,
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
    const snapshot = await db.collection("sellergold").get();
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching seller gold:", err.message);
    res.status(500).json({ error: "Failed to fetch seller gold products" });
  }
});

/**
 * 🔹 DELETE /sellergold/:id
 * Deletes a product and its Cloudinary images
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

    // Delete images from Cloudinary
    await Promise.all(
      images.map(async (img) => {
        try {
          await cloudinary.uploader.destroy(img.public_id);
        } catch (err) {
          console.warn("Failed to delete Cloudinary image:", img.public_id, err.message);
        }
      })
    );

    // Delete Firestore document
    await docRef.delete();

    res.status(200).json({ message: "Seller gold product deleted successfully" });
  } catch (err) {
    console.error("Error deleting seller gold:", err.message);
    res.status(500).json({ error: "Failed to delete seller gold product" });
  }
});

module.exports = router;
