require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://localhost', 'http://localhost', 'https://sounvexa-ai.onrender.com'];
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
  res.json({
    app: 'Sounvexa AI',
    status: 'online',
    ai: process.env.GEMINI_API_KEY ? 'configured' : 'not-configured'
  });
});

app.post('/api/chat', async (req, res) => {
  const message = String(req.body.message || '').trim();

  if (!message) {
    return res.status(400).json({ error: 'Bhai, message likho!' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'API key configure nahi hai.'
    });
  }

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "You are Sounvexa AI, a friendly AI assistant. Introduce yourself as Sounvexa AI. Reply in the same language as the user. User message: " + message }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', response.status, JSON.stringify(data.error || data));
      return res.status(502).json({
        error: 'Gemini se jawab nahi mila. API access ya model availability check karo.'
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('')
      .trim();

    res.json({
      reply: reply || 'Bhai, is baar jawab nahi mila. Dobara try karo.'
    });
  } catch (error) {
    console.error('Chat request failed:', error.message);
    res.status(500).json({
      error: 'Connection mein dikkat hai. Dobara try karo.'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sounvexa AI running at http://127.0.0.1:${PORT}`);
});
