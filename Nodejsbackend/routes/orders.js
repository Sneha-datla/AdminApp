const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { db } = require("../firebase"); // Ensure your firebase.js exports { db }

const router = express.Router();

// ✅ Ensure uploads folder exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ POST /orders/add (Firestore + Multer)
router.post("/add", upload.array("image", 5), async (req, res) => {
  try {
    const { title, description, purity, price, status } = req.body;

    // 🖼️ Get uploaded image paths (relative)
    const imagePaths = req.files.map((file) => `/${file.path.replace(/\\/g, '/')}`);

    // 🗃️ Create new order object
    const newOrder = {
      title,
      description,
      purity,
      price: parseFloat(price),
      status,
      image: imagePaths,
      createdAt: new Date().toISOString(),
    };

    // 💾 Store to Firestore
    const docRef = await db.collection("orders").add(newOrder);

    res.status(201).json({ message: "Order added", id: docRef.id, order: newOrder });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET /orders/all (Fetch all orders from Firestore)
router.get("/all", async (req, res) => {
  try {
    const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();

    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(orders);
  } catch (err) {
    console.error("Fetching orders failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
