// =============================================================
// Toast Notification System
// =============================================================

class ToastSystem {
  constructor() {
    this.createContainer();
  }

  createContainer() {
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
      #api-toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        z-index: 999999;
      }
      .api-toast {
        min-width: 250px;
        max-width: 350px;
        background: var(--bg-color, white);
        color: var(--text-color, #1f2937);
        border: 1px solid var(--border-color, transparent);
        padding: 14px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: var(--font-sans, 'Inter', sans-serif);
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 12px;
        transform: translateX(120%);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
      }
      .api-toast.show {
        transform: translateX(0);
        opacity: 1;
      }
      .api-toast.hide {
        transform: translateX(120%);
        opacity: 0;
      }
      .api-toast-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
      .api-toast.success {
        border-left: 4px solid #10b981;
      }
      .api-toast.success .api-toast-icon {
        color: #10b981;
      }
      .api-toast.error {
        border-left: 4px solid #ef4444;
      }
      .api-toast.error .api-toast-icon {
        color: #ef4444;
      }
      .api-toast.info {
        border-left: 4px solid #3b82f6;
      }
      .api-toast.info .api-toast-icon {
        color: #3b82f6;
      }
    `;
    document.head.appendChild(style);

    // Create Container
    this.container = document.createElement('div');
    this.container.id = 'api-toast-container';
    
    setTimeout(() => {
      document.body.appendChild(this.container);
    }, 0);
  }

  getIconSvg(type) {
    if (type === 'success') {
      return `<svg class="api-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    } else if (type === 'error') {
      return `<svg class="api-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }
    // Default info icon
    return `<svg class="api-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `api-toast ${type}`;
    
    toast.innerHTML = `
      ${this.getIconSvg(type)}
      <div style="flex-grow: 1; font-weight: 500;">${message}</div>
    `;

    this.container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after duration
    setTimeout(() => {
      toast.classList.replace('show', 'hide');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300); // Wait for transition
    }, duration);
  }
}

// Instantiate globally
const Toast = new ToastSystem();
