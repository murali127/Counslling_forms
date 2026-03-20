const express = require('express');

const router = express.Router();

const LIGHTRAG_BASE_URL = process.env.LIGHTRAG_BASE_URL || 'https://convo-chatbot.onrender.com';
const LIGHTRAG_CHAT_PATH = process.env.LIGHTRAG_CHAT_PATH || '/api/chat';
const LIGHTRAG_MODEL = process.env.LIGHTRAG_MODEL || 'llama3.1';
const LIGHTRAG_TIMEOUT_MS = Number(process.env.LIGHTRAG_TIMEOUT_MS || 55000);

const parseReply = (payload) => {
  if (!payload) return '';

  if (typeof payload.response === 'string' && payload.response.trim()) {
    return payload.response.trim();
  }

  if (payload.message && typeof payload.message.content === 'string' && payload.message.content.trim()) {
    return payload.message.content.trim();
  }

  if (typeof payload.content === 'string' && payload.content.trim()) {
    return payload.content.trim();
  }

  return '';
};

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body || {};

    const userMessage = String(message || '').trim();
    if (!userMessage) {
      return res.status(400).json({ error: 'message is required' });
    }

    if (userMessage.length > 2000) {
      return res.status(400).json({ error: 'message is too long (max 2000 chars)' });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter((item) => item && typeof item.content === 'string')
          .slice(-10)
          .map((item) => ({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: String(item.content).slice(0, 2000)
          }))
      : [];

    const messages = [...safeHistory, { role: 'user', content: userMessage }];

    const endpoint = `${LIGHTRAG_BASE_URL.replace(/\/$/, '')}${LIGHTRAG_CHAT_PATH.startsWith('/') ? LIGHTRAG_CHAT_PATH : `/${LIGHTRAG_CHAT_PATH}`}`;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (process.env.LIGHTRAG_API_KEY) {
      headers.Authorization = `Bearer ${process.env.LIGHTRAG_API_KEY}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LIGHTRAG_TIMEOUT_MS);

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: LIGHTRAG_MODEL,
          messages,
          stream: false
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const textBody = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      return res.status(502).json({
        error: 'Support chat upstream error',
        details: textBody || `HTTP ${upstreamResponse.status}`
      });
    }

    let payload = {};
    try {
      payload = textBody ? JSON.parse(textBody) : {};
    } catch (parseErr) {
      return res.status(502).json({
        error: 'Invalid response from support chat provider'
      });
    }

    const reply = parseReply(payload);

    return res.json({
      reply: reply || 'I am here to help. Could you rephrase that?',
      provider: 'LightRAG'
    });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      return res.status(504).json({
        error: 'Support chat timed out while waiting for LightRAG'
      });
    }
    console.error('[SUPPORT-CHAT] Error:', error.message);
    return res.status(500).json({ error: 'Failed to get support reply' });
  }
});

module.exports = router;
