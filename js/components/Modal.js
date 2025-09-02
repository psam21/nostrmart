/**
 * Modal System
 * Provides accessible, modern modal dialogs
 */

class Modal {
    constructor() {
        this.activeModal = null;
        this.modals = new Map();
        this.init();
    }

    /**
     * Initialize modal system
     */
    init() {
        this.setupStyles();
        this.setupEventListeners();
    }

    /**
     * Setup modal styles
     */
    setupStyles() {
        if (document.getElementById('modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--color-bg-overlay);
                backdrop-filter: blur(4px);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s var(--ease-out);
            }

            .modal-overlay.modal-open {
                opacity: 1;
                visibility: visible;
            }

            .modal {
                background-color: var(--color-bg-elevated);
                border: 1px solid var(--color-border-primary);
                border-radius: 1rem;
                box-shadow: var(--color-shadow-xl);
                max-width: 90vw;
                max-height: 90vh;
                width: 100%;
                position: relative;
                transform: scale(0.9) translateY(20px);
                transition: all 0.3s var(--ease-spring);
                overflow: hidden;
            }

            .modal-overlay.modal-open .modal {
                transform: scale(1) translateY(0);
            }

            .modal-header {
                padding: 1.5rem 1.5rem 0 1.5rem;
                border-bottom: 1px solid var(--color-border-primary);
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
            }

            .modal-title {
                font-size: var(--font-size-xl);
                font-weight: var(--font-weight-semibold);
                color: var(--color-text-primary);
                margin: 0;
                flex: 1;
            }

            .modal-close {
                width: 32px;
                height: 32px;
                background: none;
                border: none;
                color: var(--color-text-tertiary);
                cursor: pointer;
                border-radius: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .modal-close:hover {
                background-color: var(--color-bg-tertiary);
                color: var(--color-text-primary);
            }

            .modal-close:focus-visible {
                outline: 2px solid var(--color-primary);
                outline-offset: 2px;
            }

            .modal-body {
                padding: 0 1.5rem 1.5rem 1.5rem;
                overflow-y: auto;
                max-height: 60vh;
            }

            .modal-footer {
                padding: 0 1.5rem 1.5rem 1.5rem;
                display: flex;
                gap: 0.75rem;
                justify-content: flex-end;
                border-top: 1px solid var(--color-border-primary);
                margin-top: 1rem;
                padding-top: 1rem;
            }

            .modal-footer.modal-footer-center {
                justify-content: center;
            }

            .modal-footer.modal-footer-left {
                justify-content: flex-start;
            }

            .modal-footer.modal-footer-space-between {
                justify-content: space-between;
            }

            /* Modal sizes */
            .modal.modal-sm {
                max-width: 400px;
            }

            .modal.modal-md {
                max-width: 600px;
            }

            .modal.modal-lg {
                max-width: 800px;
            }

            .modal.modal-xl {
                max-width: 1000px;
            }

            .modal.modal-full {
                max-width: 95vw;
                max-height: 95vh;
            }

            /* Modal variants */
            .modal.modal-glass {
                background: var(--color-glass-bg);
                backdrop-filter: blur(20px);
                border: 1px solid var(--color-glass-border);
            }

            .modal.modal-flat {
                box-shadow: none;
                border: 1px solid var(--color-border-primary);
            }

            /* Responsive */
            @media (max-width: 768px) {
                .modal-overlay {
                    padding: 0.5rem;
                }

                .modal {
                    max-width: 100%;
                    max-height: 100%;
                    border-radius: 0.75rem;
                }

                .modal-header {
                    padding: 1rem 1rem 0 1rem;
                }

                .modal-body {
                    padding: 0 1rem 1rem 1rem;
                }

                .modal-footer {
                    padding: 0 1rem 1rem 1rem;
                    flex-direction: column;
                }

                .modal-footer .btn {
                    width: 100%;
                }
            }

            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .modal-overlay,
                .modal {
                    transition: none;
                }
            }

            /* Focus trap */
            .modal[aria-hidden="true"] {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });

        // Close on overlay click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') && this.activeModal) {
                this.close();
            }
        });
    }

    /**
     * Show modal
     * @param {Object} options - Modal options
     */
    show(options = {}) {
        const {
            title = '',
            content = '',
            size = 'md',
            variant = 'default',
            footer = null,
            footerAlign = 'right',
            closable = true,
            persistent = false,
            onClose = null,
            onConfirm = null,
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            showCancel = true,
            id = null
        } = options;

        const modalId = id || this.generateId();
        
        // Close existing modal
        if (this.activeModal) {
            this.close();
        }

        const modal = this.createModal(modalId, {
            title,
            content,
            size,
            variant,
            footer,
            footerAlign,
            closable,
            persistent,
            onClose,
            onConfirm,
            confirmText,
            cancelText,
            showCancel
        });

        document.body.appendChild(modal);
        this.modals.set(modalId, modal);
        this.activeModal = modalId;

        // Focus management
        this.setupFocusTrap(modal);
        
        // Show modal
        requestAnimationFrame(() => {
            modal.classList.add('modal-open');
        });

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return modalId;
    }

    /**
     * Create modal element
     */
    createModal(id, options) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', `modal-title-${id}`);
        overlay.dataset.modalId = id;

        const modal = document.createElement('div');
        modal.className = `modal modal-${options.size} ${options.variant !== 'default' ? `modal-${options.variant}` : ''}`;

        // Header
        if (options.title || options.closable) {
            const header = document.createElement('div');
            header.className = 'modal-header';
            
            if (options.title) {
                const title = document.createElement('h2');
                title.id = `modal-title-${id}`;
                title.className = 'modal-title';
                title.textContent = options.title;
                header.appendChild(title);
            }

            if (options.closable) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'modal-close';
                closeBtn.setAttribute('aria-label', 'Close modal');
                closeBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                `;
                closeBtn.addEventListener('click', () => this.close());
                header.appendChild(closeBtn);
            }

            modal.appendChild(header);
        }

        // Body
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        if (typeof options.content === 'string') {
            body.innerHTML = options.content;
        } else if (options.content instanceof HTMLElement) {
            body.appendChild(options.content);
        }
        
        modal.appendChild(body);

        // Footer
        if (options.footer || options.onConfirm || options.showCancel) {
            const footer = document.createElement('div');
            footer.className = `modal-footer modal-footer-${options.footerAlign}`;
            
            if (options.footer) {
                if (typeof options.footer === 'string') {
                    footer.innerHTML = options.footer;
                } else if (options.footer instanceof HTMLElement) {
                    footer.appendChild(options.footer);
                }
            } else {
                if (options.showCancel) {
                    const cancelBtn = document.createElement('button');
                    cancelBtn.className = 'btn btn-secondary';
                    cancelBtn.textContent = options.cancelText;
                    cancelBtn.addEventListener('click', () => this.close());
                    footer.appendChild(cancelBtn);
                }

                if (options.onConfirm) {
                    const confirmBtn = document.createElement('button');
                    confirmBtn.className = 'btn btn-primary';
                    confirmBtn.textContent = options.confirmText;
                    confirmBtn.addEventListener('click', () => {
                        options.onConfirm();
                        this.close();
                    });
                    footer.appendChild(confirmBtn);
                }
            }
            
            modal.appendChild(footer);
        }

        overlay.appendChild(modal);
        return overlay;
    }

    /**
     * Close modal
     */
    close() {
        if (!this.activeModal) return;

        const modal = this.modals.get(this.activeModal);
        if (!modal) return;

        modal.classList.remove('modal-open');
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            this.modals.delete(this.activeModal);
            this.activeModal = null;
            
            // Restore body scroll
            document.body.style.overflow = '';
        }, 300);
    }

    /**
     * Close all modals
     */
    closeAll() {
        this.modals.forEach((modal, id) => {
            this.activeModal = id;
            this.close();
        });
    }

    /**
     * Setup focus trap
     */
    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (firstElement) {
            firstElement.focus();
        }

        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Convenience methods
     */
    
    /**
     * Show confirmation dialog
     */
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            this.show({
                title: options.title || 'Confirm',
                content: `<p>${this.escapeHtml(message)}</p>`,
                size: options.size || 'sm',
                onConfirm: () => resolve(true),
                onClose: () => resolve(false),
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                showCancel: true,
                ...options
            });
        });
    }

    /**
     * Show alert dialog
     */
    alert(message, options = {}) {
        return new Promise((resolve) => {
            this.show({
                title: options.title || 'Alert',
                content: `<p>${this.escapeHtml(message)}</p>`,
                size: options.size || 'sm',
                onClose: () => resolve(),
                confirmText: options.confirmText || 'OK',
                showCancel: false,
                ...options
            });
        });
    }

    /**
     * Show prompt dialog
     */
    prompt(message, defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = defaultValue;
            input.className = 'form-input';
            input.style.width = '100%';
            input.style.marginTop = '1rem';

            const content = document.createElement('div');
            content.innerHTML = `<p>${this.escapeHtml(message)}</p>`;
            content.appendChild(input);

            this.show({
                title: options.title || 'Prompt',
                content: content,
                size: options.size || 'sm',
                onConfirm: () => resolve(input.value),
                onClose: () => resolve(null),
                confirmText: options.confirmText || 'OK',
                cancelText: options.cancelText || 'Cancel',
                showCancel: true,
                ...options
            });

            // Focus input
            setTimeout(() => input.focus(), 100);
        });
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
