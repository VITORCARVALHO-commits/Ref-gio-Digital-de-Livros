feather.replace();

// Dark Mode
const darkModeToggle = document.getElementById('darkModeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');

const isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
  document.documentElement.classList.add('dark-mode');
  sunIcon.style.display = 'none';
  moonIcon.style.display = 'block';
}

darkModeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark-mode');
  const isNowDark = document.documentElement.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isNowDark);
  sunIcon.style.display = isNowDark ? 'none' : 'block';
  moonIcon.style.display = isNowDark ? 'block' : 'none';
});

const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');
let chapterIndex = 0;
let book = null;
let pdfDocument = null;
let isPdfMode = false;

const chapterList = document.getElementById('chapter-list');
const chapterTitle = document.getElementById('chapter-title');
const chapterContent = document.getElementById('chapter-content');
const pdfCanvas = document.getElementById('pdf-canvas');
const pdfContainer = document.getElementById('pdf-container');
const pdfFallback = document.getElementById('pdf-fallback');
const commentsList = document.getElementById('comments-list');
const commentCount = document.getElementById('comment-count');
const commentForm = document.getElementById('comment-form');
const bookHeaderSection = document.getElementById('book-header-section');

const pdfjsLib = window.pdfjsLib;
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

async function loadBook() {
  try {
    const res = await fetch('/livros.json');
    const livros = await res.json();
    book = livros.find(l => l.id === bookId);

    if (!book) {
      chapterTitle.textContent = 'Livro não encontrado';
      return;
    }

    bookHeaderSection.style.display = 'flex';

    document.getElementById('book-title').textContent = book.title;
    document.getElementById('book-author').textContent = book.author;
    document.getElementById('book-description').textContent = book.description;
    document.getElementById('book-cover').src = book.coverImage || 'https://images.unsplash.com/photo-1543002588-d4d28bde5205?w=300&h=450&fit=crop';
    document.getElementById('reader-title').textContent = book.title;

    const pdfFile = book.pdfFile || book.bookFile;
    isPdfMode = Boolean(pdfFile);

    chapterList.innerHTML = '';

    if (isPdfMode) {
      pdfFallback.style.display = 'none';
      pdfContainer.style.display = 'flex';
      await loadPdf(pdfFile);
      buildPageList();
      const urlPageIndex = Number(urlParams.get('cap'));
      if (!Number.isNaN(urlPageIndex) && urlPageIndex >= 1 && urlPageIndex <= pdfDocument.numPages) {
        chapterIndex = urlPageIndex - 1;
      }
    } else {
      pdfContainer.style.display = 'none';
      pdfFallback.style.display = 'block';
      document.getElementById('book-info').textContent = book.chapters?.length
        ? `${book.chapters.length} capítulos`
        : '';
      book.chapters?.forEach((ch, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" data-index="${index}">${ch.title}</a>`;
        chapterList.appendChild(li);
      });

      chapterList.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          chapterIndex = Number(a.dataset.index);
          renderChapter();
          window.scrollTo(0, 0);
        });
      });

      const urlCapIndex = Number(urlParams.get('cap'));
      const totalChapters = book.chapters?.length || 0;
      if (!Number.isNaN(urlCapIndex) && urlCapIndex >= 0 && urlCapIndex < totalChapters) {
        chapterIndex = urlCapIndex;
      }
    }

    renderChapter();
  } catch (err) {
    console.error('Erro:', err);
  }
}

async function loadPdf(pdfUrl) {
  pdfFallback.style.display = 'none';
  pdfContainer.style.display = 'flex';
  pdfDocument = await pdfjsLib.getDocument(pdfUrl).promise;
  document.getElementById('book-info').textContent = `PDF • ${pdfDocument.numPages} páginas`;
}

function buildPageList() {
  chapterList.innerHTML = '';
  for (let i = 1; i <= pdfDocument.numPages; i += 1) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#" data-index="${i - 1}">Página ${i}</a>`;
    chapterList.appendChild(li);
  }

  chapterList.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      chapterIndex = Number(a.dataset.index);
      renderChapter();
      window.scrollTo(0, 0);
    });
  });
}

