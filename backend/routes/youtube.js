const express = require('express');
const router = express.Router();

const cache = new Map();

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta el parámetro q' });

  const cacheKey = q.toLowerCase().trim();
  if (cache.has(cacheKey)) return res.json({ videoId: cache.get(cacheKey), cached: true });

  try {
    if (process.env.YOUTUBE_API_KEY) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&key=${process.env.YOUTUBE_API_KEY}&maxResults=1&type=video`;
      const data = await fetch(url).then(r => r.json());
      if (data.items?.[0]?.id?.videoId) {
        cache.set(cacheKey, data.items[0].id.videoId);
        return res.json({ videoId: data.items[0].id.videoId });
      }
    }

    const html = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    }).then(r => r.text());

    const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (match) {
      cache.set(cacheKey, match[1]);
      return res.json({ videoId: match[1] });
    }

    return res.json({ videoId: null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
