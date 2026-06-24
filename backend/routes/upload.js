// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const auth = require('../middleware/auth');

// const router = express.Router();

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/'),
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, unique + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
//   fileFilter: (req, file, cb) => {
//     const allowed = /jpeg|jpg|png|gif|webp/;
//     const ext = allowed.test(path.extname(file.originalname).toLowerCase());
//     const mime = allowed.test(file.mimetype);
//     cb(null, ext && mime);
//   }
// });

// router.post('/', auth, upload.single('file'), (req, res, next) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file uploaded' });
//   }
//   const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
//   res.json({ url });
// });

// // Multer error handling
// router.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({ error: err.message });
//   }
//   next(err);
// });

// module.exports = router;


const express = require('express');
const multer  = require('multer');
const path    = require('path');
const auth    = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// ── Supabase Storage client ───────────────────────────────────────────────
// Uses the service-role key so uploads bypass RLS.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const BUCKET = 'site-images'; // create this bucket in Supabase Storage

// ── Multer: memory storage so we can stream the buffer to Supabase ────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|avif/;
    const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk  = allowed.test(file.mimetype);
    cb(null, extOk && mimeOk);
  },
});

// POST /api/upload  (admin only)
router.post('/', auth, upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No valid image file provided' });
  }

  try {
    // Build a unique path inside the bucket
    const ext      = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = `uploads/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError.message);
      return res.status(500).json({ error: 'Upload failed: ' + uploadError.message });
    }

    // Get the permanent public URL
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    res.json({ url: data.publicUrl });
  } catch (err) {
    next(err);
  }
});

// Multer error handling
router.use((err, _req, res, next) => {
  if (err && err.constructor && err.constructor.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;