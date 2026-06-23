const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const buildUniqueSlug = async (baseSlug, excludeId = null) => {
  let candidate = baseSlug || 'blog-post';
  let suffix = 2;

  while (true) {
    const params = excludeId ? [candidate, excludeId] : [candidate];
    const query = excludeId
      ? 'SELECT id FROM blog_posts WHERE slug = $1 AND id <> $2 LIMIT 1'
      : 'SELECT id FROM blog_posts WHERE slug = $1 LIMIT 1';
    const result = await pool.query(query, params);
    if (result.rowCount === 0) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

// GET /api/blogs - public
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, title, excerpt, content, image_url AS image, category, slug, published_at, created_at, updated_at FROM blog_posts ORDER BY published_at DESC'
    );
    res.json(result.rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      excerpt: row.excerpt || '',
      content: row.content || '',
      image: row.image || '',
      category: row.category || '',
      slug: row.slug || '',
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (err) {
    console.error('Error fetching blog posts:', err);
    next(err);
  }
});

// POST /api/blogs - create (admin)
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, excerpt, content, image_url, image, category, slug } = req.body;
    const baseSlug = slug || (title ? slugify(title) : null);
    const finalSlug = await buildUniqueSlug(baseSlug);
    const finalImageUrl = image_url || image || null;

    const result = await pool.query(
      `INSERT INTO blog_posts (title, excerpt, content, image_url, category, slug)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, title, excerpt, content, image_url AS image, category, slug, published_at, created_at, updated_at`,
      [title, excerpt, content, finalImageUrl, category, finalSlug]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: String(row.id),
      title: row.title,
      excerpt: row.excerpt || '',
      content: row.content || '',
      image: row.image || '',
      category: row.category || '',
      slug: row.slug || '',
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error('Error creating blog post:', err);
    next(err);
  }
});

// PUT /api/blogs/:id - update (admin)
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, image_url, image, category, slug, published_at } = req.body;
    const baseSlug = slug || (title ? slugify(title) : null);
    const finalSlug = await buildUniqueSlug(baseSlug, id);
    const finalImageUrl = image_url || image || null;

    const result = await pool.query(
      `UPDATE blog_posts SET title = $1, excerpt = $2, content = $3, image_url = $4, category = $5, slug = $6, published_at = COALESCE($7, published_at), updated_at = now()
       WHERE id = $8 RETURNING id, title, excerpt, content, image_url AS image, category, slug, published_at, created_at, updated_at`,
      [title, excerpt, content, finalImageUrl, category, finalSlug, published_at, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    const row = result.rows[0];
    res.json({
      id: String(row.id),
      title: row.title,
      excerpt: row.excerpt || '',
      content: row.content || '',
      image: row.image || '',
      category: row.category || '',
      slug: row.slug || '',
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error('Error updating blog post:', err);
    next(err);
  }
});

// DELETE /api/blogs/:id - delete (admin)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting blog post:', err);
    next(err);
  }
});

module.exports = router;
