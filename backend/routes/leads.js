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

    // Build an object of all possible fields, defaulting to null
    const leadData = {
        id,
        date,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        from_location: req.body.from_location || null,
        to_location: req.body.to_location || null,
        current_floor: req.body.current_floor || null,
        destination_floor: req.body.destination_floor || null,
        current_size: req.body.current_size || null,
        destination_size: req.body.destination_size || null,
        move_date: req.body.move_date || null,
        move_type: req.body.move_type || null,
        message: req.body.message || null,
        quoteNumber: req.body.quoteNumber || null,
    };

    // Convert to arrays for the INSERT query
    const columns = Object.keys(leadData);
    const values = Object.values(leadData);

    // Build the placeholders (?, ?, ...)
    const placeholders = values.map(() => '?').join(',');

    try {
        const query = `INSERT INTO leads (${columns.join(',')}) VALUES (${placeholders})`;
        const [result] = await pool.execute(query, values);

        res.status(201).json(leadData);
    } catch (err) {
        console.error('❌ Database error:', err);
        res.status(500).json({ error: err.message });
        next(err);
    }
});

// GET /api/leads – admin only
router.get('/', auth, async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching leads:', err);
        next(err);
    }
});

// DELETE /api/leads/:id – admin only
router.delete('/:id', auth, async (req, res, next) => {
    try {
        const [result] = await pool.execute('DELETE FROM leads WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting lead:', err);
        next(err);
    }
});

module.exports = router;