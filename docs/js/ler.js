let currentPage = 0;
let book = null;
let pages = [];
let fullText = '';
let isSinglePage = true;
let charsPerPage = 1200;
let lastProgressSent = null;

const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');

async function loadBook() {
  try {
    const res = await fetch('/livros.json');
    const allBooks = await res.json();
    book = allBooks.find(b => b.id === bookId);

    if (!book) {
      console.error('Livro não encontrado');
      return;
    }

    const token = localStorage.getItem('token');
    if (book.requiresLogin && !token) {
      window.location.href = `/auth.html?redirect=${encodeURIComponent(`/ler.html?id=${bookId}`)}`;
      return;
    }

    if (token) {
      fetch('/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'read_open',
          payload: { bookId: book.id, title: book.title }
        })
      }).catch(() => {});
    }

    document.getElementById('bookTitle').textContent = book.title;

    fullText = book.chapters?.map(c => c.content).join('\n\n') || '';
    paginate();

    const toc = document.getElementById('toc');
    book.chapters?.forEach((ch, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="#" onclick="goToChapter(${idx}); return false;">${ch.title}</a>`;
      toc.appendChild(li);
    });

    renderPages();
  } catch (err) {
    console.error('Erro:', err);
  }
}

function paginate() {
  pages = [];
  if (!fullText) return;
  for (let i = 0; i < fullText.length; i += charsPerPage) {
    pages.push(fullText.substring(i, i + charsPerPage));
  }
  const maxStart = Math.max(0, pages.length - (isSinglePage ? 1 : 2));
  currentPage = Math.min(currentPage, maxStart);
}

function renderPages() {
  if (!pages[currentPage]) return;

  const step = isSinglePage ? 1 : 2;
  const leftPage = pages[currentPage] || '';
  const rightPage = isSinglePage ? '' : (pages[currentPage + 1] || '');

  document.getElementById('pageLeft').innerHTML = `<p>${leftPage}</p>`;
  document.getElementById('pageRight').innerHTML = rightPage ? `<p>${rightPage}</p>` : '';

  document.getElementById('pageNumLeft').textContent = currentPage + 1;
  document.getElementById('pageNumRight').textContent = currentPage + 2;

  document.getElementById('pageInfo').textContent = isSinglePage
    ? `${currentPage + 1}`
    : `${currentPage + 1}-${currentPage + 2}`;

  const progress = ((currentPage + step) / pages.length) * 100;
  document.getElementById('progressFill').style.width = `${progress}%`;

  document.getElementById('prevBtn').disabled = currentPage === 0;
  document.getElementById('nextBtn').disabled = currentPage + step >= pages.length;

  const token = localStorage.getItem('token');
  if (token && lastProgressSent !== currentPage) {
    lastProgressSent = currentPage;
    fetch('/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'read_progress',
        payload: {
          bookId: book?.id,
          title: book?.title,
          page: currentPage + 1,
          totalPages: pages.length
        }
      })
    }).catch(() => {});
  }
}

let isTurning = false;

function buildFlipContent(text) {
  return `<div class="page-content"><p>${text || ''}</p></div>`;
}

function animateTurn(direction) {
  if (isTurning) return;
  const bookPages = document.getElementById('bookPages');
  const flipSheet = document.getElementById('flipSheet');
  const flipFront = document.getElementById('flipFront');
  const flipBack = document.getElementById('flipBack');
  const duration = 1000;

  if (isSinglePage) {
    if (direction === 'next' && currentPage + 1 >= pages.length) return;
    if (direction === 'prev' && currentPage === 0) return;
    currentPage = direction === 'next' ? currentPage + 1 : Math.max(0, currentPage - 1);
    renderPages();
    return;
  }

  if (direction === 'next' && currentPage + 2 >= pages.length) return;
  if (direction === 'prev' && currentPage === 0) return;

  isTurning = true;
  flipSheet.classList.add('active');
  const turningClass = direction === 'next' ? 'turning-next' : 'turning-prev';
  bookPages.classList.add(turningClass);
  bookPages.style.setProperty('--turn-progress', '0');

  if (direction === 'next') {
    flipSheet.style.left = '50%';
    flipSheet.style.right = '0';
    flipSheet.style.transformOrigin = 'left center';
    flipFront.innerHTML = buildFlipContent(pages[currentPage + 1] || '');
    flipBack.innerHTML = buildFlipContent(pages[currentPage + 2] || '');
    bookPages.classList.add('flip-next');
  } else {
    flipSheet.style.left = '0';
    flipSheet.style.right = '50%';
    flipSheet.style.transformOrigin = 'right center';
    flipFront.innerHTML = buildFlipContent(pages[currentPage] || '');
    flipBack.innerHTML = buildFlipContent(pages[currentPage - 1] || '');
    bookPages.classList.add('flip-prev');
  }

  const start = performance.now();
  const step = now => {
    const progress = Math.min(1, (now - start) / duration);
    bookPages.style.setProperty('--turn-progress', progress.toString());
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);

  setTimeout(() => {
    if (direction === 'next') {
      currentPage += 2;
    } else {
      currentPage = Math.max(0, currentPage - 2);
    }
    renderPages();
    bookPages.classList.remove('flip-next', 'flip-prev');
    bookPages.classList.remove(turningClass);
    bookPages.style.setProperty('--turn-progress', '0');
    flipSheet.classList.remove('active');
    isTurning = false;
  }, duration);
}

document.getElementById('nextBtn').addEventListener('click', () => {
  animateTurn('next');
});

document.getElementById('prevBtn').addEventListener('click', () => {
  animateTurn('prev');
});

const bookPagesElement = document.getElementById('bookPages');
if (bookPagesElement) {
  bookPagesElement.classList.add('single-page');
  paginate();
  renderPages();
}

const readingContent = document.querySelector('.reading-content');
if (readingContent) {
  readingContent.addEventListener('mousemove', event => {
    const rect = readingContent.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const bookPages = document.getElementById('bookPages');
    bookPages.style.setProperty('--tilt-y', `${x * 4}deg`);
    bookPages.style.setProperty('--tilt-x', `${-y * 3}deg`);
  });

  readingContent.addEventListener('mouseleave', () => {
    const bookPages = document.getElementById('bookPages');
    bookPages.style.setProperty('--tilt-y', '0deg');
    bookPages.style.setProperty('--tilt-x', '0deg');
  });
}

document.getElementById('tocBtn').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
});

const fontBtn = document.getElementById('fontBtn');
const fontSizes = ['0.9rem', '1rem', '1.1rem'];
let fontIndex = 0;

if (fontBtn) {
  fontBtn.addEventListener('click', () => {
    fontIndex = (fontIndex + 1) % fontSizes.length;
    document.documentElement.style.setProperty('--reader-font-size', fontSizes[fontIndex]);
  });
}

document.getElementById('overlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
});

document.getElementById('fontBtn').addEventListener('click', () => {
  const pagesNodes = document.querySelectorAll('.page');
  pagesNodes.forEach(p => {
    const current = window.getComputedStyle(p).fontSize;
    const newSize = parseInt(current, 10) + 2;
    p.style.fontSize = `${newSize}px`;
  });
});

document.getElementById('bookmarkBtn').addEventListener('click', function () {
  this.classList.toggle('bookmarked');
  const isBookmarked = this.classList.contains('bookmarked');
  localStorage.setItem(`bookmark-${bookId}`, JSON.stringify({
    page: currentPage,
    bookmarked: isBookmarked
  }));
});

const notesText = document.getElementById('notesText');
const notesKey = `notes-${bookId}`;
if (notesText) {
  notesText.value = localStorage.getItem(notesKey) || '';
  let saveTimer;
  notesText.addEventListener('input', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(notesKey, notesText.value.trim());
    }, 400);
  });
}

const savedBookmark = JSON.parse(localStorage.getItem(`bookmark-${bookId}`) || '{}');
if (savedBookmark.bookmarked) {
  document.getElementById('bookmarkBtn').classList.add('bookmarked');
  currentPage = savedBookmark.page || 0;
}

loadBook();

function goToChapter(idx) {
  currentPage = book.chapters[idx]?.startPage || 0;
  renderPages();
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}
