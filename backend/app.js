const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
app.use('/api/youtube', require('./routes/youtube'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'CookIt API' });
});

module.exports = app;
