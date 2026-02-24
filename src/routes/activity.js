const express = require('express');
const { registerActivity } = require('../lib/activity');

const router = express.Router();

router.post('/activity', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  const { type, payload } = req.body || {};

  if (!type) {
    return res.status(400).json({ error: 'Tipo obrigatório' });
  }

  const activity = registerActivity({ token, type, payload });
  if (!activity) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  return res.status(201).json({ ok: true });
});

module.exports = router;
