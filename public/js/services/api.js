/**
 * API Service
 * Handles all API communications with the NostrMart backend
 */

class ApiService {
    constructor() {
        this.baseURL = window.location.origin;
        this.timeout = 10000; // 10 seconds
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
        
        this.init();
    }

    /**
     * Initialize API service
     */
    init() {
        // Set up request interceptors
        this.setupInterceptors();
    }

    /**
     * Setup request/response interceptors
     */
    setupInterceptors() {
        // Add request timestamp
        this.addRequestTimestamp = (config) => {
            config.metadata = { startTime: Date.now() };
            return config;
        };

        // Add response time logging
        this.logResponseTime = (response) => {
            if (response.config && response.config.metadata) {
                const duration = Date.now() - response.config.metadata.startTime;
                console.log(`API request completed in ${duration}ms`);
            }
            return response;
        };
    }

    /**
     * Make HTTP request with retry logic
     */
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            headers = {},
            body = null,
            timeout = this.timeout,
            retries = this.retryAttempts
        } = options;

        const url = `${this.baseURL}${endpoint}`;
        
        const requestOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            signal: AbortSignal.timeout(timeout)
        };

        if (body && method !== 'GET') {
            requestOptions.body = JSON.stringify(body);
        }

        // Add request timestamp
        requestOptions.metadata = { startTime: Date.now() };

        let lastError;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log(`API Request: ${method} ${url} (attempt ${attempt + 1})`);
                
                const response = await fetch(url, requestOptions);
                
                // Log response time
                const duration = Date.now() - requestOptions.metadata.startTime;
                console.log(`API Response: ${response.status} in ${duration}ms`);

                // Handle authentication protection
                if (response.status === 401) {
                    const responseText = await response.text();
                    if (responseText.includes('Authentication Required')) {
                        throw new Error('API requires authentication. Please check deployment settings.');
                    }
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data;

            } catch (error) {
                lastError = error;
                console.error(`API Request failed (attempt ${attempt + 1}):`, error);

                // Don't retry on certain errors
                if (error.name === 'AbortError' || 
                    (error.message && error.message.includes('404')) ||
                    (error.message && error.message.includes('authentication'))) {
                    break;
                }

                // Wait before retry
                if (attempt < retries) {
                    await this.delay(this.retryDelay * Math.pow(2, attempt));
                }
            }
        }

        throw lastError;
    }

    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * User Profile Methods
     */
    async getUserProfile(pubkey) {
        return await this.request(`/api/user/${pubkey}/profile`);
    }

    async getUserStats(pubkey) {
        return await this.request(`/api/user/${pubkey}/stats`);
    }

    async getUserListings(pubkey) {
        return await this.request(`/api/user/${pubkey}/listings`);
    }

    async getUserPurchases(pubkey) {
        return await this.request(`/api/user/${pubkey}/purchases`);
    }

    async getUserReviews(pubkey) {
        return await this.request(`/api/user/${pubkey}/reviews`);
    }

    async getUserActivity(pubkey) {
        return await this.request(`/api/user/${pubkey}/activity`);
    }

    /**
     * Enhanced Listing Methods
     */
    async searchListings(query, options = {}) {
        const params = new URLSearchParams({
            q: query,
            ...options
        });
        return await this.request(`/api/search?${params}`);
    }

    async getListingById(listingId) {
        return await this.request(`/api/listing/${listingId}`);
    }

    async createListing(listingData) {
        return await this.request('/api/listing', {
            method: 'POST',
            body: listingData
        });
    }

    async updateListing(listingId, listingData) {
        return await this.request(`/api/listing/${listingId}`, {
            method: 'PUT',
            body: listingData
        });
    }

    async deleteListing(listingId) {
        return await this.request(`/api/listing/${listingId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Messaging Methods
     */
    async sendMessage(recipientPubkey, message) {
        return await this.request('/api/message', {
            method: 'POST',
            body: {
                recipient: recipientPubkey,
                content: message
            }
        });
    }

    async getMessages(conversationId) {
        return await this.request(`/api/messages/${conversationId}`);
    }

    async getConversations() {
        return await this.request('/api/conversations');
    }

    /**
     * Rating and Review Methods
     */
    async createReview(listingId, rating, review) {
        return await this.request('/api/review', {
            method: 'POST',
            body: {
                listing_id: listingId,
                rating: rating,
                content: review
            }
        });
    }

    async getListingReviews(listingId) {
        return await this.request(`/api/listing/${listingId}/reviews`);
    }

    /**
     * Listings API Methods
     */
    async searchListings(params = {}) {
        const queryParams = new URLSearchParams();
        
        if (params.query) queryParams.append('q', params.query);
        if (params.category) queryParams.append('category', params.category);
        if (params.minPrice) queryParams.append('min_price', params.minPrice);
        if (params.maxPrice) queryParams.append('max_price', params.maxPrice);
        if (params.location) queryParams.append('location', params.location);
        if (params.tags) queryParams.append('tags', params.tags.join(','));
        if (params.seller) queryParams.append('seller', params.seller);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.offset) queryParams.append('offset', params.offset);
        if (params.sortBy) queryParams.append('sort_by', params.sortBy);
        if (params.sortOrder) queryParams.append('sort_order', params.sortOrder);
        
        const queryString = queryParams.toString();
        const url = queryString ? `/api/listings?${queryString}` : '/api/listings';
        
        return await this.request(url);
    }

    async getListingById(listingId) {
        return await this.request(`/api/listings?id=${listingId}`);
    }

    async createListing(listingData) {
        return await this.request('/api/listings', {
            method: 'POST',
            body: listingData
        });
    }

    async updateListing(listingId, updateData) {
        return await this.request(`/api/listings?id=${listingId}`, {
            method: 'PATCH',
            body: updateData
        });
    }

    async deleteListing(listingId) {
        return await this.request(`/api/listings?id=${listingId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Purchases API Methods
     */
    async getPurchasesByBuyer(buyerPubkey, limit = 20, offset = 0) {
        return await this.request(`/api/purchases?buyer=${buyerPubkey}&limit=${limit}&offset=${offset}`);
    }

    async getPurchasesBySeller(sellerPubkey, limit = 20, offset = 0) {
        return await this.request(`/api/purchases?seller=${sellerPubkey}&limit=${limit}&offset=${offset}`);
    }

    async createPurchase(purchaseData) {
        return await this.request('/api/purchases', {
            method: 'POST',
            body: purchaseData
        });
    }

    /**
     * Reviews API Methods
     */
    async getListingReviews(listingId, limit = 20, offset = 0) {
        return await this.request(`/api/reviews?listing_id=${listingId}&limit=${limit}&offset=${offset}`);
    }

    async getReviewsByUser(userPubkey, limit = 20, offset = 0) {
        return await this.request(`/api/reviews?reviewee=${userPubkey}&limit=${limit}&offset=${offset}`);
    }

    async createReview(reviewData) {
        return await this.request('/api/reviews', {
            method: 'POST',
            body: reviewData
        });
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await this.request('/api/health');
            return response;
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }

    /**
     * Nostr Events API
     */
    
    /**
     * Get Nostr events
     */
    async getEvents(params = {}) {
        const {
            pubkey = null,
            kind = null,
            limit = 50,
            offset = 0
        } = params;

        const queryParams = new URLSearchParams();
        if (pubkey) queryParams.append('pubkey', pubkey);
        if (kind !== null) queryParams.append('kind', kind);
        queryParams.append('limit', limit);
        queryParams.append('offset', offset);

        const endpoint = `/api/nostr-events?${queryParams.toString()}`;
        return await this.request(endpoint);
    }

    /**
     * Create Nostr event
     */
    async createEvent(eventData) {
        return await this.request('/api/nostr-event', {
            method: 'POST',
            body: eventData
        });
    }

    /**
     * Get event by ID
     */
    async getEventById(eventId) {
        return await this.request(`/api/nostr-events?id=${eventId}`);
    }

    /**
     * Media API
     */
    
    /**
     * Upload media
     */
    async uploadMedia(mediaData) {
        return await this.request('/api/media', {
            method: 'POST',
            body: mediaData
        });
    }

    /**
     * Get media by ID
     */
    async getMediaById(mediaId) {
        return await this.request(`/api/media?id=${mediaId}`);
    }

    /**
     * Get media by pubkey
     */
    async getMediaByPubkey(pubkey, params = {}) {
        const {
            limit = 50,
            offset = 0
        } = params;

        const queryParams = new URLSearchParams();
        queryParams.append('pubkey', pubkey);
        queryParams.append('limit', limit);
        queryParams.append('offset', offset);

        const endpoint = `/api/media?${queryParams.toString()}`;
        return await this.request(endpoint);
    }

    /**
     * Marketplace specific methods
     */
    
    /**
     * Get featured listings
     */
    async getFeaturedListings(limit = 4) {
        try {
            const response = await this.getEvents({
                kind: 1, // Text notes (listings)
                limit: limit
            });
            
            if (response.ok) {
                return response.data.events || [];
            }
            
            return [];
        } catch (error) {
            console.error('Failed to get featured listings:', error);
            return [];
        }
    }

    /**
     * Search listings
     */
    async searchListings(query, params = {}) {
        try {
            // For now, we'll search through text content
            // In the future, this could be a dedicated search endpoint
            const response = await this.getEvents({
                kind: 1,
                limit: params.limit || 20,
                offset: params.offset || 0
            });

            if (response.ok && response.data.events) {
                // Filter events that contain the search query
                const filteredEvents = response.data.events.filter(event => 
                    event.content.toLowerCase().includes(query.toLowerCase())
                );
                
                return {
                    ok: true,
                    data: {
                        events: filteredEvents,
                        count: filteredEvents.length,
                        query: query
                    }
                };
            }

            return { ok: false, error: 'Search failed' };
        } catch (error) {
            console.error('Search failed:', error);
            return { ok: false, error: error.message };
        }
    }

    /**
     * Get listings by category
     */
    async getListingsByCategory(category, params = {}) {
        try {
            // For now, we'll use tags to filter by category
            // In the future, this could be a dedicated category endpoint
            const response = await this.getEvents({
                kind: 1,
                limit: params.limit || 20,
                offset: params.offset || 0
            });

            if (response.ok && response.data.events) {
                // Filter events that have the category tag
                const filteredEvents = response.data.events.filter(event => {
                    if (!event.tags || !Array.isArray(event.tags)) return false;
                    
                    return event.tags.some(tag => 
                        Array.isArray(tag) && 
                        tag.length >= 2 && 
                        tag[0] === 'category' && 
                        tag[1] === category
                    );
                });
                
                return {
                    ok: true,
                    data: {
                        events: filteredEvents,
                        count: filteredEvents.length,
                        category: category
                    }
                };
            }

            return { ok: false, error: 'Failed to get category listings' };
        } catch (error) {
            console.error('Failed to get category listings:', error);
            return { ok: false, error: error.message };
        }
    }

    /**
     * Get user's listings
     */
    async getUserListings(pubkey, params = {}) {
        try {
            const response = await this.getEvents({
                pubkey: pubkey,
                kind: 1,
                limit: params.limit || 20,
                offset: params.offset || 0
            });

            return response;
        } catch (error) {
            console.error('Failed to get user listings:', error);
            return { ok: false, error: error.message };
        }
    }

    /**
     * Create listing
     */
    async createListing(listingData) {
        try {
            // Create a Nostr event for the listing
            const eventData = {
                kind: 1, // Text note
                content: listingData.description || '',
                tags: [
                    ['category', listingData.category || 'general'],
                    ['price', listingData.price || '0'],
                    ['currency', listingData.currency || 'BTC'],
                    ['title', listingData.title || 'Untitled Listing']
                ]
            };

            return await this.createEvent(eventData);
        } catch (error) {
            console.error('Failed to create listing:', error);
            return { ok: false, error: error.message };
        }
    }

    /**
     * Utility methods
     */
    
    /**
     * Check if API is available
     */
    async isApiAvailable() {
        try {
            await this.healthCheck();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get API status
     */
    async getApiStatus() {
        try {
            const health = await this.healthCheck();
            return {
                available: true,
                status: health.status || 'unknown',
                database: health.database || 'unknown',
                environment: health.environment || {}
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Format error message
     */
    formatError(error) {
        if (error.message) {
            return error.message;
        }
        
        if (typeof error === 'string') {
            return error;
        }
        
        return 'An unexpected error occurred';
    }

    /**
     * Handle API errors
     */
    handleError(error, context = '') {
        console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
        
        const message = this.formatError(error);
        
        // Show user-friendly error message
        if (window.app && window.app.toast) {
            window.app.toast.error(message);
        }
        
        return {
            ok: false,
            error: {
                message: message,
                context: context,
                timestamp: new Date().toISOString()
            }
        };
    }
}

// Create global API service instance
window.apiService = new ApiService();
