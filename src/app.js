const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const { ensureDir } = require('./lib/storage');
const { dataDir, uploadDir, publicDir } = require('./config/paths');

const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const commentsRoutes = require('./routes/comments');
const activityRoutes = require('./routes/activity');

const app = express();

ensureDir(dataDir);
ensureDir(uploadDir);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(publicDir));
app.use('/data', express.static(dataDir));

app.use('/auth', authRoutes);
app.use('/', booksRoutes);
app.use('/', commentsRoutes);
app.use('/', activityRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  }
  if (err) {
    return res.status(500).json({ error: 'Erro interno ao processar upload' });
  }
  return next();
});

module.exports = app;
