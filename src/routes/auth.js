const express = require('express');
const { readJson, writeJson } = require('../lib/storage');
const { generateToken } = require('../lib/auth');
const { usersFile } = require('../config/paths');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' });
  }

  const users = readJson(usersFile, []);
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = generateToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

router.post('/signup', (req, res) => {
  const { name, email, password, role, bio } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const users = readJson(usersFile, []);

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email já registrado' });
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    role,
    bio: bio || '',
    createdAt: new Date().toISOString(),
    subscription: role === 'leitor' ? 'gratuita' : null,
    earnings: role === 'autor' ? 0 : null
  };

  users.push(newUser);
  writeJson(usersFile, users);

  const token = generateToken(newUser);

  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

module.exports = router;
