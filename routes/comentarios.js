const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/comentarios.json');

// Carregar comentários
function loadComentarios() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    return {};
  }
}

// Salvar comentários
function saveComentarios(comentarios) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(comentarios, null, 2), 'utf8');
}

// GET /comentarios/:livroId/:capituloIndex - Listar comentários
router.get('/:livroId/:capituloIndex', (req, res) => {
  const comentarios = loadComentarios();
  const chave = `${req.params.livroId}-${req.params.capituloIndex}`;
  
  res.json(comentarios[chave] || []);
});

// POST /comentarios/:livroId/:capituloIndex - Adicionar comentário
router.post('/:livroId/:capituloIndex', (req, res) => {
  const comentarios = loadComentarios();
  const chave = `${req.params.livroId}-${req.params.capituloIndex}`;
  
  const { autor, texto } = req.body;
  
  if (!texto) {
    return res.status(400).json({ message: 'Texto do comentário é obrigatório' });
  }
  
  if (!comentarios[chave]) {
    comentarios[chave] = [];
  }
  
  const novoComentario = {
    autor: autor || 'Anônimo',
    texto,
    data: new Date().toISOString()
  };
  
  comentarios[chave].push(novoComentario);
  saveComentarios(comentarios);
  
  res.status(201).json(novoComentario);
});

module.exports = router;