const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Directories
const dataDir = path.join(__dirname, 'data');
const uploadDir = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Default books data
const defaultBooks = [
  {
    id: '1',
    title: 'O Pequeno Príncipe',
    author: 'Antoine de Saint-Exupéry',
    description: 'Uma fábula poética sobre um jovem príncipe que viaja pelos planetas',
    coverImage: 'https://images.unsplash.com/photo-1543002588-d4d28bde5205?w=300&h=450&fit=crop',
    chapters: [
      { id: '1', title: 'Capítulo 1', content: 'Era uma vez um pequeno príncipe...' }
    ],
    createdAt: '2026-01-01'
  },
  {
    id: '2',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    description: 'Um romance clássico da literatura brasileira',
    coverImage: 'https://images.unsplash.com/photo-150784272343-583f20270319?w=300&h=450&fit=crop',
    chapters: [
      { id: '1', title: 'Capítulo 1', content: 'Uma noite destas, vindo da cidade...' }
    ],
    createdAt: '2026-01-02'
  },
  {
    id: '3',
    title: '1984',
    author: 'George Orwell',
    description: 'Um romance distópico que explora temas de poder e controle',
    coverImage: 'https://images.unsplash.com/photo-1494182368811-e6c63ba8e92d?w=300&h=450&fit=crop',
    chapters: [
      { id: '1', title: 'Capítulo 1', content: 'Era um dia brilhante de abril...' }
    ],
    createdAt: '2026-01-03'
  }
];

// Initialize data files
function initData() {
  const livrosPath = path.join(dataDir, 'livros.json');
  if (!fs.existsSync(livrosPath)) {
    fs.writeFileSync(livrosPath, JSON.stringify(defaultBooks, null, 2));
  }
  
  const usersPath = path.join(dataDir, 'users.json');
  if (!fs.existsSync(usersPath)) {
    fs.writeFileSync(usersPath, JSON.stringify([], null, 2));
  }
}

// Routes
app.get('/livros.json', (req, res) => {
  try {
    const data = fs.readFileSync(path.join(dataDir, 'livros.json'));
    res.json(JSON.parse(data));
  } catch (err) {
    res.json(defaultBooks);
  }
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' });
  }
  
  try {
    const usersData = fs.readFileSync(path.join(dataDir, 'users.json'));
    const users = JSON.parse(usersData);
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    res.json({
      token: 'token_' + Date.now(),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.post('/auth/signup', (req, res) => {
  const { name, email, password, role, bio } = req.body;
  
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }
  
  try {
    const usersPath = path.join(dataDir, 'users.json');
    const usersData = fs.readFileSync(usersPath);
    let users = JSON.parse(usersData);
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email já registrado' });
    }
    
    const newUser = {
      id: Date.now().toString(),
      name, email, password, role,
      bio: bio || '',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    
    res.status(201).json({
      token: 'token_' + Date.now(),
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Start server
initData();
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`📚 Refúgio Digital de Livros`);
});
