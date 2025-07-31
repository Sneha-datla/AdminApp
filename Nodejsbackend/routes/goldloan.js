const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { db } = require("../firebase"); // Firestore instance
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary"); // Cloudinary config

const router = express.Router();

// ✅ Setup Cloudinary storage with multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "goldloan",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const upload = multer({ storage });

/**
 * 🔹 POST /goldloan/add
 * Add new gold loan request
 */
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
    
const files = req.files || [];

  if (files.length === 0) {
    return res.status(400).json({ error: "No images uploaded" });
  }
    const imagePaths = files.map(file => file.path);

    const newRequest = {
      image: imagePaths,
      bank,
      fullname,
      mobile,
      address,
      goldweight,
      goldtype,
      idproof,
      loanamount: parseFloat(loanamount),
      remarks,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("goldloanrequest").add(newRequest);

    res.status(201).json({
      message: "Gold loan request added successfully",
      id: docRef.id,
      data: newRequest,
    });
  } catch (err) {
    console.error("Error inserting gold loan request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 🔹 GET /goldloan/all
 * Fetch all gold loan requests
 */
router.get("/all", async (req, res) => {
  try {
    const snapshot = await db.collection("goldloanrequest").orderBy("createdAt", "asc").get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching gold loan requests:", err);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

/**
 * 🔹 DELETE /goldloan/:id
 * Delete a gold loan request and its images
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = db.collection("goldloanrequest").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Record not found" });
    }

    const { image = [] } = doc.data();

    // Delete image files from disk
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

    res.status(200).json({ message: "Gold loan request deleted successfully" });
  } catch (err) {
    console.error("Error deleting record:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
