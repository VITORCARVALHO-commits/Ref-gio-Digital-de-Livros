const user = JSON.parse(localStorage.getItem('user') || '{}');
const userName = document.getElementById('userName');
if (userName) {
  userName.textContent = user.name?.split(' ')[0] || 'Leitor';
  // Mostrar foto se existir
  const avatar = document.querySelector('.sidebar-avatar');
  if (user.photo) {
    avatar.innerHTML = `<img src="${user.photo}" alt="avatar" style="width:32px;height:32px;border-radius:50%;">`;
  }
  avatar.style.cursor = 'pointer';
  avatar.onclick = () => {
    const panel = document.getElementById('userDetailsPanel');
    const content = document.getElementById('userDetailsContent');
    if (!user.name) {
      content.innerHTML = `<p>Você não está logado.</p><a href="/auth.html" class="btn btn-primary">Entrar</a>`;
    } else {
      content.innerHTML = `
        <p><strong>Nome:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        ${user.photo ? `<img src="${user.photo}" alt="avatar" style="width:80px;height:80px;border-radius:50%;margin-top:8px;">` : ''}
      `;
    }
    panel.style.display = 'block';
    setTimeout(() => {
      document.addEventListener('click', function hidePanel(e) {
        if (!panel.contains(e.target) && !avatar.contains(e.target)) {
          panel.style.display = 'none';
          document.removeEventListener('click', hidePanel);
        }
      });
    }, 100);
  };
}

const themeToggle = document.getElementById('toggle-theme');
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

