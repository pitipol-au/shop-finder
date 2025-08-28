const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = 'https://hfuppsfahuwntuvorwpo.supabase.co/rest/v1/shops';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdXBwc2ZhaHV3bnR1dm9yd3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODk3NjAsImV4cCI6MjA3MTg2NTc2MH0.BtcJOEwmrAcdw6npR3ESqnlvIu18f29W_up6uKfmvwk';

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

app.post('/nearby', async (req, res) => {
  console.log('req.body:', req.body);
  const { latitude, longitude, type } = req.body;  // ✅ เพิ่ม type

  // ถ้ามี type -> filter ด้วย eq=type
  const url = type 
    ? `${SUPABASE_URL}?select=*&type=eq.${type}`
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
    distance: getDistance(latitude, longitude, shop.latitude, shop.longitude).toFixed(2)
  }))
  .sort((a,b) => a.distance - b.distance);

  res.json(shopsWithDistance);
});

app.listen(3000, () => console.log('Server running on port 3000'));