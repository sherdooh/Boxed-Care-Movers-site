const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/leads – public
router.post('/', [
    body('name').notEmpty().trim(),
    body('email').isEmail(),
    body('phone').notEmpty(),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const id = req.body.id || Date.now().toString();
    const date = new Date().toLocaleString();

    const {
        name, email, phone, from_location, to_location,
        current_floor, destination_floor, current_size,
        destination_size, move_date, move_type, message, quoteNumber
    } = req.body;

    try {
        const query = `
            INSERT INTO leads 
            (id, date, name, email, phone, from_location, to_location, 
             current_floor, destination_floor, current_size, destination_size, 
             move_date, move_type, message, quoteNumber) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *;
        `;
        const values = [id, date, name, email, phone, from_location, to_location,
             current_floor, destination_floor, current_size, destination_size,
             move_date, move_type, message, quoteNumber];
        
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating lead:', err);
        next(err);
    }
});

// GET /api/leads – admin
router.get('/', auth, async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching leads:', err);
        next(err);
    }
});

// DELETE /api/leads/:id – admin
router.delete('/:id', auth, async (req, res, next) => {
    try {
        const result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting lead:', err);
        next(err);
    }
});

module.exports = router;