const shelvesConfig = [
  {
    id: 'misterios',
    title: 'Grátis em Mistérios e suspenses',
    subtitle: 'Explore os livros mais vendidos deste gênero.'
  },
  {
    id: 'romance',
    title: 'Grátis em Romance',
    subtitle: 'Descubra histórias inesquecíveis para relaxar.'
  },
  {
    id: 'destaques',
    title: 'Destaques da semana',
    subtitle: 'Seleção especial para sua biblioteca.'
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
  const readerPath = `/reader.html?id=${book.id}`;
  if (book.requiresLogin && !authToken) {
    return `/auth.html?redirect=${encodeURIComponent(readerPath)}`;
  }
  return readerPath;
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
  return `
    <div class="book-tile">
      <a class="book-cover-link" href="${getBookLink(book)}" aria-label="Abrir ${book.title}" target="_blank">
        <div class="book-cover">
          <img src="${book.coverImage && book.coverImage !== '' ? book.coverImage : 'https://images.unsplash.com/photo-1543002588-d4d28bde5205?w=300&h=400&fit=crop'}" alt="${book.title}" style="object-fit:contain;width:100%;height:100%;background:#fff;">
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

  if (!book) {
    return;
  }

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

function normalizeBooks(books) {
  return books.filter(Boolean);
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
  // Embaralha os livros para mostrar aleatórios nas prateleiras
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  shelvesRoot.innerHTML = '';
  const now = Date.now();
  shelvesConfig.forEach((config) => {
    const section = createShelfSection(config);
    shelvesRoot.appendChild(section);
    const target = section.querySelector(`#shelf-${config.id}`);
    let shelfBooks;
    // Se for a prateleira de Romance, filtra só livros dessa categoria
    if (config.title.includes('Romance')) {
      shelfBooks = books.filter(book => (book.category || '').toLowerCase() === 'romance');
      console.log('Livros Romance:', shelfBooks);
      if (shelfBooks.length === 0) {
        target.innerHTML = '<p class="shelf-empty">Nenhum livro de romance disponível no momento.</p>';
        return;
      }
    } else if (config.title.includes('Destaques da semana')) {
      // Só livros da categoria 'Destaques da semana' publicados nos últimos 20 dias
      shelfBooks = books.filter(book => {
        if ((book.category || '').toLowerCase() !== 'destaques da semana') return false;
        if (!book.createdAt) return false;
        const created = new Date(book.createdAt).getTime();
        return (now - created) <= 20 * 24 * 60 * 60 * 1000;
      });
    } else {
      shelfBooks = shuffle(books).slice(0, 10);
    }
    // Remover duplicados por título em cada prateleira
    const seen = new Set();
    shelfBooks = shelfBooks.filter(book => {
      if (seen.has(book.title)) return false;
      seen.add(book.title);
      return true;
    });
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

function updateGoal(books) {
  const completed = Math.min(books.length, 6);
  const progressValue = Math.round((completed / 6) * 100);
  document.getElementById('goal-value').textContent = completed;
  document.getElementById('goal-progress').style.width = `${progressValue}%`;
}

// Renderiza hero-panel igual ao index
function renderHeroDashboard(book) {
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroLink = document.getElementById('hero-link');
  const heroCover = document.getElementById('hero-cover');
  if (!book) return;
  heroTitle.textContent = book.title;
  heroSubtitle.textContent = book.description || `Por ${book.author || 'Autor desconhecido'}`;
  heroLink.href = `/reader.html?id=${book.id}`;
  heroLink.textContent = 'Ler agora';
  heroCover.innerHTML = `
    <div class="hero-cover-inner">
      <div class="book-cover">
        <img src="${book.coverImage}" alt="${book.title}">
      </div>
    </div>
  `;
}

// No dashboard, destaque é o top ou última leitura
async function loadBooksDashboard() {
  try {
    const res = await fetch('/livros.json');
    const books = (await res.json()) || [];
    // Destaque: último lido no topo, depois prateleiras sem ele
    const lastReadId = localStorage.getItem('lastReadBookId');
    const lastRead = books.find(b => b.id === lastReadId);
    if (lastRead) {
      renderHeroDashboard(lastRead);
      // Se só existe 1 ou 2 livros, mostra todos nas prateleiras
      let booksWithoutLast;
      if (books.length <= 2) {
        booksWithoutLast = books;
      } else {
        booksWithoutLast = books.filter(b => b.id !== lastReadId);
      }
      renderShelves(booksWithoutLast);
    } else {
      renderHeroDashboard(books[0]);
      // Se só existe 1 ou 2 livros, mostra todos nas prateleiras
      let shelfBooks;
      if (books.length <= 2) {
        shelfBooks = books;
      } else {
        shelfBooks = books.slice(1);
      }
      renderShelves(shelfBooks);
    }
    attachShelfControls();
    updateGoal(books);
    return books;
  } catch (err) {
    console.error('Erro ao carregar livros:', err);
    shelvesRoot.innerHTML = '<p class="shelf-empty">Nenhum livro disponível no momento.</p>';
    return [];
  }
}

async function loadBooks() {
  try {
    const res = await fetch('/livros.json');
    const books = normalizeBooks(await res.json());
    renderHero(books[0]);
    renderShelves(books);
    attachShelfControls();
    updateGoal(books);
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

loadBooksDashboard().then(books => {
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

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };
}

// Biblioteca pessoal e último livro lido no topo
function getUserLibrary() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  return cachedBooks.filter(book => favorites.some(f => f.bookId === book.id && f.userId === user.id));
}

function getLastReadBook() {
  const lastReadId = localStorage.getItem('lastReadBookId');
  if (lastReadId) {
    return cachedBooks.find(book => book.id === lastReadId);
  }
  return null;
}

function renderDashboard() {
  const lastRead = getLastReadBook();
  if (lastRead) {
    renderHero(lastRead);
  } else {
    renderHero(cachedBooks[0]); // fallback
  }
  renderShelves(cachedBooks);
  updateGoal(getUserLibrary());
}

loadBooksDashboard().then(books => {
  cachedBooks = books;
  renderCollections();
  renderDashboard(); // Mostra hero (último lido) e prateleiras
});

// Exibe 'Minha Biblioteca' só se logado
const minhaBibliotecaMenu = document.getElementById('minhaBibliotecaMenu');
if (minhaBibliotecaMenu && user && user.name) {
  minhaBibliotecaMenu.style.display = '';
}

// Navegação dinâmica entre seções da dashboard
const sectionMap = {
  'Início': 'inicio-section',
  'Minha Biblioteca': 'minha-biblioteca-section',
  'Quero Ler': 'quero-ler-section',
  'Concluídos': 'concluidos-section',
  'Audiolivros': 'audiolivros-section',
  'PDFs': 'pdfs-section',
  'Minhas Amostras': 'amostras-section'
};

document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const label = item.textContent.trim();
    Object.values(sectionMap).forEach(id => {
      const sec = document.getElementById(id);
      if (sec) sec.style.display = 'none';
    });
    const showId = sectionMap[label];
    if (showId) {
      const sec = document.getElementById(showId);
      if (sec) sec.style.display = '';
      // Se for Início, renderiza igual ao index
      if (showId === 'inicio-section') {
        loadBooksDashboard();
      }
    }
  });
});

