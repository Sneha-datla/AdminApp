const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const { db } = require("../firebase");

const router = express.Router();

// ✅ Test route
router.get("/", (req, res) => {
  res.send("Product route working");
});

// ✅ Multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products", // Optional folder name in Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => Date.now() + "-" + file.originalname,
  },
});

const upload = multer({ storage });

// ✅ Add product with Cloudinary image upload
router.post("/add", upload.array("image_urls", 10), async (req, res) => {
  const { productId, title, purity, price, stock, featured } = req.body;
  const files = req.files || [];

  try {
    const imageUrls = files.map(file => file.path); // Cloudinary hosted URLs

    const productData = {
      productId,
      title,
      purity,
      price: parseFloat(price),
      stock: parseInt(stock),
      featured: featured === "true",
      image_urls: imageUrls,
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

// ✅ Delete product and remove images from Cloudinary
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  const getPublicIdFromUrl = (url) => {
    const parts = url.split("/");
    const filename = parts[parts.length - 1].split(".")[0]; // without extension
    return `products/${filename}`;
  };

  try {
    const docRef = db.collection("products").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = doc.data();
    const imageUrls = product.image_urls || [];

    // ✅ Delete images from Cloudinary
    await Promise.all(imageUrls.map((url) => {
      const publicId = getPublicIdFromUrl(url);
      return cloudinary.uploader.destroy(publicId);
    }));

    // ✅ Delete product from Firestore
    await docRef.delete();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err.message);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
