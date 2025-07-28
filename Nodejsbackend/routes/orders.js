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

      // ✅ Map each product in the orderSummary array
      const formattedProducts = orderSummary.map((item) => ({
        title: item.name || "Unknown Product",
        quantity: item.quantity || 1,
        purity: item.purity || null,
        price:item.price||0,
        image: item.imagePaths || item.image || null
      }));

      // ✅ Push full order details with all products
      orders.push({
        orderId: doc.id,
        createdAt: data.orderDate || new Date().toISOString(),
        status: data.status || 'unknown',
        address: data.address || null,
        totalAmount: parseFloat(data.totalAmount || 0),
        ordersummary: formattedProducts // <-- full array of items
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
router.delete('/cartdelete/:cartId', async (req, res) => {
  const { cartId } = req.params;

  if (!cartId) {
    return res.status(400).json({ message: 'Cart ID is required' });
  }

  try {
    const cartRef = db.collection('carts').doc(cartId);
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await cartRef.delete();

    return res.status(200).json({ message: 'Cart item deleted successfully' });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



router.post("/checkout", async (req, res) => {
  const {
    userId,
    addressId,
    paymentMethod,
    expectedDelivery,
  } = req.body;

  try {
    // ✅ 1. Fetch and validate address
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

    // ✅ 2. Fetch all cart items for the user
    const cartSnapshot = await db
      .collection("carts")
      .where("userId", "==", userId)
      .get();

    if (cartSnapshot.empty) {
      return res.status(400).json({ error: "No items in cart" });
    }

    const orderSummary = [];
    let subtotal = 0;

    cartSnapshot.forEach((doc) => {
      const item = doc.data();
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      subtotal += itemTotal;

      orderSummary.push({
        name: item.name || "Unknown Product",
        price: item.price || 0,
        quantity: item.quantity || 1,
        purity: item.purity || null,
        image: item.image || null,
      });
    });

    const shipping = 0;
    const totalAmount = subtotal + shipping;

    // ✅ 3. Create order
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
      status: "processing",
    });

    // ✅ 4. Delete all cart items for the user
    const batch = db.batch();
    cartSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.status(200).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.post('/update-status', async (req, res) => {
  const { orderId, status } = req.body;
  try {
    const orderRef = db.collection('orders').doc(orderId);
    await orderRef.update({ status });
    res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});



module.exports = router;
