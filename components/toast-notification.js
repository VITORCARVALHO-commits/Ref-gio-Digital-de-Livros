class ToastNotification extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }
        .toast {
          padding: 12px 20px;
          border-radius: 4px;
          color: white;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-width: 250px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          animation: slideIn 0.3s ease-out;
        }
        .success {
          background-color: #10B981;
        }
        .error {
          background-color: #EF4444;
        }
        .warning {
          background-color: #F59E0B;
        }
        .info {
          background-color: #3B82F6;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          margin-left: 10px;
        }
      </style>
      <div class="toast hidden">
        <span class="message"></span>
        <button class="close-btn">
          <i data-feather="x"></i>
        </button>
      </div>
    `;
  }

  show(type, message, duration = 5000) {
    const toast = this.shadowRoot.querySelector('.toast');
    const messageEl = this.shadowRoot.querySelector('.message');
    const closeBtn = this.shadowRoot.querySelector('.close-btn');

    toast.className = `toast ${type}`;
    messageEl.textContent = message;
    toast.classList.remove('hidden');

    closeBtn.onclick = () => {
      toast.classList.add('hidden');
    };

    setTimeout(() => {
      toast.classList.add('hidden');
    }, duration);

    feather.replace();
  }
}

customElements.define('toast-notification', ToastNotification);