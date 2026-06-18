const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper: Fetch all content
const fetchContentAsObject = async () => {
    const result = await pool.query('SELECT "key", value FROM site_content');
    return result.rows.reduce((acc, row) => {
        try {
            acc[row.key] = JSON.parse(row.value);
        } catch {
            acc[row.key] = row.value;
        }
        return acc;
    }, {});
};

// Helper: Save content
const saveContentObject = async (contentObject) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const [key, value] of Object.entries(contentObject)) {
            const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
            await client.query(
                'INSERT INTO site_content ("key", value) VALUES ($1, $2) ON CONFLICT ("key") DO UPDATE SET value = EXCLUDED.value',
                [key, valueToStore]
            );
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// GET /api/content – public
router.get('/', async (req, res, next) => {
    try {
        const content = await fetchContentAsObject();
        res.json(content);
    } catch (err) {
        console.error('Error fetching content:', err);
        next(err);
    }
});

// POST /api/content – admin
router.post('/', auth, async (req, res, next) => {
    try {
        await saveContentObject(req.body);
        res.json(req.body);
    } catch (err) {
        console.error('Error saving content:', err);
        next(err);
    }
});

module.exports = router;