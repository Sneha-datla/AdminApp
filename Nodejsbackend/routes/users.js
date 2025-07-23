const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { db } = require("../firebase"); // adjust the path if needed

// 🔐 Signup - Add new user to Firestore
const counterRef = db.collection("counters").doc("users");

const userRef = db.collection("users");

router.post("/signup", async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  try {
    // Check if user already exists
    const snapshot = await userRef.where("email", "==", email).get();
    if (!snapshot.empty) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the current counter value
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

    // Add user with ID = currentId
    await userRef.doc(currentId.toString()).set(newUser);

    // Update the counter
    await counterRef.set({ value: currentId });

    res.status(201).json({ message: "User created", id: currentId });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});


// 👥 Get all users (excluding password)
router.get("/all", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
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
    console.error("Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});



// Delete User by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const userDoc = await userRef.doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    await userRef.doc(id).delete();
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// 🔐 Login by email or phone
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const snapshot = await userRef
      .where("email", "==", identifier)
      .get();

    let userDoc = null;

    if (snapshot.empty) {
      const phoneSnap = await userRef.where("phone", "==", identifier).get();
      if (!phoneSnap.empty) {
        userDoc = phoneSnap.docs[0];
      }
    } else {
      userDoc = snapshot.docs[0];
    }

    if (!userDoc) {
      return res.status(401).json({ error: "Invalid email/phone or password" });
    }

    const user = userDoc.data();
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email/phone or password" });
    }

    res.status(200).json({ message: "Login successful", user: { id: userDoc.id, fullName: user.fullName } });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ✏️ Update User by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, password } = req.body;

  try {
    const userDocRef = userRef.doc(id);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updateData.password = hashed;
    }

    await userDocRef.update(updateData);
    const updated = await userDocRef.get();

    res.status(200).json({
      message: "User updated",
      user: {
        id: updated.id,
        fullName: updated.data().fullName,
        email: updated.data().email,
        phone: updated.data().phone,
      },
    });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

//  Save address
//  Save address - Only for registered users
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

  //  Reject if no userId provided
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Missing userId" });
  }

  try {
    //  Check if userId exists in Firestore
    const userDoc = await userRef.doc(userId).get();

    if (!userDoc.exists) {
      return res.status(403).json({ message: "Access denied: Invalid userId" });
    }

    //  Proceed to save address
    await db.collection("addresses").add({
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
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ message: "Address saved successfully" });
  } catch (err) {
    console.error("Address Error:", err);
    res.status(500).json({ message: "Database error while saving address" });
  }
});

//  Get addresses by userId
router.get("/loginaddress", async (req, res) => {
  const { userId } = req.query;

  try {
    const snapshot = await db
      .collection("addresses")
      .where("userId", "==", userId)
      .get();

    const addresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(addresses);
  } catch (err) {
    console.error("Address Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

module.exports = router;
