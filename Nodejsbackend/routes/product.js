// routes/product.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { db } = require("../firebase"); // make sure this points to your Firestore setup

const router = express.Router();

// 🧪 Test route
router.get("/", (req, res) => {
  res.send("Product route working");
});

// ✅ Create uploads directory if not exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Setup multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Add a product with image upload
router.post("/add", upload.array("image_urls", 10), async (req, res) => {
  const { productId, title, purity, price, stock, featured } = req.body;
  const files = req.files || [];

  try {
    const imagePaths = files.map((file) => `/uploads/${file.filename}`);

    const productData = {
      productId,
      title,
      purity,
      price: parseFloat(price),
      stock: parseInt(stock),
      featured: featured === "true",
      image_urls: imagePaths,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("products").add(productData);

    res.status(201).json({
      message: "Product added",
      id: docRef.id,
      product: productData,
    });
  } catch (err) {
    console.error("Error adding product:", err.message);
    res.status(500).json({ error: "Product creation failed" });
  }
});

// ✅ Get all products
router.get("/all", async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ✅ Delete product by Firestore document ID
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const docRef = db.collection("products").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = doc.data();
    const imageUrls = product.image_urls || [];

    // Delete image files from local filesystem
    imageUrls.forEach((url) => {
      const filePath = path.join(".", url); // e.g., './uploads/filename.jpg'
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Delete product document
    await docRef.delete();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err.message);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
