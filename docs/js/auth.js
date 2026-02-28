let selectedRole = 'leitor';

function toggleForm() {
  document.getElementById('loginForm').classList.toggle('form-hidden');
  document.getElementById('signupForm').classList.toggle('form-hidden');
  document.getElementById('errorMsg').classList.remove('show');
  document.getElementById('errorMsg2').classList.remove('show');
}

const redirectParam = new URLSearchParams(window.location.search).get('redirect');

function showError(msg, formType = 'login') {
  const errorEl = formType === 'login' ? document.getElementById('errorMsg') : document.getElementById('errorMsg2');
  errorEl.textContent = msg;
  errorEl.classList.add('show');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Erro ao fazer login', 'login');
      return;
    }

    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);

    window.location.href = redirectParam || (data.user.role === 'autor' ? '/dashboard-autor.html' : '/dashboard.html');
  } catch (err) {
    showError('Erro ao conectar', 'login');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  try {
    const res = await fetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        role: selectedRole,
        bio: ''
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Erro ao criar conta', 'signup');
      return;
    }

    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);

    window.location.href = redirectParam || (selectedRole === 'autor' ? '/dashboard-autor.html' : '/dashboard.html');
  } catch (err) {
    showError('Erro ao conectar', 'signup');
  }
}
