const themeToggle = document.getElementById('toggle-theme');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const storedTheme = localStorage.getItem('darkMode');
if (storedTheme === 'true') {
  document.documentElement.classList.add('dark-mode');
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark-mode'));
  });
}

if (mobileMenuToggle && mobileMenuOverlay) {
  const toggleMenu = () => {
    document.body.classList.toggle('mobile-menu-open');
    mobileMenuOverlay.classList.toggle('open');
  };

  mobileMenuToggle.addEventListener('click', toggleMenu);
  mobileMenuOverlay.addEventListener('click', toggleMenu);
}

const shelvesConfig = [
  {
    id: 'destaques',
    title: 'Livros em Destaque',
    subtitle: 'Seleção especial para começar agora.'
  },
  {
    id: 'favoritos',
    title: 'Favoritos dos leitores',
    subtitle: 'Os títulos mais amados da comunidade.'
  },
  {
    id: 'novos',
    title: 'Novidades',
    subtitle: 'Atualizações fresquinhas para sua estante.'
  }
];

const shelvesRoot = document.getElementById('shelves');
const searchInput = document.getElementById('book-search');
const authToken = localStorage.getItem('token');
let searchTimer;

function logActivity(type, payload) {
  if (!authToken) return;
  fetch('/activity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({ type, payload })
  }).catch(() => {});
}

function getBookLink(book) {
  if (book.requiresLogin && !authToken) {
    return `/auth.html?redirect=${encodeURIComponent(`/ler.html?id=${book.id}`)}`;
  }
  return `/ler.html?id=${book.id}`;
}

function createShelfSection(config) {
  const section = document.createElement('section');
  section.className = 'shelf';
  section.innerHTML = `
    <div class="shelf-header">
      <div>
        <h2>${config.title}</h2>
        <p>${config.subtitle}</p>
      </div>
      <button class="shelf-link" type="button" data-shelf="${config.id}">Ver tudo</button>
    </div>
    <div class="shelf-row">
      <button class="shelf-control" data-direction="prev" data-target="${config.id}" aria-label="Anterior">‹</button>
      <div class="shelf-scroll" id="shelf-${config.id}"></div>
      <button class="shelf-control" data-direction="next" data-target="${config.id}" aria-label="Próximo">›</button>
    </div>
  `;
  return section;
}

function bookTile(book) {
  const locked = book.requiresLogin && !authToken;
  return `
    <div class="book-tile">
      <a class="book-cover-link" href="${getBookLink(book)}" aria-label="Abrir ${book.title}">
        <div class="book-cover">
          <img src="${book.coverImage || 'https://images.unsplash.com/photo-1543002588-d4d28bde5205?w=300&h=400&fit=crop'}" alt="${book.title}">
          ${locked ? '<div class="book-lock-badge" aria-hidden="true">🔒</div>' : ''}
        </div>
        <div class="book-tile-meta">
          <div class="book-title">${book.title}</div>
          <div class="book-author">${book.author}</div>
        </div>
      </a>
    </div>
  `;
}

function renderHero(book) {
  const heroCover = document.getElementById('hero-cover');
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroLink = document.getElementById('hero-link');

  if (!book) return;
  heroTitle.textContent = book.title;
  heroSubtitle.textContent = book.description || `Por ${book.author}`;
  heroLink.href = getBookLink(book);
  heroLink.textContent = 'Ler agora';
  heroCover.innerHTML = `
    <div class="hero-cover-inner">
      <div class="book-cover">
        <img src="${book.coverImage}" alt="${book.title}">
      </div>
    </div>
  `;
}

function getShelfBooks(books, count, offset) {
  if (!books.length) return [];
  const result = [];
  for (let i = 0; i < count; i += 1) {
    result.push(books[(offset + i) % books.length]);
  }
  return result;
}

function renderShelves(books) {
  shelvesRoot.innerHTML = '';
  shelvesConfig.forEach((config, index) => {
    const section = createShelfSection(config);
    shelvesRoot.appendChild(section);
    const target = section.querySelector(`#shelf-${config.id}`);
    const shelfBooks = getShelfBooks(books, 10, index * 3);
    target.innerHTML = shelfBooks.map(bookTile).join('');
  });
}

function attachShelfControls() {
  document.querySelectorAll('.shelf-control').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const direction = button.dataset.direction;
      const container = document.getElementById(`shelf-${targetId}`);
      if (!container) return;
      const delta = direction === 'next' ? 420 : -420;
      container.scrollBy({ left: delta, behavior: 'smooth' });
    });
  });
}

async function loadBooks() {
  try {
    const res = await fetch('/livros.json');
    const books = (await res.json()) || [];
    renderHero(books[0]);
    renderShelves(books);
    attachShelfControls();
    return books;
  } catch (err) {
    console.error('Erro ao carregar livros:', err);
    shelvesRoot.innerHTML = '<p class="shelf-empty">Nenhum livro disponível no momento.</p>';
    return [];
  }
}

let cachedBooks = [];
const collectionsKey = 'customCollections';

function renderCollections() {
  const container = document.getElementById('collections-list');
  if (!container) return;
  const collections = JSON.parse(localStorage.getItem(collectionsKey) || '[]');
  container.innerHTML = '';
  collections.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'sidebar-item sidebar-button';
    btn.type = 'button';
    btn.innerHTML = `<span class="sidebar-icon"></span>${name}`;
    btn.addEventListener('click', () => {
      const filtered = cachedBooks.filter(book => book.title.toLowerCase().includes(name.toLowerCase()));
      renderShelves(filtered.length ? filtered : cachedBooks);
      attachShelfControls();
    });
    container.appendChild(btn);
  });
}

loadBooks().then(books => {
  cachedBooks = books;
  renderCollections();
});

if (searchInput) {
  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = term
      ? cachedBooks.filter(book => `${book.title} ${book.author}`.toLowerCase().includes(term))
      : cachedBooks;
    renderShelves(filtered);
    attachShelfControls();

    clearTimeout(searchTimer);
    if (term) {
      searchTimer = setTimeout(() => {
        logActivity('search', { term });
      }, 400);
    }
  });
}

const popularBtn = document.getElementById('collection-popular');
if (popularBtn) {
  popularBtn.addEventListener('click', () => {
    const sorted = [...cachedBooks].sort((a, b) => a.title.localeCompare(b.title));
    renderShelves(sorted);
    attachShelfControls();
  });
}

const newCollectionBtn = document.getElementById('collection-new');
if (newCollectionBtn) {
  newCollectionBtn.addEventListener('click', () => {
    const name = prompt('Nome da nova coleção:');
    if (!name) return;
    const collections = JSON.parse(localStorage.getItem(collectionsKey) || '[]');
    collections.push(name);
    localStorage.setItem(collectionsKey, JSON.stringify(collections));
    renderCollections();
  });
}
