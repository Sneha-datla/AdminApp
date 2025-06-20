// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'CreatingApi',
  password: 'sneha1992',
  port: 5432,
});

module.exports = pool;
