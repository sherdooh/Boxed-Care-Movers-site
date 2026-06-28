// backend/routes/ai.js
const express = require('express');
const router = express.Router();

let GoogleGenerativeAI;
try {
  const genAI = require('@google/generative-ai');
  GoogleGenerativeAI = genAI.GoogleGenerativeAI;
} catch (err) {
  console.error('❌ @google/generative-ai not installed. Run: npm install @google/generative-ai');
}

const rateLimit = new Map();

const SYSTEM_PROMPT = `You are the AI assistant for Boxed With Care Movers, a professional moving and packing company based in Nairobi, Kenya.

Your job is to help customers with:
- Getting a moving quote (ask: from location, to location, move date, property size)
- Packing tips and advice
- Understanding the moving process
- Answering questions about services: residential moving, office relocation, packing, long-distance moving, storage, furniture assembly
- Pricing guidance (quote requests are handled via the website form)

Business details:
- Phone: +254 748 851 679
- Email: info@boxedwithcare.co.ke
- Website: https://boxedwithcare.co.ke
- Operating hours: Mon–Sat 7:00 AM – 7:00 PM, Sun 8:00 AM – 4:00 PM
- Service area: Nairobi and nationwide Kenya

Rules:
- Be friendly, concise, and helpful
- Always respond in the same language the customer uses
- For complex quotes, direct them to the quote form on the website or to call
- Never make up prices — say pricing depends on distance, volume, and access
- Keep replies under 150 words unless explaining something technical
- Do not discuss topics unrelated to moving, packing, or the business`;

router.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: 'Message too long. Keep it under 500 characters.' });
  }

  if (!GoogleGenerativeAI) {
    return res.status(500).json({ reply: 'AI service is not available. Please call us at +254 748 851 679.' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ reply: 'AI service is not configured. Please call us at +254 748 851 679.' });
  }

  // Rate limiting — 10 requests per hour per IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const key = `rate_${ip}`;
  const now = Date.now();
  const WINDOW = 60 * 60 * 1000;
  const MAX_REQUESTS = 10;

  if (rateLimit.has(key)) {
    const data = rateLimit.get(key);
    if (now - data.timestamp < WINDOW) {
      if (data.count >= MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests. Please call us at +254 748 851 679.' });
      }
      data.count++;
    } else {
      rateLimit.set(key, { timestamp: now, count: 1 });
    }
  } else {
    rateLimit.set(key, { timestamp: now, count: 1 });
  }

  const fullPrompt = `${SYSTEM_PROMPT}\n\nCustomer message: ${message.trim()}`;

  // correct model names fromAPI key
  const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let reply = null;

  for (const modelName of MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullPrompt);
      reply = result.response.text();
      if (reply) {
        console.log(`✅ Success with: ${modelName}`);
        break;
      }
    } catch (e) {
      console.warn(`❌ ${modelName} failed: ${e.message}`);
    }
  }

  if (!reply) {
    return res.status(500).json({ reply: 'I am temporarily unavailable. Please call us at +254 748 851 679.' });
  }

  res.json({ reply });
});

module.exports = router;