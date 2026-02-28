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

// Preview da capa via PDF (primeira página)
const pdfInput = document.getElementById('book-pdf');
const coverPreview = document.getElementById('cover-preview');
const pdfInfo = document.getElementById('pdf-info');
let selectedPdf = null;
let coverBlob = null;

const pdfjsLib = window.pdfjsLib;
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function resetPdfPreview() {
  coverPreview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>';
  pdfInfo.textContent = 'Nenhum arquivo selecionado.';
  coverBlob = null;
}

pdfInput.addEventListener('change', async e => {
  const file = e.target.files[0];
  selectedPdf = file || null;

  if (!file) {
    resetPdfPreview();
    return;
  }

  try {
    if (!pdfjsLib) {
      pdfInfo.textContent = 'Prévia do PDF indisponível.';
      return;
    }
    pdfInfo.textContent = 'Gerando prévia da capa...';
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    coverPreview.innerHTML = '';
    coverPreview.appendChild(canvas);
    pdfInfo.textContent = `${file.name} • ${pdf.numPages} páginas`;

    coverBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  } catch (err) {
    console.error('Erro ao gerar capa do PDF:', err);
    resetPdfPreview();
    alert('Não foi possível gerar a prévia da capa. Verifique o PDF.');
  }
});

// Envio do formulário
const publishForm = document.getElementById('publish-form');
const successMessage = document.getElementById('successMessage');

publishForm.addEventListener('submit', async e => {
  e.preventDefault();

  try {
    const pdfFile = selectedPdf || pdfInput.files?.[0];
    if (!pdfFile) {
      alert('Selecione um PDF para publicar o livro.');
      return;
    }

    const formData = new FormData();
    const titleValue = document.getElementById('title').value.trim();
    if (!titleValue) {
      alert('Informe o título do livro.');
      return;
    }
    formData.append('title', titleValue);
    formData.append('author', document.getElementById('author').value.trim());
    formData.append('description', '');
    formData.append('category', document.getElementById('category').value);
    formData.append('bookFile', pdfFile);
    if (coverBlob) {
      formData.append('coverImage', coverBlob, 'cover.png');
    }

    const bookRes = await fetch('/livros.json', {
      method: 'POST',
      body: formData
    });

    if (!bookRes.ok) {
      let message = 'Erro ao criar livro';
      const clone = bookRes.clone();
      try {
        const errorData = await bookRes.json();
        if (errorData?.error) message = errorData.error;
      } catch (err) {
        try {
          const errorText = await clone.text();
          if (errorText) message = errorText;
        } catch (errText) {
          // ignore
        }
      }
      console.error('Falha ao publicar:', bookRes.status, message);
      throw new Error(message);
    }

    successMessage.classList.add('show');
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  } catch (err) {
    console.error('Erro:', err);
    alert(err?.message || 'Erro ao publicar livro');
  }
});

document.getElementById('save-draft').addEventListener('click', () => {
  const data = {
    title: document.getElementById('title').value
  };
  localStorage.setItem('bookDraft', JSON.stringify(data));
  alert('Rascunho salvo!');
});

const draft = localStorage.getItem('bookDraft');
if (draft) {
  const data = JSON.parse(draft);
  document.getElementById('title').value = data.title || '';
  // Autor e sinopse removidos do formulário
}
