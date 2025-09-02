/**
 * Nostr Service
 * Handles Nostr protocol interactions and event management
 */

class NostrService {
    constructor() {
        this.relays = [];
        this.connectedRelays = new Map();
        this.eventCache = new Map();
        this.subscriptions = new Map();
        
        this.init();
    }

    /**
     * Initialize Nostr service
     */
    init() {
        // Load default relays
        this.loadDefaultRelays();
        
        // Setup event handlers
        this.setupEventHandlers();
    }

    /**
     * Load default relays
     */
    loadDefaultRelays() {
        // Default relays - in production, these should be configurable
        this.relays = [
            'wss://relay.damus.io',
            'wss://relay.snort.social',
            'wss://nos.lol'
        ];
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Handle relay connection events
        this.onRelayConnect = (relay) => {
            console.log(`Connected to relay: ${relay}`);
            this.connectedRelays.set(relay, true);
        };

        this.onRelayDisconnect = (relay) => {
            console.log(`Disconnected from relay: ${relay}`);
            this.connectedRelays.set(relay, false);
        };

        this.onRelayError = (relay, error) => {
            console.error(`Relay error (${relay}):`, error);
            this.connectedRelays.set(relay, false);
        };
    }

    /**
     * Connect to relays
     */
    async connectToRelays() {
        const connectionPromises = this.relays.map(relay => this.connectToRelay(relay));
        
        try {
            await Promise.allSettled(connectionPromises);
            console.log('Relay connection attempts completed');
        } catch (error) {
            console.error('Failed to connect to relays:', error);
        }
    }

    /**
     * Connect to a single relay
     */
    async connectToRelay(relayUrl) {
        try {
            // In a real implementation, this would use WebSocket connections
            // For now, we'll simulate the connection
            console.log(`Connecting to relay: ${relayUrl}`);
            
            // Simulate connection delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.onRelayConnect(relayUrl);
            return true;
            
        } catch (error) {
            this.onRelayError(relayUrl, error);
            return false;
        }
    }

    /**
     * Create a Nostr event
     */
    createEvent(kind, content, tags = [], pubkey = null) {
        const event = {
            kind: kind,
            content: content,
            tags: tags,
            created_at: Math.floor(Date.now() / 1000),
            pubkey: pubkey || this.getCurrentPubkey()
        };

        // Generate event ID (simplified - in real implementation, use proper hashing)
        event.id = this.generateEventId(event);
        
        return event;
    }

    /**
     * Generate event ID (simplified implementation)
     */
    generateEventId(event) {
        // In a real implementation, this would be:
        // sha256(JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]))
        const content = JSON.stringify({
            pubkey: event.pubkey,
            created_at: event.created_at,
            kind: event.kind,
            tags: event.tags,
            content: event.content
        });
        
        // Simple hash simulation
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(16).padStart(64, '0');
    }

    /**
     * Sign event with wallet
     */
    async signEvent(event) {
        try {
            if (window.app && window.app.wallet) {
                return await window.app.wallet.signEvent(event);
            }
            
            throw new Error('Wallet not available');
        } catch (error) {
            console.error('Failed to sign event:', error);
            throw error;
        }
    }

    /**
     * Publish event to relays
     */
    async publishEvent(event) {
        try {
            // Sign the event first
            const signedEvent = await this.signEvent(event);
            
            // Publish to connected relays
            const publishPromises = Array.from(this.connectedRelays.keys())
                .filter(relay => this.connectedRelays.get(relay))
                .map(relay => this.publishToRelay(relay, signedEvent));
            
            const results = await Promise.allSettled(publishPromises);
            
            const successful = results.filter(result => result.status === 'fulfilled').length;
            const total = results.length;
            
            console.log(`Published event to ${successful}/${total} relays`);
            
            return {
                success: successful > 0,
                publishedTo: successful,
                totalRelays: total,
                event: signedEvent
            };
            
        } catch (error) {
            console.error('Failed to publish event:', error);
            throw error;
        }
    }

    /**
     * Publish event to a specific relay
     */
    async publishToRelay(relayUrl, event) {
        try {
            // In a real implementation, this would send the event via WebSocket
            console.log(`Publishing event to ${relayUrl}:`, event.id);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return { relay: relayUrl, success: true };
            
        } catch (error) {
            console.error(`Failed to publish to ${relayUrl}:`, error);
            throw error;
        }
    }

    /**
     * Subscribe to events
     */
    async subscribeToEvents(filter, callback) {
        try {
            const subscriptionId = this.generateSubscriptionId();
            
            // Store subscription
            this.subscriptions.set(subscriptionId, {
                filter: filter,
                callback: callback,
                active: true
            });
            
            // Subscribe to relays
            const subscribePromises = Array.from(this.connectedRelays.keys())
                .filter(relay => this.connectedRelays.get(relay))
                .map(relay => this.subscribeToRelay(relay, subscriptionId, filter));
            
            await Promise.allSettled(subscribePromises);
            
            return subscriptionId;
            
        } catch (error) {
            console.error('Failed to subscribe to events:', error);
            throw error;
        }
    }

    /**
     * Subscribe to events on a specific relay
     */
    async subscribeToRelay(relayUrl, subscriptionId, filter) {
        try {
            console.log(`Subscribing to ${relayUrl} with filter:`, filter);
            
            // In a real implementation, this would send a subscription request via WebSocket
            // For now, we'll simulate it
            
            return { relay: relayUrl, subscriptionId: subscriptionId };
            
        } catch (error) {
            console.error(`Failed to subscribe to ${relayUrl}:`, error);
            throw error;
        }
    }

