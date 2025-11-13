const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// 📂 Pastas
const dataDir = path.join(__dirname, 'data');
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// 🔹 Config multer para upload de capa
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(dataDir));

// Arquivo de livros
const livrosFile = path.join(dataDir, 'livros.json');

// Funções auxiliares
function lerLivros() {
  if (!fs.existsSync(livrosFile)) return [];
  const data = fs.readFileSync(livrosFile, 'utf8');
  return data ? JSON.parse(data) : [];
}

function salvarLivros(livros) {
  fs.writeFileSync(livrosFile, JSON.stringify(livros, null, 2));
}

// 🔹 Listar livros
app.get('/livros.json', (req, res) => {
  const livros = lerLivros();
  res.json(livros);
});

// 🔹 Obter livro por ID
app.get('/livros.json/:id', (req, res) => {
  const livros = lerLivros();
  const livro = livros.find(l => l.id === req.params.id);
  if (!livro) return res.status(404).json({ error: 'Livro não encontrado' });
  res.json(livro);
});

// 🔹 Publicar livro (com capa)
app.post('/livros.json', upload.single('coverImage'), (req, res) => {
  const { title, author, description } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'Título e autor obrigatórios' });

  const livros = lerLivros();
  const novoLivro = {
    id: Date.now().toString(),
    title,
    author,
    description: description || '',
    coverImage: req.file ? `/uploads/${req.file.filename}` : null,
    chapters: [],
    comments: {}, // { chapterId: [ { userName, text, createdAt } ] }
    createdAt: new Date().toISOString()
  };

  livros.push(novoLivro);
  salvarLivros(livros);
  res.status(201).json(novoLivro);
});

// 🔹 Adicionar capítulo a um livro
app.post('/livros.json/:id/capitulos', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Título e conteúdo obrigatórios' });

  const livros = lerLivros();
  const livro = livros.find(l => l.id === req.params.id);
  if (!livro) return res.status(404).json({ error: 'Livro não encontrado' });

  const novoCapitulo = {
    id: Date.now().toString(),
    title,
    content,
    createdAt: new Date().toISOString()
  };

  livro.chapters.push(novoCapitulo);
  livro.comments[novoCapitulo.id] = []; // inicializa comentários
  salvarLivros(livros);

  res.status(201).json(novoCapitulo);
});

// 🔹 Listar comentários de um capítulo
app.get('/comentarios/:bookId/:chapterId', (req, res) => {
  const livros = lerLivros();
  const livro = livros.find(l => l.id === req.params.bookId);
  if (!livro) return res.status(404).json({ error: 'Livro não encontrado' });

  const comments = livro.comments[req.params.chapterId] || [];
  res.json(comments);
});

// 🔹 Adicionar comentário a um capítulo
app.post('/comentarios.json/:bookId/:chapterId', (req, res) => {
  const { userName, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comentário não pode estar vazio' });

  const livros = lerLivros();
  const livro = livros.find(l => l.id === req.params.bookId);
  if (!livro) return res.status(404).json({ error: 'Livro não encontrado' });

  const chapterComments = livro.comments[req.params.chapterId] || [];
  const novoComentario = {
    userName: userName || 'Anônimo',
    text,
    createdAt: new Date().toISOString()
  };

  chapterComments.push(novoComentario);
  livro.comments[req.params.chapterId] = chapterComments;
  salvarLivros(livros);

  res.status(201).json(novoComentario);
});

// 🔹 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
