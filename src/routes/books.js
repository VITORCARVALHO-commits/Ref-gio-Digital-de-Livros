const express = require('express');
const { readJson, writeJson } = require('../lib/storage');
const { upload } = require('../middleware/upload');
const { livrosFile } = require('../config/paths');

const router = express.Router();

function normalizeBook(book) {
  return {
    ...book,
    chapters: book.chapters || [],
    comments: book.comments || {}
  };
}

router.get('/livros.json', (req, res) => {
  const books = readJson(livrosFile, []).map(normalizeBook);
  res.json(books);
});

router.get('/livros.json/:id', (req, res) => {
  const books = readJson(livrosFile, []).map(normalizeBook);
  const book = books.find(l => l.id === req.params.id);

  if (!book) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }

  return res.json(book);
});

router.post('/livros.json', upload.single('coverImage'), (req, res) => {
  const { title, author, description } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: 'Título e autor obrigatórios' });
  }

  const books = readJson(livrosFile, []).map(normalizeBook);
  const newBook = {
    id: Date.now().toString(),
    title,
    author,
    description: description || '',
    coverImage: req.file ? `/uploads/${req.file.filename}` : null,
    chapters: [],
    comments: {},
    createdAt: new Date().toISOString()
  };

  books.push(newBook);
  writeJson(livrosFile, books);

  return res.status(201).json(newBook);
});

router.post('/livros.json/:id/capitulos', (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Título e conteúdo obrigatórios' });
  }

  const books = readJson(livrosFile, []).map(normalizeBook);
  const book = books.find(l => l.id === req.params.id);

  if (!book) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }

  const newChapter = {
    id: Date.now().toString(),
    title,
    content,
    createdAt: new Date().toISOString()
  };

  book.chapters.push(newChapter);
  book.comments[newChapter.id] = [];

  writeJson(livrosFile, books);

  return res.status(201).json(newChapter);
});

module.exports = router;
