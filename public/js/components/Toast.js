/**
 * Toast Notification System
 * Provides user feedback with modern, accessible toast notifications
 */

class Toast {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.init();
    }

    /**
     * Initialize the toast system
     */
    init() {
        this.createContainer();
        this.setupStyles();
    }

    /**
     * Create toast container
     */
    createContainer() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(this.container);
        }
    }

    /**
     * Setup toast styles
     */
    setupStyles() {
        if (document.getElementById('toast-styles')) return;

        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                max-width: 400px;
                pointer-events: none;
            }

            .toast {
                background-color: var(--color-bg-elevated);
                border: 1px solid var(--color-border-primary);
                border-radius: 0.75rem;
                box-shadow: var(--color-shadow-lg);
                padding: 1rem 1.25rem;
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                min-width: 300px;
                max-width: 400px;
                pointer-events: auto;
                position: relative;
                overflow: hidden;
                backdrop-filter: blur(10px);
                animation: toastSlideIn 0.3s var(--ease-out);
            }

            .toast.toast-success {
                border-left: 4px solid var(--color-success);
            }

            .toast.toast-error {
                border-left: 4px solid var(--color-error);
            }

            .toast.toast-warning {
                border-left: 4px solid var(--color-warning);
            }

            .toast.toast-info {
                border-left: 4px solid var(--color-accent);
            }

            .toast-icon {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                margin-top: 0.125rem;
            }

            .toast-content {
                flex: 1;
                min-width: 0;
            }

            .toast-title {
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-semibold);
                color: var(--color-text-primary);
                margin-bottom: 0.25rem;
                line-height: var(--line-height-snug);
            }

            .toast-message {
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                line-height: var(--line-height-relaxed);
                word-wrap: break-word;
            }

            .toast-close {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                background: none;
                border: none;
                color: var(--color-text-tertiary);
                cursor: pointer;
                border-radius: 0.25rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                margin-top: -0.125rem;
            }

            .toast-close:hover {
                background-color: var(--color-bg-tertiary);
                color: var(--color-text-primary);
            }

            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background-color: var(--color-primary);
                border-radius: 0 0 0.75rem 0.75rem;
                transition: width linear;
            }

            .toast.toast-success .toast-progress {
                background-color: var(--color-success);
            }

            .toast.toast-error .toast-progress {
                background-color: var(--color-error);
            }

            .toast.toast-warning .toast-progress {
                background-color: var(--color-warning);
            }

            .toast.toast-info .toast-progress {
                background-color: var(--color-accent);
            }

            @keyframes toastSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes toastSlideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            .toast.toast-exit {
                animation: toastSlideOut 0.3s var(--ease-in) forwards;
            }

            @media (max-width: 768px) {
                .toast-container {
                    top: 0.5rem;
                    right: 0.5rem;
                    left: 0.5rem;
                    max-width: none;
                }

                .toast {
                    min-width: auto;
                    max-width: none;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .toast {
                    animation: none;
                }

                .toast.toast-exit {
                    animation: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of toast (success, error, warning, info)
     * @param {Object} options - Additional options
     */
    show(message, type = 'info', options = {}) {
        const {
            title = null,
            duration = 5000,
            persistent = false,
            action = null,
            id = null
        } = options;

        const toastId = id || this.generateId();
        
        // Remove existing toast with same ID
        if (this.toasts.has(toastId)) {
            this.remove(toastId);
        }

        const toast = this.createToast(toastId, message, type, title, action);
        this.container.appendChild(toast);
        this.toasts.set(toastId, toast);

        // Auto remove after duration (unless persistent)
        if (!persistent && duration > 0) {
            this.scheduleRemoval(toastId, duration);
        }

        // Announce to screen readers
        this.announceToScreenReader(message, type);

        return toastId;
    }

    /**
     * Create toast element
     */
    createToast(id, message, type, title, action) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        toast.dataset.toastId = id;

        const icon = this.getIcon(type);
        const closeButton = this.createCloseButton(id);

        toast.innerHTML = `
            <div class="toast-icon">
                ${icon}
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${this.escapeHtml(title)}</div>` : ''}
                <div class="toast-message">${this.escapeHtml(message)}</div>
                ${action ? this.createActionButton(action) : ''}
            </div>
            ${closeButton}
            <div class="toast-progress"></div>
        `;

        // Add click to dismiss
        toast.addEventListener('click', (e) => {
            if (e.target === toast || e.target.closest('.toast-content')) {
                this.remove(id);
            }
        });

        return toast;
    }

    /**
     * Create close button
     */
    createCloseButton(id) {
        return `
            <button class="toast-close" aria-label="Close notification" data-toast-id="${id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
    }

    /**
     * Create action button
     */
    createActionButton(action) {
        return `
            <button class="btn btn-sm btn-primary mt-2" onclick="${action.handler}">
                ${this.escapeHtml(action.label)}
            </button>
        `;
    }

    /**
     * Get icon for toast type
     */
    getIcon(type) {
        const icons = {
            success: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-success);">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
            `,
            error: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-error);">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            `,
            warning: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-warning);">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            `,
            info: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-accent);">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
            `
        };

        return icons[type] || icons.info;
    }

    /**
     * Schedule toast removal
     */
    scheduleRemoval(id, duration) {
        const toast = this.toasts.get(id);
        if (!toast) return;

        const progressBar = toast.querySelector('.toast-progress');
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transitionDuration = `${duration}ms`;
            progressBar.style.width = '0%';
        }

        setTimeout(() => {
            this.remove(id);
        }, duration);
    }

    /**
     * Remove toast
     */
    remove(id) {
        const toast = this.toasts.get(id);
        if (!toast) return;

        toast.classList.add('toast-exit');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(id);
        }, 300);
    }

    /**
     * Remove all toasts
     */
    removeAll() {
        this.toasts.forEach((toast, id) => {
            this.remove(id);
        });
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Announce to screen readers
     */
    announceToScreenReader(message, type) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `${type}: ${message}`;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Convenience methods
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', { ...options, duration: 7000 });
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }
}

// Add screen reader only styles
if (!document.getElementById('sr-only-styles')) {
    const style = document.createElement('style');
    style.id = 'sr-only-styles';
    style.textContent = `
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
    `;
    document.head.appendChild(style);
}