// Renderiza prateleiras em Minha Biblioteca
function renderMinhaBiblioteca() {
  const container = document.getElementById('minha-biblioteca-list');
  if (!container) return;
  // Prateleiras com layout igual ao index
  const livrosSalvos = JSON.parse(localStorage.getItem('livrosSalvos') || '[]');
  const livrosBuscados = JSON.parse(localStorage.getItem('livrosBuscados') || '[]');
  const livrosModelos = [
    { title: 'Modelo 1', author: 'Autor Modelo', coverImage: '/img/modelo1.png', id: 'modelo1' },
    { title: 'Modelo 2', author: 'Autor Modelo', coverImage: '/img/modelo2.png', id: 'modelo2' }
  ];
  const shelves = [
    { id: 'salvos', title: 'Livros Salvos', subtitle: 'Seus livros favoritos.', books: livrosSalvos },
    { id: 'buscados', title: 'Livros Buscados', subtitle: 'Livros que você pesquisou.', books: livrosBuscados },
    { id: 'modelos', title: 'Modelos', subtitle: 'Livros de exemplo.', books: livrosModelos }
  ];
  function getBookLink(book) {
    const readerPath = `/reader.html?id=${book.id}`;
    return readerPath;
  }
  function bookTile(book) {
    return `
      <div class="book-tile">
        <a class="book-cover-link" href="${getBookLink(book)}" aria-label="Abrir ${book.title}">
          <div class="book-cover">
            <img src="${book.coverImage || '/img/placeholder.png'}" alt="${book.title}" style="object-fit:contain;width:100%;height:100%;background:#fff;">
          </div>
          <div class="book-tile-meta">
            <div class="book-title">${book.title}</div>
            <div class="book-author">${book.author || 'Autor desconhecido'}</div>
          </div>
        </a>
      </div>
    `;
  }
  function createShelfSection(config) {
    return `
      <section class="shelf">
        <div class="shelf-header">
          <div>
            <h2>${config.title}</h2>
            <p>${config.subtitle}</p>
          </div>
        </div>
        <div class="shelf-row">
          <button class="shelf-control" data-direction="prev" data-target="${config.id}" aria-label="Anterior">‹</button>
          <div class="shelf-scroll" id="shelf-${config.id}">
            ${config.books.map(bookTile).join('')}
          </div>
          <button class="shelf-control" data-direction="next" data-target="${config.id}" aria-label="Próximo">›</button>
        </div>
      </section>
    `;
  }
  container.innerHTML = shelves.map(createShelfSection).join('');
  // Adiciona controles de scroll
  container.querySelectorAll('.shelf-control').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const direction = button.dataset.direction;
      const containerScroll = container.querySelector(`#shelf-${targetId}`);
      if (!containerScroll) return;
      const delta = direction === 'next' ? 420 : -420;
      containerScroll.scrollBy({ left: delta, behavior: 'smooth' });
    });
  });
}

// Atualiza ao mostrar a seção
if (minhaBibliotecaMenu) {
  minhaBibliotecaMenu.addEventListener('click', renderMinhaBiblioteca);
}
