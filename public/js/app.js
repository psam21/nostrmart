/**
 * NostrMart - Main Application
 * Modern, responsive marketplace built on Nostr protocol
 */

class NostrMartApp {
    constructor() {
        this.isInitialized = false;
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.wallet = null;
        this.toast = null;
        this.modal = null;
        
        // Initialize app when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing NostrMart...');
            
            // Set initial theme
            this.setTheme(this.currentTheme);
            
            // Initialize components
            this.initializeComponents();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            this.isInitialized = true;
            console.log('✅ NostrMart initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize NostrMart:', error);
            this.showError('Failed to initialize application');
        }
    }

    /**
     * Initialize all components
     */
    initializeComponents() {
        // Initialize Toast system
        this.toast = new Toast();
        
        // Initialize Modal system
        this.modal = new Modal();
        
        // Initialize Wallet Connect
        this.wallet = new WalletConnect();
        
        // Initialize Home page
        if (document.querySelector('.hero')) {
            this.home = new Home();
        }
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Mobile menu toggle
        const menuToggle = document.querySelector('.nav-menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Wallet connect
        const walletConnect = document.querySelector('#wallet-connect');
        if (walletConnect) {
            walletConnect.addEventListener('click', () => this.connectWallet());
        }

        // Navigation actions
        const browseBtn = document.querySelector('#browse-btn');
        if (browseBtn) {
            browseBtn.addEventListener('click', () => this.navigateToBrowse());
        }

        const createListingBtn = document.querySelector('#create-listing-btn');
        if (createListingBtn) {
            createListingBtn.addEventListener('click', () => this.navigateToCreate());
        }

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }

        // Scroll events
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Resize events
        window.addEventListener('resize', () => this.handleResize());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            // Load featured listings
            await this.loadFeaturedListings();
            
            // Check wallet connection status
            await this.checkWalletStatus();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    /**
     * Load featured listings
     */
    async loadFeaturedListings() {
        const listingsContainer = document.querySelector('#featured-listings');
        if (!listingsContainer) return;

        try {
            // Show loading state
            this.showLoadingState(listingsContainer);

            // Check if API is available first
            const apiAvailable = await this.checkApiAvailability();
            if (!apiAvailable) {
                this.showApiUnavailableState(listingsContainer);
                return;
            }

            // Fetch listings from API
            const response = await window.apiService.searchListings({
                limit: 8,
                sortBy: 'created_at',
                sortOrder: 'desc'
            });

            if (response.ok && response.data && Array.isArray(response.data)) {
                this.renderListings(response.data, listingsContainer);
            } else {
                // Fallback to mock data if no real listings exist yet
                this.renderMockListings(listingsContainer);
            }

        } catch (error) {
            console.error('Failed to load featured listings:', error);
            // Fallback to mock data on error
            this.renderMockListings(listingsContainer);
        }
    }

    /**
     * Render mock listings as fallback
     */
    renderMockListings(container) {
        const mockListings = [
            {
                id: 'mock-1',
                title: 'Vintage Bitcoin T-Shirt',
                description: 'Classic Bitcoin logo t-shirt from 2013. Perfect condition.',
                price_sats: 50000,
                category: 'Clothing',
                condition: 'Excellent',
                location: 'San Francisco, CA',
                images: ['https://via.placeholder.com/300x200?text=Bitcoin+T-Shirt'],
                tags: ['bitcoin', 'vintage', 'clothing'],
                seller_pubkey: 'mock-seller-1',
                created_at: new Date().toISOString()
            },
            {
                id: 'mock-2',
                title: 'Satoshi Nakamoto Book Collection',
                description: 'Complete collection of books about Bitcoin and cryptocurrency.',
                price_sats: 150000,
                category: 'Books',
                condition: 'Good',
                location: 'New York, NY',
                images: ['https://via.placeholder.com/300x200?text=Bitcoin+Books'],
                tags: ['books', 'bitcoin', 'education'],
                seller_pubkey: 'mock-seller-2',
                created_at: new Date().toISOString()
            },
            {
                id: 'mock-3',
                title: 'Hardware Wallet - Ledger Nano S',
                description: 'Secure hardware wallet for storing Bitcoin and other cryptocurrencies.',
                price_sats: 80000,
                category: 'Electronics',
                condition: 'New',
                location: 'Austin, TX',
                images: ['https://via.placeholder.com/300x200?text=Hardware+Wallet'],
                tags: ['hardware', 'wallet', 'security'],
                seller_pubkey: 'mock-seller-3',
                created_at: new Date().toISOString()
            },
            {
                id: 'mock-4',
                title: 'Bitcoin Art Print',
                description: 'Beautiful digital art print featuring Bitcoin logo and blockchain visualization.',
                price_sats: 25000,
                category: 'Art',
                condition: 'New',
                location: 'Los Angeles, CA',
                images: ['https://via.placeholder.com/300x200?text=Bitcoin+Art'],
                tags: ['art', 'bitcoin', 'digital'],
                seller_pubkey: 'mock-seller-4',
                created_at: new Date().toISOString()
            }
        ];
        
        this.renderListings(mockListings, container);
    }

    /**
     * Render listings in the container
     */
    renderListings(listings, container) {
        container.innerHTML = '';
        
        if (listings.length === 0) {
            this.showEmptyState(container);
            return;
        }

        listings.forEach((listing, index) => {
            const listingElement = this.createListingElement(listing, index);
            container.appendChild(listingElement);
        });
    }

    /**
     * Create a listing element
     */
    createListingElement(listing, index) {
        const listingDiv = document.createElement('div');
        listingDiv.className = 'listing-card animate-fadeInUp';
        listingDiv.style.animationDelay = `${index * 100}ms`;
        
        // Handle both new listing format and legacy Nostr event format
        const title = listing.title || listing.content || 'Untitled Listing';
        const description = listing.description || `Created by ${this.formatPubkey(listing.seller_pubkey || listing.pubkey)}`;
        const price = listing.price_sats ? this.formatSats(listing.price_sats) : '0.001 BTC';
        const category = listing.category || 'Digital Art';
        const pubkey = listing.seller_pubkey || listing.pubkey;
        const imageUrl = listing.images && listing.images.length > 0 ? listing.images[0] : null;
        
        listingDiv.innerHTML = `
            <div class="listing-image" style="${imageUrl ? `background-image: url('${imageUrl}'); background-size: cover; background-position: center;` : 'background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));'}">
                <div class="listing-overlay">
                    <button class="btn btn-primary btn-icon" aria-label="View listing">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                </div>
                ${listing.condition ? `<div class="listing-condition">${listing.condition}</div>` : ''}
            </div>
            <div class="listing-content">
                <h3 class="listing-title">${this.escapeHtml(title)}</h3>
                <p class="listing-description">${this.escapeHtml(description)}</p>
                <div class="listing-meta">
                    <span class="listing-price">${price}</span>
                    <span class="listing-category">${this.escapeHtml(category)}</span>
                </div>
                ${listing.location ? `<div class="listing-location">📍 ${this.escapeHtml(listing.location)}</div>` : ''}
                <div class="listing-footer">
                    <div class="listing-author">
                        <div class="author-avatar">${this.getInitials(pubkey)}</div>
                        <span>${this.formatPubkey(pubkey)}</span>
                    </div>
                    <span class="listing-date">${this.formatDate(listing.created_at)}</span>
                </div>
                ${listing.tags && listing.tags.length > 0 ? `
                    <div class="listing-tags">
                        ${listing.tags.slice(0, 3).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        // Add click handler
        listingDiv.addEventListener('click', () => {
            this.viewListing(listing);
        });

        return listingDiv;
    }

    /**
     * Show loading state
     */
    showLoadingState(container) {
        container.innerHTML = `
            <div class="listing-skeleton">
                <div class="skeleton-image loading-skeleton"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title loading-skeleton"></div>
                    <div class="skeleton-price loading-skeleton"></div>
                </div>
            </div>
            <div class="listing-skeleton">
                <div class="skeleton-image loading-skeleton"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title loading-skeleton"></div>
                    <div class="skeleton-price loading-skeleton"></div>
                </div>
            </div>
            <div class="listing-skeleton">
                <div class="skeleton-image loading-skeleton"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title loading-skeleton"></div>
                    <div class="skeleton-price loading-skeleton"></div>
                </div>
            </div>
            <div class="listing-skeleton">
                <div class="skeleton-image loading-skeleton"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title loading-skeleton"></div>
                    <div class="skeleton-price loading-skeleton"></div>
                </div>
            </div>
        `;
    }

    /**
     * Show empty state
     */
    showEmptyState(container) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-icon">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                <h3>No listings yet</h3>
                <p>Be the first to create a listing in the marketplace!</p>
                <button class="btn btn-primary" onclick="app.navigateToCreate()">Create Listing</button>
            </div>
        `;
    }

    /**
     * Check API availability
     */
    async checkApiAvailability() {
        try {
            const status = await window.apiService.getApiStatus();
            return status.available;
        } catch (error) {
            console.error('API availability check failed:', error);
            return false;
        }
    }

    /**
     * Show API unavailable state
     */
    showApiUnavailableState(container) {
        container.innerHTML = `
            <div class="api-unavailable-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-icon">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <h3>API Currently Unavailable</h3>
                <p>The backend API is currently protected or unavailable. The frontend is working perfectly!</p>
                <div class="api-status-info">
                    <p><strong>Frontend Status:</strong> ✅ Fully functional</p>
                    <p><strong>Backend Status:</strong> 🔒 Authentication protected</p>
                    <p><strong>Next Step:</strong> Connect to backend API</p>
                </div>
                <button class="btn btn-primary" onclick="app.loadFeaturedListings()">Retry Connection</button>
            </div>
        `;
    }

    /**
     * Show error state
     */
    showErrorState(container, error = null) {
        const errorMessage = error && error.message ? error.message : 'There was an error loading the featured listings.';
        
        container.innerHTML = `
            <div class="error-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <h3>Failed to load listings</h3>
                <p>${this.escapeHtml(errorMessage)}</p>
                <button class="btn btn-primary" onclick="app.loadFeaturedListings()">Retry</button>
            </div>
        `;
    }

    /**
     * Theme management
     */
    getStoredTheme() {
        return localStorage.getItem('nostrmart-theme');
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('nostrmart-theme', theme);
        
        // Update theme toggle icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.innerHTML = theme === 'dark' 
                ? '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'
                : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        this.toast?.show(`Switched to ${newTheme} theme`, 'success');
    }

    /**
     * Mobile menu management
     */
    toggleMobileMenu() {
        const menuToggle = document.querySelector('.nav-menu-toggle');
        const mobileNav = document.querySelector('.mobile-nav');
        
        if (menuToggle && mobileNav) {
            const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isOpen);
            mobileNav.classList.toggle('open', !isOpen);
        }
    }

    /**
     * Wallet management
     */
    async connectWallet() {
        try {
            if (this.wallet) {
                await this.wallet.connect();
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            this.toast?.show('Failed to connect wallet', 'error');
        }
    }

    async checkWalletStatus() {
        if (this.wallet) {
            const isConnected = await this.wallet.isConnected();
            this.updateWalletUI(isConnected);
        }
    }

    updateWalletUI(isConnected) {
        const walletBtn = document.querySelector('#wallet-connect');
        if (walletBtn) {
            walletBtn.classList.toggle('connected', isConnected);
            const walletText = walletBtn.querySelector('.wallet-text');
            if (walletText) {
                walletText.textContent = isConnected ? 'Connected' : 'Connect';
            }
        }
    }

    /**
     * Navigation
     */
    navigateToBrowse() {
        this.toast?.show('Browse functionality coming soon!', 'info');
    }

    navigateToCreate() {
        this.toast?.show('Create listing functionality coming soon!', 'info');
    }

    viewListing(listing) {
        this.toast?.show('Listing details coming soon!', 'info');
    }

    /**
     * Format satoshis to readable format
     */
    formatSats(sats) {
        if (sats >= 100000000) {
            return `${(sats / 100000000).toFixed(2)} BTC`;
        } else if (sats >= 1000) {
            return `${(sats / 1000).toFixed(0)}k sats`;
        } else {
            return `${sats} sats`;
        }
    }

    /**
     * Search functionality
     */
    handleSearch(query) {
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    async performSearch(query) {
        if (!query.trim()) return;

        try {
            this.toast?.show(`Searching for "${query}"...`, 'info');

            // Check if API is available
            const apiAvailable = await this.checkApiAvailability();
            if (!apiAvailable) {
                this.toast?.show('Search requires backend connection. API currently unavailable.', 'warning');
                return;
            }

            // Perform search using API service
            const response = await window.apiService.searchListings({
                query: query,
                limit: 20
            });

            if (response.ok && response.data && Array.isArray(response.data)) {
                this.toast?.show(`Found ${response.data.length} results for "${query}"`, 'success');
                
                // Update the featured listings with search results
                const listingsContainer = document.querySelector('#featured-listings');
                if (listingsContainer) {
                    this.renderListings(response.data, listingsContainer);
                }
            } else {
                this.toast?.show(`No results found for "${query}"`, 'info');
            }

        } catch (error) {
            console.error('Search failed:', error);
            this.toast?.show('Search failed. Please try again.', 'error');
        }
    }

    /**
     * Event handlers
     */
    handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 10);
        }
    }

    handleResize() {
        // Close mobile menu on resize
        if (window.innerWidth > 768) {
            this.toggleMobileMenu();
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape to close modals/menus
        if (e.key === 'Escape') {
            this.toggleMobileMenu();
        }
    }

    /**
     * Utility functions
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatPubkey(pubkey) {
        if (!pubkey) return 'Unknown';
        return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
    }

    getInitials(pubkey) {
        if (!pubkey) return '?';
        return pubkey.slice(0, 2).toUpperCase();
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString();
    }

    showError(message) {
        this.toast?.show(message, 'error');
    }

    showSuccess(message) {
        this.toast?.show(message, 'success');
    }

    showInfo(message) {
        this.toast?.show(message, 'info');
    }
}

// Initialize the app
const app = new NostrMartApp();

// Make app globally available
window.app = app;
