const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!user.id || user.role !== 'autor') {
  window.location.href = '/auth.html';
}

document.getElementById('userName').textContent = user.name?.split(' ')[0] || 'Autor';

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  document.getElementById(tab).classList.add('active');
  event.target.classList.add('active');
}

function openPublishModal() {
  document.getElementById('publishModal').classList.add('open');
}

function closeModal() {
  document.getElementById('publishModal').classList.remove('open');
}

function handlePublish(e) {
  e.preventDefault();
  alert('Livro publicado com sucesso! 🎉');
  closeModal();
}

function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = '/auth.html';
}

// Simula dados
document.getElementById('booksCount').textContent = '3';
document.getElementById('readsCount').textContent = '1.245';
document.getElementById('earningsTotal').textContent = 'R$ 2.480,50';
document.getElementById('earningsPending').textContent = 'R$ 450,00';
