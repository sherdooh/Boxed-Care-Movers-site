// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limiting (simple in-memory)
const rateLimit = new Map();

router.post('/chat', async (req, res) => {
  const { message } = req.body;

  // Validate input
  if (!message || typeof message !== 'string' || message.length > 500) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  // Rate limit (10 per hour per IP)
  const ip = req.ip || req.connection.remoteAddress;
  const key = `rate_${ip}`;
  const now = Date.now();
  const window = 60 * 60 * 1000;
  if (rateLimit.has(key)) {
    const data = rateLimit.get(key);
    if (now - data.timestamp < window && data.count >= 10) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    data.count++;
  } else {
    rateLimit.set(key, { timestamp: now, count: 1 });
  }

  try {
    // Use Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // or 'gemini-2.0-flash-lite'

    // System prompt
    const systemPrompt = `You are a helpful AI assistant for Boxed With Care Movers, a professional moving company in Kenya.

      Business information:
      - Website: boxedwithcare.co.ke
      - Phone: +254 748 851 679
      - Email: info@boxedwithcare.co.ke
      - Services: Residential moving, office/commercial moving, professional packing, long-distance moving, storage solutions, furniture assembly.
      - Areas served: Nairobi, Mombasa, Kisumu, Eldoret, Nakuru, Kiambu, Thika, and all major towns in Kenya.
      - Pricing: We offer free, no-obligation quotes. Contact us for a personalised estimate based on your move size and distance.
      - What makes us special: Reliable, careful handling, transparent pricing, 24/7 support, fully insured.

      Rules:
      - Be friendly, professional, and concise.
      - Always mention our phone number +254 748 851 679 for urgent queries.
      - Encourage users to request a free quote via our website.
      - If you don't know something, suggest they call or email us.
      - Keep responses under 200 words.`;

    const fullPrompt = `${systemPrompt}\nUser: ${message}\nAssistant:`;

    const result = await model.generateContent(fullPrompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      reply: 'I am temporarily unavailable. Please call us at +254 748 851 679 for immediate assistance.'
    });
  }
});

module.exports = router;