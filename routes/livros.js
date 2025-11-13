const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');


const DATA_FILE = path.join(__dirname, '../data/livros.json');

// Carregar dados dos livros
function loadLivros() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

// Salvar dados dos livros
function saveLivros(livros) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(livros, null, 2), 'utf8');
}

// GET /livros - Listar todos os livros
router.get('/livros.json', (req, res) => {
  const livros = loadLivros();
  res.json(livros);
});

// GET /livros/:id - Obter livro específico
router.get('/:id', (req, res) => {
  const livros = loadLivros();
  const livro = livros.find(l => l.id === req.params.id);
  
  if (!livro) {
    return res.status(404).json({ message: 'Livro não encontrado' });
  }
  
  res.json(livro);
});

// POST /livros - Adicionar novo livro
router.post('/', (req, res) => {
  const livros = loadLivros();
  const { id, titulo, subtitulo, capa, sinopse } = req.body;
  
  if (!id || !titulo || !capa || !sinopse) {
    return res.status(400).json({ message: 'Campos obrigatórios: id, titulo, capa, sinopse' });
  }
  
  if (livros.some(l => l.id === id)) {
    return res.status(400).json({ message: 'ID do livro já existe' });
  }
  
  const novoLivro = {
    id,
    titulo,
    subtitulo: subtitulo || '',
    capa,
    sinopse,
    capitulos: []
  };
  
  livros.push(novoLivro);
  saveLivros(livros);
  
  res.status(201).json(novoLivro);
});

// POST /livros/:id/capitulos - Adicionar capítulo
router.post('/:id/capitulos', (req, res) => {
  const livros = loadLivros();
  const livroIndex = livros.findIndex(l => l.id === req.params.id);
  
  if (livroIndex === -1) {
    return res.status(404).json({ message: 'Livro não encontrado' });
  }
  
  const { titulo, conteudo, data } = req.body;
  
  if (!titulo || !conteudo) {
    return res.status(400).json({ message: 'Campos obrigatórios: titulo, conteudo' });
  }
  
  const novoCapitulo = {
    titulo,
    conteudo,
    data: data || new Date().toISOString()
  };
  
  livros[livroIndex].capitulos.push(novoCapitulo);
  saveLivros(livros);
  
  res.status(201).json(novoCapitulo);
});

module.exports = router;