function renderChapter() {
  if (isPdfMode) {
    if (!pdfDocument) return;
    const pageNumber = chapterIndex + 1;
    chapterTitle.textContent = `Página ${pageNumber}`;
    document.getElementById('chapter-number').textContent = `Página ${pageNumber} de ${pdfDocument.numPages}`;

    renderPdfPage(pageNumber);

    document.getElementById('prev-chapter').disabled = pageNumber === 1;
    document.getElementById('next-chapter').disabled = pageNumber === pdfDocument.numPages;

    loadComments(`page-${pageNumber}`);
  } else {
    if (!book?.chapters?.length) {
      chapterTitle.textContent = 'Conteúdo indisponível';
      chapterContent.innerHTML = '<p>Este livro não possui capítulos nem PDF disponível.</p>';
      document.getElementById('chapter-number').textContent = '';
      document.getElementById('prev-chapter').disabled = true;
      document.getElementById('next-chapter').disabled = true;
      return;
    }

    if (!book.chapters[chapterIndex]) return;

    const ch = book.chapters[chapterIndex];
    chapterTitle.textContent = ch.title;
    chapterContent.innerHTML = `<p>${ch.content.replace(/\n/g, '</p><p>')}</p>`;
    document.getElementById('chapter-number').textContent = `Capítulo ${chapterIndex + 1} de ${book.chapters.length}`;

    document.getElementById('prev-chapter').disabled = chapterIndex === 0;
    document.getElementById('next-chapter').disabled = chapterIndex === book.chapters.length - 1;

    loadComments(ch.id);
  }
}

async function renderPdfPage(pageNumber) {
  const page = await pdfDocument.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1 });
  const maxWidth = Math.min(pdfContainer.clientWidth || 800, 900);
  const scale = maxWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const context = pdfCanvas.getContext('2d');
  pdfCanvas.width = viewport.width;
  pdfCanvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
}

// Botão voltar: se logado, volta para dashboard
const user = JSON.parse(localStorage.getItem('user') || '{}');
const backBtn = document.querySelector('.reader-header a');
if (backBtn && user && user.name) {
  backBtn.href = '/dashboard.html';
}

document.getElementById('prev-chapter').addEventListener('click', () => {
  if (chapterIndex > 0) {
    chapterIndex--;
    renderChapter();
    window.scrollTo(0, 0);
  }
});

document.getElementById('next-chapter').addEventListener('click', () => {
  if (isPdfMode && chapterIndex < pdfDocument.numPages - 1) {
    chapterIndex++;
    renderChapter();
    window.scrollTo(0, 0);
    return;
  }

  if (!isPdfMode && book.chapters?.length && chapterIndex < book.chapters.length - 1) {
    chapterIndex++;
    renderChapter();
    window.scrollTo(0, 0);
  }
});

async function loadComments(chapterId) {
  try {
    const res = await fetch(`/comentarios/${bookId}/${chapterId}`);
    const comments = res.ok ? await res.json() : [];

    commentsList.innerHTML = '';
    commentCount.textContent = comments.length;

    comments.forEach(c => {
      const div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = `
        <div class="comment-author">${c.userName || 'Anônimo'}</div>
        <div class="comment-date">${new Date(c.createdAt).toLocaleDateString('pt-BR')}</div>
        <div class="comment-text">${c.text}</div>
      `;
      commentsList.appendChild(div);
    });
  } catch (err) {
    console.error('Erro ao carregar comentários:', err);
  }
}

commentForm.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(commentForm);
  const token = localStorage.getItem('token');
  const commentKey = isPdfMode ? `page-${chapterIndex + 1}` : book.chapters[chapterIndex].id;

  try {
    await fetch(`/comentarios/${bookId}/${commentKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        text: formData.get('text'),
        userName: formData.get('userName') || 'Anônimo'
      })
    });

    if (token && !isPdfMode) {
      fetch('/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'comment',
          payload: {
            bookId,
            chapterId: book.chapters[chapterIndex].id,
            chapterTitle: book.chapters[chapterIndex].title
          }
        })
      }).catch(() => {});
    }

    commentForm.reset();
    loadComments(commentKey);
  } catch (err) {
    console.error('Erro ao postar comentário:', err);
  }
});

loadBook();
