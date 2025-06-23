const express = require('express');
const router = express.Router();
const pool = require('../db'); // your PostgreSQL pool
const bcrypt = require('bcrypt');

// Signup Route
router.post('/signup', async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (full_name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [fullName, email, phone, hashedPassword]
    );

    res.status(201).json({ message: 'User created', user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});
router.get('/all', async (req, res) => {
  try {
    const users = await pool.query('SELECT id, full_name, email, phone FROM users');
    res.status(200).json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
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
  const { username, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login error' });
  }
});


module.exports = router;
