feather.replace();

const params = new URLSearchParams(window.location.search);
const bookId = params.get('id');

let book = null;

async function loadBook() {
  try {
    const res = await fetch('/livros.json');
    const livros = await res.json();
    book = livros.find(l => l.id === bookId);
    if (!book) return alert('Livro não encontrado');

    const isPdfMode = Boolean(book.pdfFile || book.bookFile);
    const hasChapters = Array.isArray(book.chapters) && book.chapters.length > 0;
    const readerCapParam = isPdfMode ? '1' : (book.chapters[0]?.id || '');

    const bookDetail = document.getElementById('book-detail');
    bookDetail.innerHTML = `
      <div class="md:flex">
        <div class="md:w-1/3 flex items-center justify-center p-8">
          <div class="book-cover" style="max-width: 260px; width: 100%;">
            <img src="${book.coverImage || 'https://placehold.co/300x400'}" alt="${book.title}">
          </div>
        </div>
        <div class="md:w-2/3 p-8">
          <h1 class="text-3xl font-serif font-bold text-gray-800 mb-2">${book.title}</h1>
          <p class="text-xl font-serif text-gray-600 mb-4">${book.author}</p>
          <div class="flex flex-wrap gap-4">
            <a href="reader.html?id=${book.id}&cap=${readerCapParam}" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center">
              <i data-feather="book-open" class="mr-2"></i> Ler Livro
            </a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('book-description').innerText = book.description || 'Sem descrição disponível.';

    const chaptersList = document.getElementById('chapters-list');
    chaptersList.innerHTML = '';
    if (hasChapters) {
      book.chapters.forEach(c => {
        const div = document.createElement('div');
        div.className = 'p-6 hover:bg-gray-50 transition-colors';
        div.innerHTML = `
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-medium text-gray-800">${c.title}</h3>
              <p class="text-sm text-gray-500">Publicado em ${new Date(c.createdAt).toLocaleDateString()}</p>
            </div>
            <a href="reader.html?id=${book.id}&cap=${c.id}" class="text-indigo-600 hover:text-indigo-800 flex items-center">
              Ler <i data-feather="chevron-right" class="ml-1 w-4 h-4"></i>
            </a>
          </div>
        `;
        chaptersList.appendChild(div);
      });
    } else if (isPdfMode) {
      const div = document.createElement('div');
      div.className = 'p-6 text-gray-600';
      div.textContent = 'Este livro está disponível em PDF (leitura página a página).';
      chaptersList.appendChild(div);
    }

    await loadComments();
    feather.replace();
  } catch (err) {
    console.error('Erro ao carregar livro:', err);
  }
}

async function loadComments() {
  try {
    const isPdfMode = Boolean(book.pdfFile || book.bookFile);
    const commentKey = isPdfMode ? 'page-1' : (book.chapters[0]?.id || '');
    if (!commentKey) return;

    const res = await fetch(`/comentarios/${bookId}/${commentKey}`);
    const data = await res.json();
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';

    data.forEach(comment => {
      const div = document.createElement('div');
      div.className = 'flex space-x-4';
      div.innerHTML = `
        <div class="flex-shrink-0">
          <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <i data-feather="user" class="text-gray-500"></i>
          </div>
        </div>
        <div>
          <div class="flex items-center mb-1">
            <h4 class="font-medium text-gray-800 mr-2">${comment.userName}</h4>
            <span class="text-xs text-gray-500">${new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          <p class="text-gray-700">${comment.text}</p>
        </div>
      `;
      commentsList.appendChild(div);
    });

    document.getElementById('comment-count').innerText = data.length;
    feather.replace();
  } catch (err) {
    console.error('Erro ao carregar comentários:', err);
  }
}

document.getElementById('comment-form').addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const text = formData.get('text');
  const userName = formData.get('userName') || 'Anônimo';

  if (!text.trim()) return alert('Comentário não pode estar vazio.');

  try {
    const isPdfMode = Boolean(book.pdfFile || book.bookFile);
    const commentKey = isPdfMode ? 'page-1' : (book.chapters[0]?.id || '');
    if (!commentKey) return;

    const res = await fetch(`/comentarios.json/${bookId}/${commentKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, text })
    });
    if (!res.ok) throw new Error('Erro ao enviar comentário');

    e.target.reset();
    loadComments();
  } catch (err) {
    console.error(err);
    alert('Erro ao enviar comentário.');
  }
});

loadBook();
