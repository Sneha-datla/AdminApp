const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { admin, db } = require("../firebase");

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

router.post('/addcart', async (req, res) => {
  const { userId, productId, product } = req.body;

  if (!userId || !productId || !product) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const cartRef = db.collection('carts').doc(userId).collection('items').doc(productId);

    const existingItem = await cartRef.get();

    if (existingItem.exists) {
      // If product exists, just increment quantity
      await cartRef.update({
        quantity: admin.firestore.FieldValue.increment(product.quantity),
      });
    } else {
      // Save full product info including weight and purity
      await cartRef.set({
        image: product.image,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        weight: product.weight,
        purity: product.purity,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({ message: 'Product added to cart successfully' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
router.post("/checkout", async (req, res) => {
  const {
    userId,
    addressId,
    subtotal,
    shipping,
    totalAmount,
    paymentMethod,
    expectedDelivery,
  } = req.body;

  try {
    // ✅ 1. Fetch and validate address from nested collection
    const addressDoc = await db
      .collection("users")
      .doc(userId.toString())
      .collection("addresses")
      .doc(addressId)
      .get();

    if (!addressDoc.exists) {
      return res.status(400).json({ error: "Address not found" });
    }

    const addressData = addressDoc.data();

    // Optional: If your address structure ensures only the user can access their own addresses,
    // you may skip this next userId check since it's nested under their user doc

    // ✅ 2. Fetch cart items from 'cart' collection
    const cartSnapshot = await db.collection("cart")
      .where("userId", "==", userId)
      .get();

    if (cartSnapshot.empty) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // ✅ 3. Build detailed order summary
    const orderSummary = await Promise.all(
      cartSnapshot.docs.map(async (doc) => {
        const { productId, quantity } = doc.data();
        const productDoc = await db.collection("products").doc(productId).get();
        const product = productDoc.exists ? productDoc.data() : {};

        return {
          productId,
          name: product?.name || "Unknown Product",
          price: product?.price || 0,
          quantity,
          image: product?.image || null,
        };
      })
    );

    // ✅ 4. Create the order
    await db.collection("orders").add({
      userId,
      addressId,
      address: addressData,
      orderSummary,
      subtotal,
      shipping,
      totalAmount,
      paymentMethod,
      expectedDelivery,
      orderDate: new Date().toISOString(),
      status: "Pending",
    });

    // ✅ 5. Clear cart after order
    const batch = db.batch();
    cartSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    res.status(200).json({ message: "Order placed successfully" });

  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = router;
