// Captura id do livro na URL
const params = new URLSearchParams(window.location.search);
const livroId = params.get('id');

// 📚 Se estivermos no index.html
const bookList = document.getElementById('book-list');
if (bookList) {
  fetch('/livros.json')
    .then(res => res.json())
    .then(livros => {
      livros.forEach(l => {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-lg shadow-md p-4 flex flex-col';
        div.innerHTML = `
          <img src="${l.coverImage || 'https://placehold.co/200x300'}" class="h-48 w-full object-cover rounded mb-4"/>
          <h3 class="font-serif font-bold text-lg">${l.title}</h3>
          <p class="text-gray-600 text-sm mb-2">${l.author}</p>
          <a href="reader.html?id=${l.id}" class="text-indigo-600 hover:underline mt-auto">Ler</a>
        `;
        bookList.appendChild(div);
      });
    })
    .catch(err => console.error('Erro ao carregar livros:', err));
}

// 📖 Se estivermos no reader.html
if (livroId) {
  fetch('/livros.json')
    .then(res => res.json())
    .then(livros => {
      const livro = livros.find(l => l.id === livroId);
      if (!livro) return alert('Livro não encontrado');
      document.getElementById('titulo-livro').innerText = livro.title;
      document.getElementById('autor-livro').innerText = livro.author;
      document.getElementById('descricao-livro').innerText = livro.description;
      document.getElementById('capa-livro').src = livro.coverImage || 'https://placehold.co/200x300';

      const capitulosDiv = document.getElementById('capitulos');
      livro.chapters.forEach(c => {
        const div = document.createElement('div');
        div.className = 'bg-white p-4 rounded shadow';
        div.innerHTML = `<h4 class="font-semibold text-lg mb-2">${c.title}</h4>
                         <p>${c.content}</p>`;
        capitulosDiv.appendChild(div);
      });
    });
}