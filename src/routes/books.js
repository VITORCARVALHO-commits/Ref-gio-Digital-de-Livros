const express = require('express');
const { readJson, writeJson } = require('../lib/storage');
const { upload } = require('../middleware/upload');
const { livrosFile, uploadsFile } = require('../config/paths');

const router = express.Router();

function normalizeBook(book) {
  return {
    ...book,
    chapters: book.chapters || [],
    comments: book.comments || {}
  };
}

function getBookKey(book) {
  return (book.title || '').trim().toLowerCase();
}

function dedupeBooks(books) {
  const map = new Map();
  books.forEach(book => {
    const key = getBookKey(book);
    if (!key) return;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, book);
      return;
    }
    const existingDate = new Date(existing.createdAt || 0).getTime();
    const currentDate = new Date(book.createdAt || 0).getTime();
    if (currentDate >= existingDate) {
      map.set(key, book);
    }
  });
  return Array.from(map.values());
}

router.get('/livros.json', (req, res) => {
  const books = readJson(livrosFile, []).map(normalizeBook);
  const deduped = dedupeBooks(books);
  if (deduped.length !== books.length) {
    writeJson(livrosFile, deduped);
  }
  res.json(deduped);
});

router.get('/livros.json/:id', (req, res) => {
  const books = readJson(livrosFile, []).map(normalizeBook);
  const book = books.find(l => l.id === req.params.id);

  if (!book) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }

  return res.json(book);
});

router.post('/livros.json', upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'bookFile', maxCount: 1 }
]), (req, res) => {
  try {
    console.log('[UPLOAD] body:', req.body);
    console.log('[UPLOAD] files:', Object.keys(req.files || {}));
    const { title, author, description } = req.body;
    const coverFile = req.files?.coverImage?.[0] || null;
    const bookFile = req.files?.bookFile?.[0] || null;

    if (!title) {
      return res.status(400).json({ error: 'Título obrigatório' });
    }

    if (!bookFile) {
      return res.status(400).json({ error: 'Arquivo PDF obrigatório' });
    }

    const books = readJson(livrosFile, []).map(normalizeBook);
    const titleKey = title.trim().toLowerCase();
    if (books.some(b => getBookKey(b) === titleKey)) {
      return res.status(409).json({ error: 'Livro já publicado com esse título' });
    }
    const newBook = {
      id: Date.now().toString(),
      title,
      author: author?.trim() || 'Autor desconhecido',
      description: description || '',
      coverImage: coverFile ? `/uploads/${coverFile.filename}` : null,
      pdfFile: bookFile ? `/uploads/${bookFile.filename}` : null,
      chapters: [],
      comments: {},
      createdAt: new Date().toISOString()
    };

    books.push(newBook);
    writeJson(livrosFile, books);

    const uploads = readJson(uploadsFile, []);
    const uploadKey = newBook.title.trim().toLowerCase();
    const filteredUploads = uploads.filter(u => (u.title || '').trim().toLowerCase() !== uploadKey);
    filteredUploads.push({
      id: Date.now().toString(),
      bookId: newBook.id,
      title: newBook.title,
      coverImage: newBook.coverImage,
      pdfFile: newBook.pdfFile,
      createdAt: newBook.createdAt
    });
    writeJson(uploadsFile, filteredUploads);

    return res.status(201).json(newBook);
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao salvar o livro' });
  }
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