    /**
     * Unsubscribe from events
     */
    async unsubscribeFromEvents(subscriptionId) {
        try {
            const subscription = this.subscriptions.get(subscriptionId);
            if (!subscription) {
                throw new Error('Subscription not found');
            }
            
            subscription.active = false;
            
            // Unsubscribe from relays
            const unsubscribePromises = Array.from(this.connectedRelays.keys())
                .filter(relay => this.connectedRelays.get(relay))
                .map(relay => this.unsubscribeFromRelay(relay, subscriptionId));
            
            await Promise.allSettled(unsubscribePromises);
            
            this.subscriptions.delete(subscriptionId);
            
            return true;
            
        } catch (error) {
            console.error('Failed to unsubscribe from events:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe from events on a specific relay
     */
    async unsubscribeFromRelay(relayUrl, subscriptionId) {
        try {
            console.log(`Unsubscribing from ${relayUrl} (${subscriptionId})`);
            
            // In a real implementation, this would send an unsubscribe request via WebSocket
            
            return { relay: relayUrl, subscriptionId: subscriptionId };
            
        } catch (error) {
            console.error(`Failed to unsubscribe from ${relayUrl}:`, error);
            throw error;
        }
    }

    /**
     * Query events from relays
     */
    async queryEvents(filter, limit = 100) {
        try {
            const events = [];
            
            // Query from connected relays
            const queryPromises = Array.from(this.connectedRelays.keys())
                .filter(relay => this.connectedRelays.get(relay))
                .map(relay => this.queryRelay(relay, filter, limit));
            
            const results = await Promise.allSettled(queryPromises);
            
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    events.push(...result.value);
                }
            });
            
            // Remove duplicates and sort by created_at
            const uniqueEvents = this.deduplicateEvents(events);
            uniqueEvents.sort((a, b) => b.created_at - a.created_at);
            
            return uniqueEvents.slice(0, limit);
            
        } catch (error) {
            console.error('Failed to query events:', error);
            throw error;
        }
    }

    /**
     * Query events from a specific relay
     */
    async queryRelay(relayUrl, filter, limit) {
        try {
            console.log(`Querying ${relayUrl} with filter:`, filter);
            
            // In a real implementation, this would query the relay via WebSocket
            // For now, we'll return mock data
            const mockEvents = this.generateMockEvents(filter, Math.min(limit, 10));
            
            return mockEvents;
            
        } catch (error) {
            console.error(`Failed to query ${relayUrl}:`, error);
            return [];
        }
    }

    /**
     * Generate mock events for testing
     */
    generateMockEvents(filter, count) {
        const events = [];
        
        for (let i = 0; i < count; i++) {
            const event = {
                id: this.generateEventId({ content: `mock-${i}`, created_at: Date.now() }),
                pubkey: 'mock-pubkey-' + i.toString().padStart(64, '0'),
                kind: filter.kinds ? filter.kinds[0] : 1,
                created_at: Math.floor(Date.now() / 1000) - i * 3600,
                tags: [
                    ['category', 'digital-art'],
                    ['price', '0.001'],
                    ['currency', 'BTC']
                ],
                content: `Mock listing ${i + 1}: Digital artwork with unique properties`,
                sig: 'mock-signature-' + i.toString().padStart(128, '0')
            };
            
            events.push(event);
        }
        
        return events;
    }

    /**
     * Remove duplicate events
     */
    deduplicateEvents(events) {
        const seen = new Set();
        return events.filter(event => {
            if (seen.has(event.id)) {
                return false;
            }
            seen.add(event.id);
            return true;
        });
    }

    /**
     * Get current user's public key
     */
    getCurrentPubkey() {
        if (window.app && window.app.wallet) {
            return window.app.wallet.getPublicKey();
        }
        return null;
    }

    /**
     * Generate subscription ID
     */
    generateSubscriptionId() {
        return 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Validate event
     */
    validateEvent(event) {
        const required = ['id', 'pubkey', 'kind', 'created_at', 'content', 'sig'];
        
        for (const field of required) {
            if (!event[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Validate field types and formats
        if (typeof event.kind !== 'number') {
            throw new Error('Kind must be a number');
        }
        
        if (typeof event.created_at !== 'number') {
            throw new Error('Created_at must be a number');
        }
        
        if (typeof event.content !== 'string') {
            throw new Error('Content must be a string');
        }
        
        if (!Array.isArray(event.tags)) {
            throw new Error('Tags must be an array');
        }
        
        return true;
    }

    /**
     * Format event for display
     */
    formatEvent(event) {
        return {
            id: event.id,
            pubkey: event.pubkey,
            kind: event.kind,
            content: event.content,
            tags: event.tags,
            created_at: event.created_at,
            formatted_date: new Date(event.created_at * 1000).toLocaleString(),
            author: this.formatPubkey(event.pubkey)
        };
    }

    /**
     * Format public key for display
     */
    formatPubkey(pubkey) {
        if (!pubkey) return 'Unknown';
        return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        const connected = Array.from(this.connectedRelays.values()).filter(Boolean).length;
        const total = this.connectedRelays.size;
        
        return {
            connected: connected,
            total: total,
            relays: Array.from(this.connectedRelays.entries()).map(([relay, status]) => ({
                url: relay,
                connected: status
            }))
        };
    }

    /**
     * Cleanup
     */
    async cleanup() {
        // Unsubscribe from all subscriptions
        const unsubscribePromises = Array.from(this.subscriptions.keys())
            .map(id => this.unsubscribeFromEvents(id));
        
        await Promise.allSettled(unsubscribePromises);
        
        // Clear caches
        this.eventCache.clear();
        this.subscriptions.clear();
        this.connectedRelays.clear();
    }
}

// Create global Nostr service instance
window.nostrService = new NostrService();
