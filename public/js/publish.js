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

// Preview da capa
const coverInput = document.getElementById('cover');
const coverPreview = document.getElementById('cover-preview');
let selectedFile = null;

coverInput.addEventListener('change', e => {
  const file = e.target.files[0];
  selectedFile = file || null;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      coverPreview.innerHTML = `<img src="${reader.result}" alt="Preview da Capa">`;
    };
    reader.readAsDataURL(file);
  } else {
    coverPreview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>';
  }
});

// Envio do formulário
const publishForm = document.getElementById('publish-form');
const successMessage = document.getElementById('successMessage');

publishForm.addEventListener('submit', async e => {
  e.preventDefault();

  try {
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value.trim());
    formData.append('author', document.getElementById('author').value.trim());
    formData.append('description', document.getElementById('synopsis').value.trim());
    if (selectedFile) {
      formData.append('coverImage', selectedFile);
    }

    const bookRes = await fetch('/livros.json', {
      method: 'POST',
      body: formData
    });

    if (!bookRes.ok) throw new Error('Erro ao criar livro');
    const newBook = await bookRes.json();

    const chapterRes = await fetch(`/livros.json/${newBook.id}/capitulos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById('chapter-title').value.trim(),
        content: document.getElementById('chapter-content').value.trim()
      })
    });

    if (!chapterRes.ok) throw new Error('Erro ao adicionar capítulo');

    successMessage.classList.add('show');
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  } catch (err) {
    console.error('Erro:', err);
    alert('Erro ao publicar livro');
  }
});

document.getElementById('save-draft').addEventListener('click', () => {
  const data = {
    title: document.getElementById('title').value,
    author: document.getElementById('author').value,
    synopsis: document.getElementById('synopsis').value,
    chapterTitle: document.getElementById('chapter-title').value,
    chapterContent: document.getElementById('chapter-content').value
  };
  localStorage.setItem('bookDraft', JSON.stringify(data));
  alert('Rascunho salvo!');
});

const draft = localStorage.getItem('bookDraft');
if (draft) {
  const data = JSON.parse(draft);
  document.getElementById('title').value = data.title || '';
  document.getElementById('author').value = data.author || '';
  document.getElementById('synopsis').value = data.synopsis || '';
  document.getElementById('chapter-title').value = data.chapterTitle || '';
  document.getElementById('chapter-content').value = data.chapterContent || '';
}
