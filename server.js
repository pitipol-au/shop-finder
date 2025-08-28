const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SUPABASE_URL = 'https://hfuppsfahuwntuvorwpo.supabase.co/rest/v1/shops';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// ฟังก์ชันคำนวณระยะทาง (เหมือนเดิม)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// API /nearby
app.post('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, type } = req.body;

    const url = type 
      ? `${SUPABASE_URL}?select=*&type=eq.${encodeURIComponent(type)}`
      : `${SUPABASE_URL}?select=*`;

    const response = await axios.get(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const shops = response.data;

    const shopsWithDistance = shops.map(shop => ({
      ...shop,
      distance: Number(getDistance(latitude, longitude, Number(shop.latitude), Number(shop.longitude)).toFixed(2))
    }))
    .sort((a,b) => a.distance - b.distance);

    res.json(shopsWithDistance);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'cannot fetch nearby shops' });
  }
});

// API /types
app.get('/types', async (_req, res) => {
  try {
    const response = await axios.get(`${SUPABASE_URL}?select=type`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const types = [...new Set(response.data.map(r => r.type).filter(Boolean))].sort();
    res.json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'cannot fetch types' });
  }
});

// Health check
app.get('/health', (_req, res) => res.send('ok'));

// ใช้ PORT จาก Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
