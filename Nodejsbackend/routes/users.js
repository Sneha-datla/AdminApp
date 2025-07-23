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
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
// login.js
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or phone

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $1',
      [identifier]
    );

    const user = userResult.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email/phone or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email/phone or password' });

    res.status(200).json({ message: 'Login successful', user: { id: user.id, fullName: user.full_name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Update user route
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, password } = req.body;

  try {
    // Check if password is provided and hash it if so
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update user fields conditionally
    const updateQuery = `
      UPDATE users
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          password = COALESCE($4, password)
      WHERE id = $5
      RETURNING id, full_name, email, phone
    `;

    const values = [
      fullName || null,
      email || null,
      phone || null,
      hashedPassword || null,
      id
    ];

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User updated', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});
router.post('/addresses', async (req, res) => {
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

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    await pool.query(
      `INSERT INTO addresses
        (user_id, name, mobile, pincode, flat, street, cod, city, state, landmark, address_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [userId, name, mobile, pincode, flat, street, cod, city, state, landmark, addressType]
    );

    res.status(200).json({ message: 'Address saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});
router.get('/loginaddress', async (req, res) => {
  const userId = req.query.userId;
  const result = await pool.query('SELECT * FROM addresses WHERE user_id = $1', [userId]);
  res.json(result.rows);
});



module.exports = router;
