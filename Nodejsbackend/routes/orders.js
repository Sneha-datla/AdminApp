const express = require("express");
const fs = require("fs");
const path = require("path");
const { admin, db } = require("../firebase");

const router = express.Router();

// ✅ Ensure uploads folder exists


// ✅ POST /orders/add (Firestore + Multer)
// GET /orders/:userId
// GET /orders/:userId
router.get('/list/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const ordersSnapshot = await db
      .collection('orders')
      .where('userId', '==', userId)
      .get();

    const orders = [];

    for (const doc of ordersSnapshot.docs) {
      const data = doc.data();
      const orderSummary = data.orderSummary || [];

      const formattedOrderSummary = orderSummary.map((item) => ({
        title: item.name,
        description: item.description || '',
        purity: item.purity || null,
        price: parseFloat(item.price),
        quantity: item.quantity,
        image: item.imagePaths || item.image,
      }));

      orders.push({
        orderId: doc.id,
        createdAt: data.orderDate || new Date().toISOString(),
        status: data.status || 'unknown', // ✅ Get status directly
        address: data.address || null,
        orderSummary: formattedOrderSummary,
      });
    }

    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
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
  const { userId, product } = req.body;

  if (!userId || !product || !product.name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Just add a new cart item (no custom ID)
    await db.collection('carts').add({
      userId,
      image: product.image,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      weight: product.weight,
      purity: product.purity,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ message: 'Product added to cart successfully' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ GET /cart/:userId - Get cart items by userId
router.get('/cartlist/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const cartSnapshot = await db
      .collection('carts')
      .where('userId', '==', userId)
      .get();

    if (cartSnapshot.empty) {
      return res.status(200).json({ cart: [] }); // Return empty cart if no items
    }

    const cartItems = cartSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ cart: cartItems });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ error: 'Failed to fetch cart items' });
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

    // ✅ 2. Fetch cart items from 'carts' collection
    const cartSnapshot = await db.collection("carts")
      .where("userId", "==", userId)
      .get();

    if (cartSnapshot.empty) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // ✅ 3. Build order summary directly from cart data
    const orderSummary = cartSnapshot.docs.map((doc) => {
      const {
       name,
        price,
        quantity,
        purity,
        image
      } = doc.data();

      return {
        name: name || "Unknown Product",
        price: price || 0,
        quantity,
       purity: purity || null,
      image: image || null
      };
    });

    // ✅ 4. Create the order with status
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
      status: "processing" // ✅ default status
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
