const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { db } = require("../firebase"); // your Firestore init

const userRef = db.collection("users");
const counterRef = db.collection("counters").doc("users");

// 🔐 SIGNUP
router.post("/signup", async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  try {
    // Check if user exists
    const snapshot = await userRef.where("email", "==", email).get();
    if (!snapshot.empty) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate next user ID
    const counterDoc = await counterRef.get();
    let currentId = 1;
    if (counterDoc.exists) {
      currentId = counterDoc.data().value + 1;
    }

    const newUser = {
      fullName,
      email,
      phone,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      userId: currentId,
    };

    await userRef.doc(currentId.toString()).set(newUser);
    await counterRef.set({ value: currentId });

    res.status(201).json({ message: "User created", id: currentId });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// 🔓 LOGIN
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const snapshot = await userRef
      .where("email", "==", identifier)
      .get();

    const phoneSnapshot = await userRef
      .where("phone", "==", identifier)
      .get();

    let userDoc = snapshot.empty ? phoneSnapshot.docs[0] : snapshot.docs[0];

    if (!userDoc) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userDoc.data();
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.userId,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// 👥 GET ALL USERS (no passwords)
router.get("/all", async (req, res) => {
  try {
    const snapshot = await userRef.get();
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      };
    });
    res.status(200).json(users);
  } catch (err) {
    console.error("Fetch Users Error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

//  ADD ADDRESS for logged-in user
router.post("/addresses", async (req, res) => {
  const {
    userId,
    name,
    mobile,
    pincode,
    flat,
    street,
    cod,
    city,
    state,
    landmark,
    addressType,
  } = req.body;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const userDoc = await userRef.doc(userId.toString()).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const addressData = {
      name,
      mobile,
      pincode,
      flat,
      street,
      cod,
      city,
      state,
      landmark,
      addressType,
      createdAt: new Date().toISOString(),
    };

    await userRef
      .doc(userId.toString())
      .collection("addresses")
      .add(addressData);

    res.status(200).json({ message: "Address saved" });
  } catch (err) {
    console.error("Add Address Error:", err);
    res.status(500).json({ message: "Failed to save address" });
  }
});

//  GET ALL ADDRESSES for a user
router.get("/loginaddress", async (req, res) => {
  const { userId } = req.query;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const snapshot = await userRef
      .doc(userId.toString())
      .collection("addresses")
      .get();

    const addresses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(addresses);
  } catch (err) {
    console.error("Fetch Address Error:", err);
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
});

//  UPDATE USER
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, password } = req.body;

  try {
    const userDocRef = userRef.doc(id.toString());
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(phone && { phone }),
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.password = hashedPassword;
    }

    await userDocRef.update(updates);

    res.status(200).json({ message: "User updated", updates });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE USER
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const userDocRef = userRef.doc(id.toString());
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    await userDocRef.delete();
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});






module.exports = router;
