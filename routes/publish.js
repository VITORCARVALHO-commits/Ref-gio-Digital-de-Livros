const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// 📁 Caminho para o arquivo JSON onde os livros serão salvos
const BOOKS_FILE = path.join(__dirname, '../data/livros.json');

// 🖼️ Configuração do upload da capa
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = Date.now() + ext;
    cb(null, fileName);
  }
});
const upload = multer({ storage });

// 🔄 Carregar livros
function loadBooks() {
  try {
    return JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

// 💾 Salvar livros
function saveBooks(books) {
  fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf8');
}

// 📤 Rota para publicar livro
router.post('/', upload.single('cover'), (req, res) => {
  const books = loadBooks();

  const { title, subtitle, author, synopsis, chapterTitle, chapterContent, publishDate } = req.body;

  if (!title || !author || !chapterTitle || !chapterContent) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
  }

  const newBook = {
    id: Date.now().toString(),
    title,
    subtitle,
    author,
    synopsis,
    cover: req.file ? `/uploads/${req.file.filename}` : null,
    publishDate: publishDate || new Date().toISOString(),
    chapters: [
      {
        title: chapterTitle,
        content: chapterContent
      }
    ]
  };

  books.push(newBook);
  saveBooks(books);

  res.status(201).json({ message: 'Livro publicado com sucesso!', book: newBook });
});

module.exports = router;
