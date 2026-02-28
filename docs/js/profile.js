document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const form = document.getElementById('profile-form');
  const preview = document.getElementById('profilePreview');

  if (user) {
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    preview.src = user.photo || '';
    preview.style.display = user.photo ? 'block' : 'none';
  }

  document.getElementById('profilePhoto').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        preview.src = ev.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    // Simples: atualiza localStorage, backend pode ser ajustado para aceitar update
    user.name = document.getElementById('profileName').value;
    user.email = document.getElementById('profileEmail').value;
    const password = document.getElementById('profilePassword').value;
    if (password) user.password = password;
    const photoFile = document.getElementById('profilePhoto').files[0];
    if (photoFile) {
      const reader = new FileReader();
      reader.onload = ev => {
        user.photo = ev.target.result;
        localStorage.setItem('user', JSON.stringify(user));
        alert('Perfil atualizado!');
      };
      reader.readAsDataURL(photoFile);
    } else {
      localStorage.setItem('user', JSON.stringify(user));
      alert('Perfil atualizado!');
    }
    // TODO: enviar update para backend
  });

  // Livros lidos e histórico de pesquisa
  const booksRead = JSON.parse(localStorage.getItem('booksRead') || '[]');
  const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
  document.getElementById('booksRead').innerHTML = booksRead.map(b => `<li>${b.title}</li>`).join('');
  document.getElementById('searchHistory').innerHTML = searchHistory.map(s => `<li>${s}</li>`).join('');
});
