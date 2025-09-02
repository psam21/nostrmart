// Nostr Marketplace - Main JavaScript
class NostrMarketplace {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeComponents();
        this.checkNostrExtension();
    }

    setupEventListeners() {
        // Global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });

        // Handle clicks on external links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="http"]');
            if (link && !link.href.includes(window.location.hostname)) {
                e.preventDefault();
                this.confirmExternalLink(link.href);
            }
        });

        // Handle image loading errors
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            }
        }, true);

        // Handle form validation
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.hasAttribute('data-validate')) {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            }
        });

        // Handle copy to clipboard
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-copy')) {
                this.copyToClipboard(e.target.getAttribute('data-copy'));
            }
        });

        // Handle price calculations
        const priceInputs = document.querySelectorAll('input[data-price]');
        priceInputs.forEach(input => {
            input.addEventListener('input', () => this.updatePriceDisplay(input));
        });

        // Handle search form auto-submit
        const searchFilters = document.querySelectorAll('.auto-submit');
        searchFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                filter.closest('form')?.submit();
            });
        });
    }

    initializeComponents() {
        // Initialize tooltips
        this.initTooltips();
        
        // Initialize lazy loading
        this.initLazyLoading();
        
        // Initialize modal handlers
        this.initModalHandlers();
        
        // Initialize listing interactions
        this.initListingInteractions();
        
        // Start periodic tasks
        this.startPeriodicTasks();
    }

    checkNostrExtension() {
        // Check for Nostr extension availability
        const checkInterval = setInterval(() => {
            if (window.nostr) {
                this.onNostrExtensionFound();
                clearInterval(checkInterval);
            }
        }, 100);

        // Stop checking after 3 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.nostr) {
                this.onNostrExtensionNotFound();
            }
        }, 3000);
    }

    onNostrExtensionFound() {
        console.log('Nostr extension detected');
        
        // Update UI elements
        const extensionElements = document.querySelectorAll('[data-nostr-extension]');
        extensionElements.forEach(el => {
            el.classList.remove('d-none');
            el.removeAttribute('disabled');
        });

        const noExtensionElements = document.querySelectorAll('[data-no-nostr-extension]');
        noExtensionElements.forEach(el => {
            el.classList.add('d-none');
        });
    }

    onNostrExtensionNotFound() {
        console.log('No Nostr extension found');
        
        // Update UI elements
        const extensionElements = document.querySelectorAll('[data-nostr-extension]');
        extensionElements.forEach(el => {
            el.classList.add('d-none');
            el.setAttribute('disabled', 'true');
        });

        const noExtensionElements = document.querySelectorAll('[data-no-nostr-extension]');
        noExtensionElements.forEach(el => {
            el.classList.remove('d-none');
        });
    }

    initTooltips() {
        // Initialize Bootstrap tooltips if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            tooltipElements.forEach(el => {
                new bootstrap.Tooltip(el);
            });
        }
    }

    initLazyLoading() {
        // Intersection Observer for lazy loading images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    initModalHandlers() {
        // Handle modal events
        document.addEventListener('show.bs.modal', (e) => {
            const modal = e.target;
            const trigger = e.relatedTarget;
            
            // Handle dynamic modal content
            if (trigger && trigger.hasAttribute('data-modal-data')) {
                const data = JSON.parse(trigger.getAttribute('data-modal-data'));
                this.populateModal(modal, data);
            }
        });
    }

    initListingInteractions() {
        // Handle listing card interactions
        const listingCards = document.querySelectorAll('.listing-card');
        listingCards.forEach(card => {
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-3px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });

            // Handle click to navigate (except for buttons)
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn, button, a')) {
                    const link = card.querySelector('a[href*="/listing/"]');
                    if (link) {
                        window.location.href = link.href;
                    }
                }
            });
        });

        // Handle favorite/bookmark functionality
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-favorite')) {
                this.toggleFavorite(e.target);
            }
        });
    }

    startPeriodicTasks() {
        // Update relative timestamps every minute
        setInterval(() => {
            this.updateRelativeTimestamps();
        }, 60000);

        // Ping server every 5 minutes to maintain session
        setInterval(() => {
            this.pingServer();
        }, 300000);
    }

    updateRelativeTimestamps() {
        const timestamps = document.querySelectorAll('[data-timestamp]');
        timestamps.forEach(el => {
            const timestamp = parseInt(el.getAttribute('data-timestamp'));
            el.textContent = this.getRelativeTime(timestamp);
        });
    }

    getRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return new Date(timestamp).toLocaleDateString();
    }

    async pingServer() {
        try {
            await fetch('/api/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.log('Ping failed:', error);
        }
    }

    confirmExternalLink(url) {
        if (confirm(`You are about to visit an external website:\n${url}\n\nDo you want to continue?`)) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }

    handleImageError(img) {
        // Replace broken images with placeholder
        if (!img.hasAttribute('data-error-handled')) {
            img.setAttribute('data-error-handled', 'true');
            img.src = this.createPlaceholderImage(200, 200, 'Image not found');
            img.alt = 'Image could not be loaded';
        }
    }

    createPlaceholderImage(width, height, text = '') {
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f8f9fa"/>
                <text x="50%" y="50%" font-family="Inter, sans-serif" font-size="14" 
                      fill="#6c757d" text-anchor="middle" dy=".3em">${text}</text>
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showFieldError(input, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(input);
            }

            // Custom validation based on type
            if (input.type === 'email' && input.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    this.showFieldError(input, 'Please enter a valid email address');
                    isValid = false;
                }
            }

            if (input.hasAttribute('data-npub') && input.value) {
                if (!this.isValidNpub(input.value)) {
                    this.showFieldError(input, 'Please enter a valid npub');
                    isValid = false;
                }
            }

            if (input.type === 'number' && input.value) {
                const min = parseFloat(input.min);
                const max = parseFloat(input.max);
                const value = parseFloat(input.value);
                
                if (!isNaN(min) && value < min) {
                    this.showFieldError(input, `Value must be at least ${min}`);
                    isValid = false;
                }
                
                if (!isNaN(max) && value > max) {
                    this.showFieldError(input, `Value must not exceed ${max}`);
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    showFieldError(input, message) {
        input.classList.add('is-invalid');
        
        let feedback = input.parentNode.querySelector('.invalid-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            input.parentNode.appendChild(feedback);
        }
        
        feedback.textContent = message;
    }

    clearFieldError(input) {
        input.classList.remove('is-invalid');
        const feedback = input.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    }

    isValidNpub(npub) {
        return /^npub[0-9a-z]{59}$/.test(npub);
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('Copied to clipboard!', 'success');
        }
    }

    updatePriceDisplay(input) {
        const btcValue = parseFloat(input.value) || 0;
        const satoshis = Math.round(btcValue * 100000000);
        
        const display = input.parentNode.parentNode.querySelector('[data-price-display]');
        if (display) {
            if (satoshis >= 100000000) {
                const btc = satoshis / 100000000;
                display.textContent = `₿${btc.toFixed(8).replace(/\.?0+$/, '')}`;
            } else {
                display.textContent = `${satoshis.toLocaleString()} sats`;
            }
        }
    }

    toggleFavorite(button) {
        const listingId = button.getAttribute('data-listing-id');
        const isFavorited = button.classList.contains('favorited');
        
        // Update UI immediately
        if (isFavorited) {
            button.classList.remove('favorited');
            button.innerHTML = '<i class="far fa-heart"></i>';
        } else {
            button.classList.add('favorited');
            button.innerHTML = '<i class="fas fa-heart text-danger"></i>';
        }

        // Send to server
        this.updateFavoriteStatus(listingId, !isFavorited);
    }

    async updateFavoriteStatus(listingId, isFavorited) {
        try {
            await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    listing_id: listingId,
                    favorited: isFavorited
                })
            });
        } catch (error) {
            console.error('Failed to update favorite status:', error);
        }
    }

    populateModal(modal, data) {
        // Generic function to populate modal with data
        Object.keys(data).forEach(key => {
            const element = modal.querySelector(`[data-field="${key}"]`);
            if (element) {
                if (element.tagName === 'IMG') {
                    element.src = data[key];
                } else if (element.tagName === 'INPUT') {
                    element.value = data[key];
                } else {
                    element.textContent = data[key];
                }
            }
        });
    }

    showToast(message, type = 'info', duration = 3000) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} toast-notification`;
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getToastIcon(type)} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;

        // Add to toast container
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '1055';
            document.body.appendChild(container);
        }

        container.appendChild(toast);

        // Auto-dismiss
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);

        // Trigger entrance animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    formatSatoshis(satoshis) {
        if (satoshis >= 100000000) {
            const btc = satoshis / 100000000;
            return `₿${btc.toFixed(8).replace(/\.?0+$/, '')}`;
        } else if (satoshis >= 100000) {
            const btc = satoshis / 100000000;
            return `₿${btc.toFixed(6)}`;
        } else {
            return `${satoshis.toLocaleString()} sats`;
        }
    }

    async makeRequest(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }

    // Initialize on DOM ready
    static init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                new NostrMarketplace();
            });
        } else {
            new NostrMarketplace();
        }
    }
}

// Auto-initialize
NostrMarketplace.init();

// Global utilities
window.NostrMarketplace = NostrMarketplace;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NostrMarketplace;
}
