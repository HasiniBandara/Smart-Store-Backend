import { Router } from 'express';
import pool from '../db';

const router = Router();

// Get all products
// check using :
// GET http://localhost:3000/products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST create product
// check using :
// POST http://localhost:3000/products
//postman - body tab - raw - JSON - details
router.post('/', async (req, res) => {
  try {
    const { name, description, price, stock, category_id } = req.body;

    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, category_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, price, stock, category_id],
    );

    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Add a new product
// check using :
// POST http://localhost:3000/products
//postman - body tab - raw - JSON - details
router.post('/', async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock, category_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description, price, stock, category_id],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET product by ID
// check using :
// GET http://localhost:3000/products/1
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
  'SELECT * FROM products WHERE id = $1',
  [id],
);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    }
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// UPDATE product
// check using :
// PUT http://localhost:3000/products/1
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category_id } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET name=$1, description=$2, price=$3, stock=$4, category_id=$5
       WHERE id=$6
       RETURNING *`,
      [name, description, price, stock, category_id, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
// check using :
// DELETE http://localhost:3000/products/1
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    }
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
