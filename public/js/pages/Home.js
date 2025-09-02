/**
 * Home Page Component
 * Handles the home page functionality and interactions
 */

class Home {
    constructor() {
        this.isInitialized = false;
        this.featuredListings = [];
        this.categories = [];
        
        this.init();
    }

    /**
     * Initialize home page
     */
    async init() {
        try {
            console.log('🏠 Initializing Home page...');
            
            this.setupEventListeners();
            await this.loadData();
            
            this.isInitialized = true;
            console.log('✅ Home page initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Home page:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Category cards
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const category = card.dataset.category;
                this.handleCategoryClick(category);
            });
        });

        // Hero action buttons
        const browseBtn = document.querySelector('#browse-btn');
        if (browseBtn) {
            browseBtn.addEventListener('click', () => this.handleBrowseClick());
        }

        const createListingBtn = document.querySelector('#create-listing-btn');
        if (createListingBtn) {
            createListingBtn.addEventListener('click', () => this.handleCreateListingClick());
        }

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearchInput(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearchSubmit(e.target.value);
                }
            });
        }

        // Intersection Observer for animations
        this.setupIntersectionObserver();
    }

    /**
     * Load initial data
     */
    async loadData() {
        try {
            // Load featured listings (handled by main app)
            // Load categories
            await this.loadCategories();
            
        } catch (error) {
            console.error('Failed to load home page data:', error);
        }
    }

    /**
     * Load categories data
     */
    async loadCategories() {
        try {
            // For now, use static categories
            // In the future, this could load from an API
            this.categories = [
                {
                    id: 'digital-art',
                    name: 'Digital Art',
                    description: 'NFTs, illustrations, and digital creations',
                    icon: 'star',
                    count: 0
                },
                {
                    id: 'services',
                    name: 'Services',
                    description: 'Freelance work and professional services',
                    icon: 'users',
                    count: 0
                },
                {
                    id: 'collectibles',
                    name: 'Collectibles',
                    description: 'Rare items and unique collectibles',
                    icon: 'package',
                    count: 0
                },
                {
                    id: 'software',
                    name: 'Software',
                    description: 'Apps, tools, and digital products',
                    icon: 'monitor',
                    count: 0
                }
            ];

            this.updateCategoryCounts();

        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    /**
     * Update category counts
     */
    async updateCategoryCounts() {
        try {
            // This would typically fetch from an API
            // For now, we'll simulate some counts
            this.categories.forEach(category => {
                category.count = Math.floor(Math.random() * 50);
            });

            this.renderCategoryCounts();

        } catch (error) {
            console.error('Failed to update category counts:', error);
        }
    }

    /**
     * Render category counts
     */
    renderCategoryCounts() {
        this.categories.forEach(category => {
            const card = document.querySelector(`[data-category="${category.id}"]`);
            if (card) {
                const countElement = card.querySelector('.category-count');
                if (countElement) {
                    countElement.textContent = `${category.count} items`;
                } else {
                    // Add count element if it doesn't exist
                    const countDiv = document.createElement('div');
                    countDiv.className = 'category-count';
                    countDiv.textContent = `${category.count} items`;
                    card.appendChild(countDiv);
                }
            }
        });
    }

    /**
     * Handle category click
     */
    handleCategoryClick(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            // Add visual feedback
            const card = document.querySelector(`[data-category="${categoryId}"]`);
            if (card) {
                card.classList.add('animate-pulse');
                setTimeout(() => {
                    card.classList.remove('animate-pulse');
                }, 600);
            }

            // Navigate to category (placeholder)
            if (window.app && window.app.toast) {
                window.app.toast.info(`Browsing ${category.name}...`);
            }
            
            // In the future, this would navigate to the category page
            console.log(`Navigating to category: ${category.name}`);
        }
    }

    /**
     * Handle browse button click
     */
    handleBrowseClick() {
        // Add visual feedback
        const button = document.querySelector('#browse-btn');
        if (button) {
            button.classList.add('animate-scaleDown');
            setTimeout(() => {
                button.classList.remove('animate-scaleDown');
            }, 150);
        }

        // Show browse functionality
        if (window.app && window.app.toast) {
            window.app.toast.info('Browse functionality coming soon!');
        }
    }

    /**
     * Handle create listing button click
     */
    handleCreateListingClick() {
        // Add visual feedback
        const button = document.querySelector('#create-listing-btn');
        if (button) {
            button.classList.add('animate-scaleDown');
            setTimeout(() => {
                button.classList.remove('animate-scaleDown');
            }, 150);
        }

        // Check if wallet is connected
        if (window.app && window.app.wallet) {
            if (window.app.wallet.isWalletConnected()) {
                if (window.app.toast) {
                    window.app.toast.info('Create listing functionality coming soon!');
                }
            } else {
                if (window.app.toast) {
                    window.app.toast.warning('Please connect your wallet to create a listing');
                }
                // Auto-trigger wallet connection
                setTimeout(() => {
                    if (window.app.connectWallet) {
                        window.app.connectWallet();
                    }
                }, 1000);
            }
        }
    }

    /**
     * Handle search input
     */
    handleSearchInput(query) {
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    /**
     * Handle search submit
     */
    handleSearchSubmit(query) {
        if (query.trim()) {
            this.performSearch(query.trim());
        }
    }

    /**
     * Perform search
     */
    async performSearch(query) {
        try {
            if (window.app && window.app.toast) {
                window.app.toast.info(`Searching for "${query}"...`);
            }

            // In the future, this would make an API call
            console.log(`Searching for: ${query}`);
            
            // Simulate search results
            setTimeout(() => {
                if (window.app && window.app.toast) {
                    window.app.toast.success(`Found results for "${query}"`);
                }
            }, 1000);

        } catch (error) {
            console.error('Search failed:', error);
            if (window.app && window.app.toast) {
                window.app.toast.error('Search failed. Please try again.');
            }
        }
    }

    /**
     * Setup intersection observer for animations
     */
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fadeInUp');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements for animation
        const elementsToAnimate = document.querySelectorAll(
            '.hero-card, .category-card, .listing-card, .section-header'
        );
        
        elementsToAnimate.forEach(element => {
            observer.observe(element);
        });
    }

    /**
     * Update featured listings
     */
    updateFeaturedListings(listings) {
        this.featuredListings = listings;
        this.renderFeaturedListings();
    }

    /**
     * Render featured listings
     */
    renderFeaturedListings() {
        const container = document.querySelector('#featured-listings');
        if (!container) return;

        // This is handled by the main app, but we can add additional logic here
        const listingCards = container.querySelectorAll('.listing-card');
        listingCards.forEach((card, index) => {
            // Add staggered animation
            card.style.animationDelay = `${index * 100}ms`;
            
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.classList.add('hover-lift');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hover-lift');
            });
        });
    }

    /**
     * Handle hero card interactions
     */
    setupHeroCardInteractions() {
        const heroCards = document.querySelectorAll('.hero-card');
        heroCards.forEach(card => {
            card.addEventListener('click', () => {
                // Add click animation
                card.classList.add('animate-bounce');
                setTimeout(() => {
                    card.classList.remove('animate-bounce');
                }, 600);

                // Show preview
                if (window.app && window.app.toast) {
                    window.app.toast.info('Listing preview coming soon!');
                }
            });

            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    /**
     * Handle scroll effects
     */
    handleScroll() {
        const hero = document.querySelector('.hero');
        if (hero) {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            hero.style.transform = `translateY(${parallax}px)`;
        }
    }

    /**
     * Get page statistics
     */
    getPageStats() {
        return {
            featuredListings: this.featuredListings.length,
            categories: this.categories.length,
            totalListings: this.categories.reduce((sum, cat) => sum + cat.count, 0)
        };
    }

    /**
     * Refresh page data
     */
    async refresh() {
        try {
            await this.loadData();
            if (window.app && window.app.toast) {
                window.app.toast.success('Page refreshed');
            }
        } catch (error) {
            console.error('Failed to refresh page:', error);
            if (window.app && window.app.toast) {
                window.app.toast.error('Failed to refresh page');
            }
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        // Remove event listeners
        clearTimeout(this.searchTimeout);
        
        // Remove intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.homePage = new Home();
    });
} else {
    window.homePage = new Home();
}
