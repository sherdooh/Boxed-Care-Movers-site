require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS - allow your frontend
app.use(cors({
  origin: [
    'https://boxedwithcare.co.ke',
    'https://www.boxedwithcare.co.ke',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running on Vercel!' });
});

// Routes
app.use('/api/content', require('./routes/content'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/login', require('./routes/login'));
app.use('/api/me', require('./routes/me'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/google-reviews', require('./routes/googleReviews'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/sitemap.xml', require('./routes/sitemap'));
// backend/server.js 






app.get('/api/ai/debug', async (req, res) => {
  const results = {};

  try {
    const pkg = require('@google/generative-ai');
    results.package = '✅ installed';
    results.GoogleGenerativeAI = typeof pkg.GoogleGenerativeAI;
  } catch (e) {
    results.package = `❌ NOT installed: ${e.message}`;
  }

  results.apiKey = process.env.GEMINI_API_KEY
    ? `✅ set (starts with: ${process.env.GEMINI_API_KEY.slice(0, 6)}...)`
    : '❌ NOT SET';

  // Test each model separately and show FULL error
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const modelsToTest = ['gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  results.models = {};

  for (const modelName of modelsToTest) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello in one word');
      results.models[modelName] = `✅ ${result.response.text()}`;
    } catch (e) {
      // Full error details
      results.models[modelName] = {
        message: e.message,
        status: e.status || e.statusCode || 'unknown',
        code: e.code || 'none',
      };
    }
  }

  res.json(results);
});








app.use('/api/ai', require('./routes/ai'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use(errorHandler);


// ✅ Export for Vercel
module.exports = app;