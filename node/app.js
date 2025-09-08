require('dotenv').config({ path: '../.env' });
const express = require('express');
const { createSocketConnection } = require('./controllers/whatsapp');

const app = express();
app.use(express.json());

// 🔐 Middleware API Key Auth
app.use((req, res, next) => {
  const expectedKey = process.env.API_KEY;
  const headerName = (process.env.API_KEY_HEADER_NAME || 'x-whatsapp-token').toLowerCase();

  console.log('🧩 HEADER NAME:', headerName);
  console.log('📥 Headers:', req.headers);
  console.log('📥 Query:', req.query);

  let apiKey = req.headers[headerName];

  // ⬇️ Ambil dari query jika header tidak ada
  if (!apiKey && req.query.api_key) {
    const queryHeader = (req.query.key_header || '').toLowerCase();
    if (queryHeader === headerName) {
      apiKey = req.query.api_key;
      console.log('🔄 Fallback ke query string:', apiKey);
    }
  }

  if (!apiKey || apiKey !== expectedKey) {
    console.log('❌ Token salah atau tidak cocok:', apiKey);
    return res.status(401).json({ error: 'API key invalid atau tidak ada.' });
  }

  console.log('✅ Token valid:', apiKey);
  next();
});

createSocketConnection(app);

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on port ${PORT}`));