// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // ต้องติดตั้ง node-fetch@2

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files จาก public
app.use(express.static('public'));

// Supabase config (ใส่เป็น env variable)
const SUPABASE_URL = 'https://hfuppsfahuwntuvorwpo.supabase.co/rest/v1/shops';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// ฟังก์ชันคำนวณระยะทาง
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// API /types สำหรับดึง type ที่มีอยู่
app.get('/types', async (_req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}?select=type`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const rows = await response.json();
    const types = [...new Set(rows.map(r => r.type).filter(Boolean))].sort();
    res.json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'cannot fetch types' });
  }
});

// API /nearby สำหรับค้นหาร้านตามตำแหน่งและ type
app.post('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, type } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude/longitude required (number)' });
    }

    const url = type 
      ? `${SUPABASE_URL}?select=*&type=eq.${encodeURIComponent(type)}`
      : `${SUPABASE_URL}?select=*`;

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const shops = await response.json();

    const shopsWithDistance = shops.map(shop => ({
      ...shop,
      distance: Number(getDistance(
        latitude, longitude,
        Number(shop.latitude), Number(shop.longitude)
      ).toFixed(2))
    }))
    .sort((a,b) => a.distance - b.distance);

    res.json(shopsWithDistance);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'cannot fetch nearby shops' });
  }
});

// Health check
app.get('/health', (_req, res) => res.send('ok'));

// ใช้ PORT จาก Render หรือ 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
