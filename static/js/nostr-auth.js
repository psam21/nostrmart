// Nostr Authentication Module
class NostrAuth {
    constructor() {
        this.extensionAvailable = false;
        this.currentUser = null;
        this.challenges = new Map();
        
        this.init();
    }

    init() {
        this.checkExtensionAvailability();
        this.setupEventListeners();
        this.loadStoredSession();
    }

    async checkExtensionAvailability() {
        // Check immediately
        if (window.nostr) {
            this.extensionAvailable = true;
            this.onExtensionFound();
            return;
        }

        // Wait a bit for extension to load
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.nostr) {
                this.extensionAvailable = true;
                this.onExtensionFound();
                clearInterval(checkInterval);
            } else if (attempts >= 30) { // Stop after 3 seconds
                this.onExtensionNotFound();
                clearInterval(checkInterval);
            }
        }, 100);
    }

    onExtensionFound() {
        console.log('Nostr extension detected');
        this.extensionAvailable = true;
        
        // Update UI
        const event = new CustomEvent('nostr:extension-found');
        document.dispatchEvent(event);
        
        // Enable extension-dependent features
        this.enableExtensionFeatures();
    }

    onExtensionNotFound() {
        console.log('No Nostr extension found');
        this.extensionAvailable = false;
        
        // Update UI
        const event = new CustomEvent('nostr:extension-not-found');
        document.dispatchEvent(event);
        
        // Show fallback options
        this.showFallbackOptions();
    }

    enableExtensionFeatures() {
        const extensionButtons = document.querySelectorAll('[data-nostr-extension]');
        extensionButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('d-none');
        });

        const noExtensionElements = document.querySelectorAll('[data-no-extension]');
        noExtensionElements.forEach(el => {
            el.classList.add('d-none');
        });
    }

    showFallbackOptions() {
        const extensionButtons = document.querySelectorAll('[data-nostr-extension]');
        extensionButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('d-none');
        });

        const noExtensionElements = document.querySelectorAll('[data-no-extension]');
        noExtensionElements.forEach(el => {
            el.classList.remove('d-none');
        });
    }

    setupEventListeners() {
        // Listen for login attempts
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-nostr-login]')) {
                e.preventDefault();
                this.handleExtensionLogin(e.target);
            }
        });

        // Listen for manual auth forms
        document.addEventListener('submit', (e) => {
            if (e.target.matches('[data-manual-auth]')) {
                e.preventDefault();
                this.handleManualAuth(e.target);
            }
        });

        // Listen for sign event requests
        document.addEventListener('nostr:sign-event', (e) => {
            this.signEvent(e.detail.event)
                .then(signedEvent => {
                    const responseEvent = new CustomEvent('nostr:event-signed', {
                        detail: { signedEvent, originalEvent: e.detail.event }
                    });
                    document.dispatchEvent(responseEvent);
                })
                .catch(error => {
                    const errorEvent = new CustomEvent('nostr:sign-error', {
                        detail: { error, originalEvent: e.detail.event }
                    });
                    document.dispatchEvent(errorEvent);
                });
        });

        // Handle auth challenges
        document.addEventListener('nostr:auth-challenge', (e) => {
            this.handleAuthChallenge(e.detail.challenge, e.detail.relay);
        });
    }

    loadStoredSession() {
        // Check for existing session
        const storedUser = sessionStorage.getItem('nostr-user');
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                this.onUserAuthenticated(this.currentUser);
            } catch (error) {
                sessionStorage.removeItem('nostr-user');
            }
        }
    }

    async handleExtensionLogin(button) {
        if (!this.extensionAvailable) {
            this.showError('No Nostr extension found. Please install Alby, nos2x, or another NIP-07 compatible extension.');
            return;
        }

        try {
            this.showLoading('Connecting to Nostr extension...');

            // Get public key
            const pubkey = await window.nostr.getPublicKey();
            console.log('Got pubkey:', pubkey);

            // Get challenge from server
            const challenge = await this.getChallenge();
            
            // Create auth event
            const authEvent = {
                kind: 22242,
                created_at: Math.floor(Date.now() / 1000),
                tags: [
                    ['challenge', challenge],
                    ['relay', window.location.origin]
                ],
                content: '',
                pubkey: pubkey
            };

            // Sign the event
            this.showLoading('Signing authentication event...');
            const signedEvent = await window.nostr.signEvent(authEvent);
            
            // Send to server
            this.showLoading('Authenticating...');
            const response = await this.sendAuthToServer({
                auth_type: 'extension',
                event: signedEvent
            });

            if (response.success) {
                this.currentUser = response.user;
                this.onUserAuthenticated(this.currentUser);
                
                if (response.redirect) {
                    window.location.href = response.redirect;
                }
            } else {
                this.showError(response.error || 'Authentication failed');
            }

        } catch (error) {
            console.error('Extension login error:', error);
            this.showError(`Authentication failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    async handleManualAuth(form) {
        const formData = new FormData(form);
        const npub = formData.get('npub')?.trim();
        const name = formData.get('name')?.trim();

        if (!npub) {
            this.showError('Please enter your npub');
            return;
        }

        // Validate npub format
        if (!this.isValidNpub(npub)) {
            this.showError('Invalid npub format. Please check your input.');
            return;
        }

        // Check for accidental nsec entry
        if (npub.startsWith('nsec')) {
            this.showError('⚠️ SECURITY WARNING: You entered a private key (nsec)! Please use your public key (npub) instead.');
            form.querySelector('[name="npub"]').value = '';
            return;
        }

        try {
            this.showLoading('Authenticating with npub...');

            const response = await this.sendAuthToServer({
                auth_type: 'manual',
                npub: npub,
                name: name
            });

            if (response.success) {
                this.currentUser = response.user;
                this.onUserAuthenticated(this.currentUser);
                
                if (response.redirect) {
                    window.location.href = response.redirect;
                }
            } else {
                this.showError(response.error || 'Authentication failed');
            }

        } catch (error) {
            console.error('Manual auth error:', error);
            this.showError('Authentication failed. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async getChallenge() {
        try {
            const response = await fetch('/api/challenge');
            const data = await response.json();
            
            if (!data.challenge) {
                throw new Error('No challenge received from server');
            }
            
            return data.challenge;
        } catch (error) {
            console.error('Failed to get challenge:', error);
            throw new Error('Failed to get authentication challenge');
        }
    }

    async sendAuthToServer(authData) {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(authData)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        return await response.json();
    }

    async signEvent(event) {
        if (!this.extensionAvailable) {
            throw new Error('Nostr extension not available for signing');
        }

        try {
            const signedEvent = await window.nostr.signEvent(event);
            return signedEvent;
        } catch (error) {
            console.error('Event signing failed:', error);
            throw new Error(`Failed to sign event: ${error.message}`);
        }
    }

    async getPublicKey() {
        if (this.currentUser && this.currentUser.pubkey) {
            return this.currentUser.pubkey;
        }

        if (this.extensionAvailable) {
            try {
                return await window.nostr.getPublicKey();
            } catch (error) {
                console.error('Failed to get public key:', error);
                throw error;
            }
        }

        throw new Error('No public key available');
    }

    async getRelays() {
        if (this.extensionAvailable && window.nostr.getRelays) {
            try {
                return await window.nostr.getRelays();
            } catch (error) {
                console.warn('Failed to get relays:', error);
                return {};
            }
        }
        return {};
    }

    async handleAuthChallenge(challenge, relay) {
        if (!this.extensionAvailable) {
            console.warn('Cannot handle auth challenge without extension');
            return;
        }

        try {
            const authEvent = {
                kind: 22242,
                created_at: Math.floor(Date.now() / 1000),
                tags: [
                    ['relay', relay],
                    ['challenge', challenge]
                ],
                content: ''
            };

            const signedEvent = await this.signEvent(authEvent);
            
            // Emit signed auth event
            const event = new CustomEvent('nostr:auth-signed', {
                detail: { signedEvent, challenge, relay }
            });
            document.dispatchEvent(event);
            
            return signedEvent;
        } catch (error) {
            console.error('Auth challenge failed:', error);
            throw error;
        }
    }

    onUserAuthenticated(user) {
        // Store session
        sessionStorage.setItem('nostr-user', JSON.stringify(user));
        
        // Update UI
        this.updateAuthenticatedUI(user);
        
        // Emit event
        const event = new CustomEvent('nostr:user-authenticated', {
            detail: { user }
        });
        document.dispatchEvent(event);
    }

    updateAuthenticatedUI(user) {
        // Update user display elements
        const userElements = document.querySelectorAll('[data-user-field]');
        userElements.forEach(el => {
            const field = el.getAttribute('data-user-field');
            if (user[field]) {
                if (el.tagName === 'IMG') {
                    el.src = user[field];
                } else {
                    el.textContent = user[field];
                }
            }
        });

        // Show authenticated elements
        const authElements = document.querySelectorAll('[data-show-authenticated]');
        authElements.forEach(el => {
            el.classList.remove('d-none');
        });

        // Hide unauthenticated elements
        const unauthElements = document.querySelectorAll('[data-hide-authenticated]');
        unauthElements.forEach(el => {
            el.classList.add('d-none');
        });
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('nostr-user');
        
        // Emit event
        const event = new CustomEvent('nostr:user-logged-out');
        document.dispatchEvent(event);
        
        // Redirect to home or login
        window.location.href = '/';
    }

    // Validation methods
    isValidNpub(npub) {
        return /^npub[0-9a-z]{59}$/.test(npub);
    }

    isValidHexPubkey(hex) {
        return /^[0-9a-f]{64}$/.test(hex);
    }

    isValidNsec(nsec) {
        return /^nsec[0-9a-z]{59}$/.test(nsec);
    }

    // UI helpers
    showLoading(message = 'Loading...') {
        // Find or create loading modal
        let modal = document.getElementById('loading-modal');
        if (!modal) {
            modal = this.createLoadingModal();
            document.body.appendChild(modal);
        }

        const messageEl = modal.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    hideLoading() {
        const modal = document.getElementById('loading-modal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }

    createLoadingModal() {
        const modal = document.createElement('div');
        modal.id = 'loading-modal';
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.innerHTML = `
            <div class="modal-dialog modal-sm modal-dialog-centered">
                <div class="modal-content text-center p-4">
                    <div class="spinner-border text-orange mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mb-0 loading-message">Loading...</p>
                </div>
            </div>
        `;
        return modal;
    }

    showError(message) {
        // Create error alert
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 1060; max-width: 400px;';
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Create success alert
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 1060; max-width: 400px;';
        alert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 3000);
    }

    // Utility methods
    npubToHex(npub) {
        if (!this.isValidNpub(npub)) {
            return null;
        }

        try {
            // This is a simplified conversion for the demo
            // In production, use proper bech32 decoding library
            return npub.slice(4); // Remove 'npub' prefix
        } catch (error) {
            console.error('npub conversion error:', error);
            return null;
        }
    }

    hexToNpub(hex) {
        if (!this.isValidHexPubkey(hex)) {
            return null;
        }

        try {
            // This is a simplified conversion for the demo
            // In production, use proper bech32 encoding library
            return 'npub' + hex;
        } catch (error) {
            console.error('hex conversion error:', error);
            return null;
        }
    }

    // Static methods for global access
    static getInstance() {
        if (!window._nostrAuth) {
            window._nostrAuth = new NostrAuth();
        }
        return window._nostrAuth;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.nostrAuth = NostrAuth.getInstance();
});

// Global access
window.NostrAuth = NostrAuth;

// Event handlers for common UI patterns
document.addEventListener('DOMContentLoaded', () => {
    // Handle npub input validation
    const npubInputs = document.querySelectorAll('input[data-npub]');
    npubInputs.forEach(input => {
        input.addEventListener('input', function() {
            const value = this.value.trim();
            const nostrAuth = NostrAuth.getInstance();
            
            if (value.startsWith('nsec')) {
                this.classList.add('is-invalid');
                this.setCustomValidity('Private keys (nsec) should not be used for login');
                
                let feedback = this.parentNode.querySelector('.invalid-feedback');
                if (!feedback) {
                    feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    this.parentNode.appendChild(feedback);
                }
                feedback.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>This is a private key! Use your npub instead.';
            } else if (value && !nostrAuth.isValidNpub(value)) {
                this.classList.add('is-invalid');
                this.setCustomValidity('Invalid npub format');
            } else {
                this.classList.remove('is-invalid');
                this.setCustomValidity('');
                const feedback = this.parentNode.querySelector('.invalid-feedback');
                if (feedback) {
                    feedback.remove();
                }
            }
        });
    });

    // Handle copy npub functionality
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-copy-npub]')) {
            const npub = e.target.getAttribute('data-copy-npub');
            navigator.clipboard.writeText(npub).then(() => {
                const nostrAuth = NostrAuth.getInstance();
                nostrAuth.showSuccess('npub copied to clipboard!');
            }).catch(() => {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = npub;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                
                const nostrAuth = NostrAuth.getInstance();
                nostrAuth.showSuccess('npub copied to clipboard!');
            });
        }
    });

    // Handle logout
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-nostr-logout]')) {
            e.preventDefault();
            const nostrAuth = NostrAuth.getInstance();
            nostrAuth.logout();
        }
    });
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NostrAuth;
}
