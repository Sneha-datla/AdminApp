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
    // Removed .orderBy('createdAt', 'desc') to avoid index requirement
    const ordersSnapshot = await db
      .collection('orders')
      .where('userId', '==', userId)
      .get();

    const orders = [];

    for (const doc of ordersSnapshot.docs) {
      const data = doc.data();
      const orderSummary = data.orderSummary || [];

      const formattedOrderSummary = [];

      for (const item of orderSummary) {
        const productId = item.productId;
        let purity = null;

        // Fetch product details to get purity
        if (productId) {
          const productRef = db.collection('products').doc(productId);
          const productDoc = await productRef.get();

          if (productDoc.exists) {
            const productData = productDoc.data();
            purity = productData.purity || null;
          }
        }

        formattedOrderSummary.push({
          title: item.name,
          description: item.description,
          purity: purity,
          price: parseFloat(item.price),
          quantity: item.quantity,
          image: item.imagePaths || item.image,
        });
      }

      orders.push({
        orderId: doc.id,
        createdAt: data.createdAt || new Date().toISOString(),
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
  const { userId, productId, product } = req.body;

  if (!userId || !productId || !product) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const docId = `${userId}_${productId}`;
    const cartRef = db.collection('carts').doc(docId);

    const existingItem = await cartRef.get();

    if (existingItem.exists) {
      // If product exists, increment quantity
      await cartRef.update({
        quantity: admin.firestore.FieldValue.increment(product.quantity),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Save full product info directly in carts
      await cartRef.set({
        userId,
        productId,
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
    const cartSnapshot = await db.collection("carts")
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
          name: product?.title || "Unknown Product",
          price: product?.price || 0,
          quantity,
          image: product?.image_urls || null,
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
