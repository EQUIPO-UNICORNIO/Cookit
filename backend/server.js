const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./config/database');

async function start() {
  await getDb();
  
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/pantry', require('./routes/pantry'));
  app.use('/api/shopping', require('./routes/shopping'));
  app.use('/api/meals', require('./routes/meals'));
  app.use('/api/challenges', require('./routes/challenges'));
  app.use('/api/community', require('./routes/community'));
  app.use('/api/impact', require('./routes/impact'));
  app.use('/api/cooking', require('./routes/cooking'));
  app.use('/api/substitutions', require('./routes/substitutions'));
  app.use('/api/scanner', require('./routes/scanner'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'CookIt API' });
  });

  const PORT = process.env.PORT || 3001;

  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
    } else {
      res.status(404).json({ error: 'Ruta no encontrada' });
    }
  });

  await new Promise(resolve => app.listen(PORT, resolve));
  console.log(`CookIt API corriendo en puerto ${PORT}`);
  return app;
}

if (require.main === module) {
  start().catch(e => {
    console.error('Failed to start:', e);
    process.exit(1);
  });
} else {
  module.exports = start;
}
