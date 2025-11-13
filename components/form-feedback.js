class FormFeedback extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .feedback {
                    padding: 3rem;
                    border-radius: 0.5rem;
                    margin: 1rem 0;
                    display: none;
                }
                .success {
                    background-color: #f0fff4;
                    color: #2f855a;
                    border: 1px solid #c6f6d5;
                }
                .error {
                    background-color: #fff5f5;
                    color: #c53030;
                    border: 1px solid #fed7d7;
                }
            </style>
            <div class="feedback" id="feedback"></div>
        `;
    }

    show(type, message) {
        const feedback = this.shadowRoot.getElementById('feedback');
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        feedback.style.display = 'block';
        
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 5000);
    }
}

customElements.define('form-feedback', FormFeedback);