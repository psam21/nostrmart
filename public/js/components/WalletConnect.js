/**
 * Nostr Wallet Connect Component
 * Handles NIP-07 wallet integration and connection management
 */

class WalletConnect {
    constructor() {
        this.isConnected = false;
        this.pubkey = null;
        this.nostr = null;
        this.eventListeners = new Map();
        
        this.init();
    }

    /**
     * Initialize wallet connection
     */
    async init() {
        try {
            // Check if Nostr is available
            if (window.nostr) {
                this.nostr = window.nostr;
                await this.checkConnection();
            } else {
                console.log('Nostr extension not detected');
            }
        } catch (error) {
            console.error('Failed to initialize wallet connection:', error);
        }
    }

    /**
     * Check if wallet is already connected
     */
    async checkConnection() {
        try {
            if (this.nostr && this.nostr.getPublicKey) {
                this.pubkey = await this.nostr.getPublicKey();
                this.isConnected = true;
                this.emit('connected', { pubkey: this.pubkey });
                return true;
            }
        } catch (error) {
            console.log('No existing wallet connection');
            this.isConnected = false;
            this.pubkey = null;
        }
        return false;
    }

    /**
     * Connect to Nostr wallet
     */
    async connect() {
        try {
            if (!this.nostr) {
                throw new Error('Nostr extension not found. Please install a Nostr wallet extension.');
            }

            // Request permission to access public key
            this.pubkey = await this.nostr.getPublicKey();
            
            if (!this.pubkey) {
                throw new Error('Failed to get public key from wallet');
            }

            this.isConnected = true;
            this.emit('connected', { pubkey: this.pubkey });
            
            return {
                success: true,
                pubkey: this.pubkey
            };

        } catch (error) {
            console.error('Failed to connect wallet:', error);
            this.isConnected = false;
            this.pubkey = null;
            
            this.emit('error', { error: error.message });
            
            throw error;
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        try {
            this.isConnected = false;
            this.pubkey = null;
            this.emit('disconnected');
            
            return { success: true };
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
            throw error;
        }
    }

    /**
     * Sign a Nostr event
     */
    async signEvent(event) {
        try {
            if (!this.isConnected || !this.nostr) {
                throw new Error('Wallet not connected');
            }

            if (!this.nostr.signEvent) {
                throw new Error('Wallet does not support event signing');
            }

            const signedEvent = await this.nostr.signEvent(event);
            
            this.emit('eventSigned', { event: signedEvent });
            
            return signedEvent;

        } catch (error) {
            console.error('Failed to sign event:', error);
            this.emit('error', { error: error.message });
            throw error;
        }
    }

    /**
     * Create and sign a Nostr event
     */
    async createEvent(kind, content, tags = []) {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            const event = {
                kind,
                content,
                tags,
                created_at: Math.floor(Date.now() / 1000),
                pubkey: this.pubkey
            };

            const signedEvent = await this.signEvent(event);
            
            return signedEvent;

        } catch (error) {
            console.error('Failed to create event:', error);
            throw error;
        }
    }

    /**
     * Get user's public key
     */
    getPublicKey() {
        return this.pubkey;
    }

    /**
     * Check if wallet is connected
     */
    isWalletConnected() {
        return this.isConnected && this.pubkey !== null;
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            pubkey: this.pubkey,
            hasNostr: !!this.nostr
        };
    }

    /**
     * Format public key for display
     */
    formatPubkey(pubkey = this.pubkey) {
        if (!pubkey) return 'Not connected';
        return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
    }

    /**
     * Get user initials from public key
     */
    getInitials(pubkey = this.pubkey) {
        if (!pubkey) return '?';
        return pubkey.slice(0, 2).toUpperCase();
    }

    /**
     * Request permission for specific capabilities
     */
    async requestPermissions(permissions = ['read', 'write']) {
        try {
            if (!this.nostr) {
                throw new Error('Nostr extension not found');
            }

            // Some wallets support permission requests
            if (this.nostr.requestPermissions) {
                const result = await this.nostr.requestPermissions(permissions);
                this.emit('permissionsGranted', { permissions: result });
                return result;
            }

            // Fallback: just try to get public key
            return await this.connect();

        } catch (error) {
            console.error('Failed to request permissions:', error);
            throw error;
        }
    }

    /**
     * Encrypt message for another user
     */
    async encryptMessage(message, recipientPubkey) {
        try {
            if (!this.isConnected || !this.nostr) {
                throw new Error('Wallet not connected');
            }

            if (!this.nostr.nip04) {
                throw new Error('Wallet does not support NIP-04 encryption');
            }

            const encryptedMessage = await this.nostr.nip04.encrypt(recipientPubkey, message);
            
            return encryptedMessage;

        } catch (error) {
            console.error('Failed to encrypt message:', error);
            throw error;
        }
    }

    /**
     * Decrypt message from another user
     */
    async decryptMessage(encryptedMessage, senderPubkey) {
        try {
            if (!this.isConnected || !this.nostr) {
                throw new Error('Wallet not connected');
            }

            if (!this.nostr.nip04) {
                throw new Error('Wallet does not support NIP-04 encryption');
            }

            const decryptedMessage = await this.nostr.nip04.decrypt(senderPubkey, encryptedMessage);
            
            return decryptedMessage;

        } catch (error) {
            console.error('Failed to decrypt message:', error);
            throw error;
        }
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in wallet event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Utility methods
     */
    
    /**
     * Validate Nostr public key format
     */
    isValidPubkey(pubkey) {
        return /^[0-9a-f]{64}$/i.test(pubkey);
    }

    /**
     * Get wallet info
     */
    getWalletInfo() {
        return {
            name: this.nostr?.name || 'Unknown Wallet',
            version: this.nostr?.version || 'Unknown',
            supportedNips: this.nostr?.supportedNips || [],
            hasNip07: !!this.nostr,
            hasNip04: !!(this.nostr?.nip04),
            hasSignEvent: !!(this.nostr?.signEvent),
            hasGetPublicKey: !!(this.nostr?.getPublicKey)
        };
    }

    /**
     * Check if wallet supports specific NIP
     */
    supportsNip(nip) {
        if (!this.nostr?.supportedNips) return false;
        return this.nostr.supportedNips.includes(nip);
    }

    /**
     * Get connection error message
     */
    getConnectionErrorMessage(error) {
        const errorMessages = {
            'User rejected': 'Connection was cancelled by user',
            'Nostr extension not found': 'Please install a Nostr wallet extension',
            'Failed to get public key': 'Unable to access wallet public key',
            'Permission denied': 'Wallet access was denied'
        };

        for (const [key, message] of Object.entries(errorMessages)) {
            if (error.message.includes(key)) {
                return message;
            }
        }

        return 'Failed to connect wallet. Please try again.';
    }

    /**
     * Setup wallet detection
     */
    setupWalletDetection() {
        // Listen for wallet installation
        window.addEventListener('nostr', (event) => {
            console.log('Nostr wallet detected:', event.detail);
            this.nostr = window.nostr;
            this.emit('walletDetected', { nostr: this.nostr });
        });

        // Check periodically for wallet installation
        const checkInterval = setInterval(() => {
            if (window.nostr && !this.nostr) {
                this.nostr = window.nostr;
                this.emit('walletDetected', { nostr: this.nostr });
                clearInterval(checkInterval);
            }
        }, 1000);

        // Clear interval after 30 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 30000);
    }
}

// Initialize wallet detection
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // Setup wallet detection
        const walletConnect = new WalletConnect();
        walletConnect.setupWalletDetection();
    });
}
