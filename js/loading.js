// =============================================================
// Loading Overlay System
// =============================================================

class LoadingSystem {
  constructor() {
    this.createOverlay();
  }

  createOverlay() {
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
      #api-loading-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      #api-loading-overlay.active {
        opacity: 1;
        visibility: visible;
      }
      .api-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 16px;
      }
      .api-loading-text {
        color: white;
        font-size: 1.1rem;
        font-weight: 500;
        font-family: var(--font-sans, 'Inter', sans-serif);
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    // Create DOM
    this.overlay = document.createElement('div');
    this.overlay.id = 'api-loading-overlay';
    
    this.spinner = document.createElement('div');
    this.spinner.className = 'api-spinner';
    
    this.textEl = document.createElement('div');
    this.textEl.className = 'api-loading-text';
    this.textEl.textContent = 'กำลังโหลด...';

    this.overlay.appendChild(this.spinner);
    this.overlay.appendChild(this.textEl);
    
    // Use setTimeout to ensure body is parsed
    setTimeout(() => {
      document.body.appendChild(this.overlay);
    }, 0);
  }

  show(text = 'กำลังโหลด...') {
    this.textEl.textContent = text;
    this.overlay.classList.add('active');
  }

  hide() {
    this.overlay.classList.remove('active');
  }
}

// Instantiate globally
const Loading = new LoadingSystem();
