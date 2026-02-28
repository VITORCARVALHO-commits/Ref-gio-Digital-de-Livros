const app = require('./app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Servidor rodando em http://0.0.0.0:${PORT}`);
  console.log('🔐 Autenticação habilitada');
  console.log('📚 Plataforma de leitura online - Refúgio Digital de Livros');
});
