/**
 * Profile Page Controller
 * Handles user profile management and display
 */

class ProfilePage {
    constructor() {
        this.currentUser = null;
        this.currentTab = 'listings';
        this.init();
    }

    /**
     * Initialize profile page
     */
    init() {
        this.setupEventListeners();
        this.loadUserProfile();
        this.loadTabContent();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Profile actions
        document.getElementById('edit-profile')?.addEventListener('click', () => {
            this.openProfileModal();
        });

        document.getElementById('edit-avatar')?.addEventListener('click', () => {
            this.editAvatar();
        });

        document.getElementById('create-listing')?.addEventListener('click', () => {
            this.navigateToCreate();
        });

        // Modal events
        document.getElementById('close-profile-modal')?.addEventListener('click', () => {
            this.closeProfileModal();
        });

        document.getElementById('cancel-profile-edit')?.addEventListener('click', () => {
            this.closeProfileModal();
        });

        document.getElementById('save-profile')?.addEventListener('click', () => {
            this.saveProfile();
        });

        // Click outside modal to close
        document.getElementById('profile-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'profile-modal') {
                this.closeProfileModal();
            }
        });
    }

    /**
     * Load user profile data
     */
    async loadUserProfile() {
        try {
            // Check if user is connected
            const isConnected = await this.checkWalletConnection();
            
            if (!isConnected) {
                this.showDisconnectedState();
                return;
            }

            // Load user data from Nostr
            const userData = await this.loadNostrProfile();
            
            if (userData) {
                this.currentUser = userData;
                this.displayUserProfile(userData);
                this.loadUserStats();
            } else {
                this.showNoProfileState();
            }

        } catch (error) {
            console.error('Failed to load user profile:', error);
            this.showErrorState();
        }
    }

    /**
     * Check wallet connection
     */
    async checkWalletConnection() {
        try {
            if (window.nostr && window.nostr.getPublicKey) {
                const pubkey = await window.nostr.getPublicKey();
                return !!pubkey;
            }
            return false;
        } catch (error) {
            console.error('Wallet connection check failed:', error);
            return false;
        }
    }

    /**
     * Load Nostr profile data
     */
    async loadNostrProfile() {
        try {
            if (!window.nostr || !window.nostr.getPublicKey) {
                return null;
            }

            const pubkey = await window.nostr.getPublicKey();
            
            // Try to get profile from API
            try {
                const response = await window.apiService.getUserProfile(pubkey);
                if (response.ok && response.data.profile) {
                    return response.data.profile;
                }
            } catch (error) {
                console.log('API profile not found, using default');
            }

            // Fallback to basic profile
            return {
                pubkey: pubkey,
                name: 'Nostr User',
                bio: 'Connect your Nostr wallet to see your profile',
                avatar: null,
                location: null,
                website: null,
                created_at: Date.now()
            };

        } catch (error) {
            console.error('Failed to load Nostr profile:', error);
            return null;
        }
    }

    /**
     * Display user profile
     */
    displayUserProfile(userData) {
        // Update profile info
        document.getElementById('user-name').textContent = userData.name || 'Anonymous User';
        document.getElementById('user-bio').textContent = userData.bio || 'No bio available';
        
        // Update avatar
        const avatarElement = document.getElementById('user-avatar');
        if (userData.avatar) {
            avatarElement.innerHTML = `<img src="${userData.avatar}" alt="Profile Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            // Generate avatar from pubkey
            this.generateAvatarFromPubkey(userData.pubkey);
        }
    }

    /**
     * Generate avatar from pubkey
     */
    generateAvatarFromPubkey(pubkey) {
        const avatarElement = document.getElementById('user-avatar');
        const colors = [
            'bg-gradient-to-br from-blue-500 to-purple-600',
            'bg-gradient-to-br from-green-500 to-blue-600',
            'bg-gradient-to-br from-purple-500 to-pink-600',
            'bg-gradient-to-br from-orange-500 to-red-600',
            'bg-gradient-to-br from-teal-500 to-green-600',
            'bg-gradient-to-br from-pink-500 to-purple-600'
        ];
        
        // Use pubkey to determine color
        const colorIndex = parseInt(pubkey.slice(0, 2), 16) % colors.length;
        const initials = (userData.name || 'NU').slice(0, 2).toUpperCase();
        
        avatarElement.innerHTML = `
            <div class="avatar-generated ${colors[colorIndex]} text-white flex items-center justify-center text-2xl font-bold">
                ${initials}
            </div>
        `;
    }

    /**
     * Load user statistics
     */
    async loadUserStats() {
        try {
            if (!this.currentUser) return;

            // Load stats from API
            const response = await window.apiService.getUserStats(this.currentUser.pubkey);
            
            if (response.ok && response.data.stats) {
                const stats = response.data.stats;
                document.getElementById('listings-count').textContent = stats.listings || 0;
                document.getElementById('sales-count').textContent = stats.sales || 0;
                document.getElementById('rating-average').textContent = (stats.rating || 0).toFixed(1);
            } else {
                // Default stats
                document.getElementById('listings-count').textContent = '0';
                document.getElementById('sales-count').textContent = '0';
                document.getElementById('rating-average').textContent = '0.0';
            }

        } catch (error) {
            console.error('Failed to load user stats:', error);
            // Set default stats
            document.getElementById('listings-count').textContent = '0';
            document.getElementById('sales-count').textContent = '0';
            document.getElementById('rating-average').textContent = '0.0';
        }
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
        this.loadTabContent();
    }

    /**
     * Load content for current tab
     */
    async loadTabContent() {
        switch (this.currentTab) {
            case 'listings':
                await this.loadUserListings();
                break;
            case 'purchases':
                await this.loadUserPurchases();
                break;
            case 'reviews':
                await this.loadUserReviews();
                break;
            case 'activity':
                await this.loadUserActivity();
                break;
        }
    }

    /**
     * Load user listings
     */
    async loadUserListings() {
        const container = document.getElementById('user-listings');
        
        try {
            if (!this.currentUser) {
                container.innerHTML = this.getEmptyState('Connect your wallet to see your listings');
                return;
            }

            // Show loading state
            container.innerHTML = this.getLoadingState();

            // Load listings from API
            const response = await window.apiService.getUserListings(this.currentUser.pubkey);
            
            if (response.ok && response.data.events && response.data.events.length > 0) {
                this.renderUserListings(response.data.events, container);
            } else {
                container.innerHTML = this.getEmptyState('No listings yet. Create your first listing!');
            }

        } catch (error) {
            console.error('Failed to load user listings:', error);
            container.innerHTML = this.getErrorState('Failed to load listings');
        }
    }

    /**
     * Render user listings
     */
    renderUserListings(listings, container) {
        const listingsHtml = listings.map(listing => `
            <div class="listing-item">
                <div class="listing-header">
                    <h3 class="listing-title">${this.escapeHtml(listing.content || 'Untitled Listing')}</h3>
                    <span class="listing-status ${this.getListingStatus(listing)}">${this.getListingStatus(listing)}</span>
                </div>
                <p class="listing-description">${this.escapeHtml(this.truncateText(listing.content, 150))}</p>
                <div class="listing-meta">
                    <span class="listing-price">${this.formatPrice(listing.tags)}</span>
                    <span class="listing-date">${this.formatDate(listing.created_at)}</span>
                </div>
                <div class="listing-actions">
                    <button class="btn btn-secondary" onclick="profilePage.editListing('${listing.id}')">Edit</button>
                    <button class="btn btn-primary" onclick="profilePage.viewListing('${listing.id}')">View</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = listingsHtml;
    }

    /**
     * Load user purchases
     */
    async loadUserPurchases() {
        const container = document.getElementById('user-purchases');
        
        try {
            if (!this.currentUser) {
                container.innerHTML = this.getEmptyState('Connect your wallet to see your purchases');
                return;
            }

            // Show loading state
            container.innerHTML = this.getLoadingState();

            // Load purchases from API
            const response = await window.apiService.getUserPurchases(this.currentUser.pubkey);
            
            if (response.ok && response.data.purchases && response.data.purchases.length > 0) {
                this.renderUserPurchases(response.data.purchases, container);
            } else {
                container.innerHTML = this.getEmptyState('No purchases yet. Start shopping!');
            }

        } catch (error) {
            console.error('Failed to load user purchases:', error);
            container.innerHTML = this.getErrorState('Failed to load purchases');
        }
    }

    /**
     * Render user purchases
     */
    renderUserPurchases(purchases, container) {
        const purchasesHtml = purchases.map(purchase => `
            <div class="purchase-item">
                <div class="purchase-image">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21,15 16,10 5,21"/>
                    </svg>
                </div>
                <div class="purchase-info">
                    <h4 class="purchase-title">${this.escapeHtml(purchase.title || 'Purchase')}</h4>
                    <p class="purchase-seller">From: ${this.escapeHtml(purchase.seller_name || 'Unknown')}</p>
                    <p class="purchase-date">${this.formatDate(purchase.created_at)}</p>
                </div>
                <span class="purchase-status">Completed</span>
            </div>
        `).join('');

        container.innerHTML = purchasesHtml;
    }

    /**
     * Load user reviews
     */
    async loadUserReviews() {
        const container = document.getElementById('user-reviews');
        
        try {
            if (!this.currentUser) {
                container.innerHTML = this.getEmptyState('Connect your wallet to see your reviews');
                return;
            }

            // Show loading state
            container.innerHTML = this.getLoadingState();

            // Load reviews from API
            const response = await window.apiService.getUserReviews(this.currentUser.pubkey);
            
            if (response.ok && response.data.reviews && response.data.reviews.length > 0) {
                this.renderUserReviews(response.data.reviews, container);
            } else {
                container.innerHTML = this.getEmptyState('No reviews yet. Start trading to get reviews!');
            }

        } catch (error) {
            console.error('Failed to load user reviews:', error);
            container.innerHTML = this.getErrorState('Failed to load reviews');
        }
    }

    /**
     * Render user reviews
     */
    renderUserReviews(reviews, container) {
        const reviewsHtml = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-rating">
                        ${this.renderStars(review.rating)}
                    </div>
                    <span class="review-date">${this.formatDate(review.created_at)}</span>
                </div>
                <p class="review-content">${this.escapeHtml(review.content)}</p>
                <p class="review-author">Review for: ${this.escapeHtml(review.listing_title || 'Unknown Listing')}</p>
            </div>
        `).join('');

        container.innerHTML = reviewsHtml;
    }

    /**
     * Load user activity
     */
    async loadUserActivity() {
        const container = document.getElementById('user-activity');
        
        try {
            if (!this.currentUser) {
                container.innerHTML = this.getEmptyState('Connect your wallet to see your activity');
                return;
            }

            // Show loading state
            container.innerHTML = this.getLoadingState();

            // Load activity from API
            const response = await window.apiService.getUserActivity(this.currentUser.pubkey);
            
            if (response.ok && response.data.activity && response.data.activity.length > 0) {
                this.renderUserActivity(response.data.activity, container);
            } else {
                container.innerHTML = this.getEmptyState('No activity yet. Start using NostrMart!');
            }

        } catch (error) {
            console.error('Failed to load user activity:', error);
            container.innerHTML = this.getErrorState('Failed to load activity');
        }
    }

    /**
     * Render user activity
     */
    renderUserActivity(activities, container) {
        const activitiesHtml = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-content">
                    <h4 class="activity-title">${this.escapeHtml(activity.title)}</h4>
                    <p class="activity-description">${this.escapeHtml(activity.description)}</p>
                    <span class="activity-time">${this.formatDate(activity.created_at)}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = activitiesHtml;
    }

    /**
     * Open profile edit modal
     */
    openProfileModal() {
        if (!this.currentUser) {
            window.app?.toast?.show('Please connect your wallet first', 'warning');
            return;
        }

        // Populate form with current data
        document.getElementById('profile-name-input').value = this.currentUser.name || '';
        document.getElementById('profile-bio-input').value = this.currentUser.bio || '';
        document.getElementById('profile-location-input').value = this.currentUser.location || '';
        document.getElementById('profile-website-input').value = this.currentUser.website || '';

        // Show modal
        document.getElementById('profile-modal').classList.add('active');
    }

    /**
     * Close profile edit modal
     */
    closeProfileModal() {
        document.getElementById('profile-modal').classList.remove('active');
    }

    /**
     * Save profile changes
     */
    async saveProfile() {
        try {
            if (!this.currentUser) {
                window.app?.toast?.show('Please connect your wallet first', 'warning');
                return;
            }

            const formData = {
                name: document.getElementById('profile-name-input').value.trim(),
                bio: document.getElementById('profile-bio-input').value.trim(),
                location: document.getElementById('profile-location-input').value.trim(),
                website: document.getElementById('profile-website-input').value.trim()
            };

            // Validate form
            if (!formData.name) {
                window.app?.toast?.show('Display name is required', 'error');
                return;
            }

            // Save to Nostr
            await this.saveNostrProfile(formData);

            // Update local data
            this.currentUser = { ...this.currentUser, ...formData };
            this.displayUserProfile(this.currentUser);

            // Close modal
            this.closeProfileModal();

            window.app?.toast?.show('Profile updated successfully!', 'success');

        } catch (error) {
            console.error('Failed to save profile:', error);
            window.app?.toast?.show('Failed to save profile. Please try again.', 'error');
        }
    }

    /**
     * Save profile to Nostr
     */
    async saveNostrProfile(profileData) {
        try {
            if (!window.nostr || !window.nostr.signEvent) {
                throw new Error('Nostr wallet not available');
            }

            const profileEvent = {
                kind: 0, // Profile metadata
                content: JSON.stringify(profileData),
                tags: [],
                created_at: Math.floor(Date.now() / 1000)
            };

            const signedEvent = await window.nostr.signEvent(profileEvent);
            
            // Send to API
            await window.apiService.createEvent(signedEvent);

        } catch (error) {
            console.error('Failed to save Nostr profile:', error);
            throw error;
        }
    }

    /**
     * Edit avatar
     */
    editAvatar() {
        window.app?.toast?.show('Avatar editing coming soon!', 'info');
    }

    /**
     * Navigate to create listing
     */
    navigateToCreate() {
        window.location.href = '/create.html';
    }

    /**
     * Edit listing
     */
    editListing(listingId) {
        window.app?.toast?.show('Listing editing coming soon!', 'info');
    }

    /**
     * View listing
     */
    viewListing(listingId) {
        window.app?.toast?.show('Listing view coming soon!', 'info');
    }

    /**
     * Show disconnected state
     */
    showDisconnectedState() {
        document.getElementById('user-name').textContent = 'Not Connected';
        document.getElementById('user-bio').textContent = 'Connect your Nostr wallet to see your profile';
        document.getElementById('listings-count').textContent = '0';
        document.getElementById('sales-count').textContent = '0';
        document.getElementById('rating-average').textContent = '0.0';
    }

    /**
     * Show no profile state
     */
    showNoProfileState() {
        document.getElementById('user-name').textContent = 'No Profile';
        document.getElementById('user-bio').textContent = 'Create your profile to get started';
    }

    /**
     * Show error state
     */
    showErrorState() {
        document.getElementById('user-name').textContent = 'Error';
        document.getElementById('user-bio').textContent = 'Failed to load profile data';
    }

    /**
     * Utility methods
     */
    getListingStatus(listing) {
        // Simple status logic - can be enhanced
        return 'active';
    }

    formatPrice(tags) {
        // Extract price from tags
        const priceTag = tags?.find(tag => tag[0] === 'price');
        return priceTag ? `$${priceTag[1]}` : 'Price TBD';
    }

    formatDate(timestamp) {
        return new Date(timestamp * 1000).toLocaleDateString();
    }

    renderStars(rating) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(`<svg class="star ${i <= rating ? 'filled' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>`);
        }
        return stars.join('');
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getLoadingState() {
        return `
            <div class="loading-state">
                <div class="skeleton" style="height: 200px; border-radius: 0.75rem;"></div>
            </div>
        `;
    }

    getEmptyState(message) {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>No Data</h3>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    getErrorState(message) {
        return `
            <div class="error-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <h3>Error</h3>
                <p>${this.escapeHtml(message)}</p>
                <button class="btn btn-primary" onclick="profilePage.loadTabContent()">Retry</button>
            </div>
        `;
    }
}

// Initialize profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profilePage = new ProfilePage();
});
