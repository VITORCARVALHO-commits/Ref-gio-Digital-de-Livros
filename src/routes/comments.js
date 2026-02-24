const express = require('express');
const { readJson, writeJson } = require('../lib/storage');
const { livrosFile } = require('../config/paths');

const router = express.Router();

function normalizeBook(book) {
  return {
    ...book,
    chapters: book.chapters || [],
    comments: book.comments || {}
  };
}

function findBook(books, bookId) {
  return books.find(book => book.id === bookId);
}

function addComment({ books, book, chapterId, userName, text }) {
  const comment = {
    userName: userName || 'Anônimo',
    text,
    createdAt: new Date().toISOString()
  };

  if (!book.comments[chapterId]) {
    book.comments[chapterId] = [];
  }

  book.comments[chapterId].push(comment);
  writeJson(livrosFile, books);

  return comment;
}

router.get('/comentarios/:bookId/:chapterId', (req, res) => {
  const books = readJson(livrosFile, []).map(normalizeBook);
  const book = findBook(books, req.params.bookId);

  if (!book) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }

  return res.json(book.comments[req.params.chapterId] || []);
});

router.post('/comentarios/:bookId/:chapterId', (req, res) => {
  const { userName, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Comentário não pode estar vazio' });
  }

  const books = readJson(livrosFile, []).map(normalizeBook);
  const book = findBook(books, req.params.bookId);

  if (!book) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }

  const comment = addComment({
    books,
    book,
    chapterId: req.params.chapterId,
    userName,
    text
  });

  return res.status(201).json(comment);
});

router.post('/comentarios.json/:bookId/:chapterId', (req, res) => {
  const { userName, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Comentário não pode estar vazio' });
  }

  const books = readJson(livrosFile, []).map(normalizeBook);
  const book = findBook(books, req.params.bookId);

  if (!book) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }

  const comment = addComment({
    books,
    book,
    chapterId: req.params.chapterId,
    userName,
    text
  });

  return res.status(201).json(comment);
});

module.exports = router;
