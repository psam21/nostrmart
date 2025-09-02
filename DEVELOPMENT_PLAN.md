# NostrMart Development Plan

## 🎯 Project Overview

NostrMart is a decentralized marketplace built on the Nostr protocol, deployed as serverless functions on Vercel with Supabase backend. This plan outlines the roadmap for taking the project from its current MVP state to a full-featured marketplace.

## 🎯 Development Principles

### Core Principles:
- **Mobile-First Responsive Design**: Every page and component must work beautifully on both desktop and mobile
- **Consistent Modern Experience**: Same rich, clean, professional experience across all devices and screen sizes
- **Progressive Enhancement**: Start with core functionality, add features progressively
- **Security First**: Implement authentication and validation early
- **Manual Testing**: All testing will be manual with comprehensive checklists
- **Documentation**: Keep docs updated with each feature
- **Performance**: Optimize for serverless constraints

### Responsive Design Standards:
- **Breakpoints**: Mobile (320px+), Tablet (768px+), Desktop (1024px+), Large (1440px+)
- **Touch-Friendly**: Minimum 44px touch targets, adequate spacing between interactive elements
- **Readable Typography**: Scalable font sizes that remain legible on all screen sizes
- **Adaptive Layouts**: CSS Grid and Flexbox for flexible, responsive layouts
- **Performance**: Optimized images and assets for different screen densities
- **Cross-Device Consistency**: Identical functionality and visual quality across all devices

### Universal Design Requirements:
- **All Phases**: Every feature developed must be responsive and mobile-optimized
- **Rich Interactions**: Smooth animations, micro-interactions, and feedback on all devices
- **Modern Aesthetics**: Clean, professional design that works on any screen size
- **Accessibility**: WCAG 2.1 AA compliance for all components
- **Performance**: Fast loading and smooth interactions on mobile networks

## 🏗️ Current Architecture

### Backend Stack
- **Runtime**: Python 3.11 serverless functions (Vercel)
- **Framework**: http.server (Vercel-compatible)
- **Database**: Supabase (PostgreSQL via REST API)
- **Authentication**: Nostr protocol (planned)
- **Media Storage**: Blossom protocol (planned)
- **Deployment**: Vercel with GitHub integration

### Current Status
- ✅ Basic API endpoints functional
- ✅ Supabase integration complete
- ✅ Database schema deployed
- ✅ All CRUD operations working
- ❌ No frontend interface
- ❌ No authentication/security
- ❌ No file upload handling

## 📋 Development Roadmap

### Phase 1: Frontend Development (Priority: HIGHEST)
**Estimated Time**: 2-3 weeks

#### 1.1 Static Frontend Setup
- **Goal**: Create modern, rich user interface for marketplace
- **Technical Stack**:
  - HTML5, CSS3, JavaScript (ES6+)
  - Modern CSS framework (Tailwind CSS or similar)
  - Nostr wallet integration (NIP-07)
  - Responsive design (mobile-first)
  - Progressive Web App (PWA) features
- **File Structure**:
  ```
  public/
    index.html
    css/
      style.css
      components/
        buttons.css
        cards.css
        forms.css
    js/
      app.js
      nostr.js
      marketplace.js
      ui.js
    assets/
      icons/
      images/
      fonts/
  ```

#### 1.2 Modern UI Components
- **Goal**: Build rich, interactive UI components
- **Components**:
  - Modern card-based layout for listings
  - Interactive search and filter interface
  - Smooth animations and transitions
  - Dark/light theme toggle
  - Loading states and skeleton screens
  - Toast notifications for user feedback
- **Design Principles**:
  - Clean, minimalist design
  - Consistent spacing and typography
  - Accessible color contrast
  - Smooth micro-interactions
  - Mobile-first responsive design

#### 1.3 Nostr Wallet Integration
- **Goal**: Enable users to connect Nostr wallets seamlessly
- **Technical Details**:
  - Implement NIP-07 browser extension support
  - Add wallet connection UI with status indicators
  - Handle wallet events and state management
  - Support multiple wallet types
  - Graceful fallbacks for non-wallet users
- **Implementation**:
  - `js/nostr.js` - Nostr protocol handling
  - `js/wallet.js` - Wallet connection logic
  - Connection status indicators and user feedback

#### 1.4 Marketplace UI Components
- **Goal**: Core marketplace functionality with rich interactions
- **Components**:
  - Hero section with search and featured listings
  - Item listing creation form with rich text editor
  - Browse/search interface with filters and sorting
  - User profile management with avatar upload
  - Transaction history with status indicators
  - Rating/review system with star ratings
- **Technical Details**:
  - Component-based architecture
  - State management with localStorage
  - Real-time updates via polling (WebSocket later)
  - Responsive grid layouts with CSS Grid/Flexbox
  - Image lazy loading and optimization

### Phase 2: Security & Authentication (Priority: HIGH)
**Estimated Time**: 1-2 weeks

#### 2.1 Nostr Signature Verification
- **Goal**: Implement proper Nostr event signature validation
- **Technical Details**:
  - Use `secp256k1` library for signature verification
  - Implement NIP-01 event validation
  - Add signature verification middleware
  - Validate pubkey format (64-char hex)
- **Files to Create/Modify**:
  - `app/auth/nostr_validator.py` - Signature verification logic
  - `app/middleware/auth.py` - Authentication middleware
  - Update all API endpoints to require valid signatures
- **Dependencies**: `secp256k1`, `hashlib`, `json`

#### 2.2 Rate Limiting
- **Goal**: Prevent API abuse and ensure fair usage
- **Technical Details**:
  - Implement per-pubkey rate limiting
  - Use Supabase for rate limit storage
  - Add rate limit headers to responses
  - Configurable limits per endpoint type
- **Implementation**:
  - Create `app/middleware/rate_limit.py`
  - Add rate limit table to database
  - Implement sliding window algorithm

#### 2.3 Input Validation & Sanitization
- **Goal**: Secure all user inputs
- **Technical Details**:
  - Enhanced Pydantic models with strict validation
  - Content sanitization for XSS prevention
  - File type validation for media uploads
  - Size limits for all inputs
- **Files to Modify**:
  - `app/models/nostr.py` - Stricter validation rules
  - `app/models/media.py` - Media validation
  - All API endpoints for input sanitization

### Phase 3: Enhanced API Features (Priority: MEDIUM)
**Estimated Time**: 1-2 weeks

#### 3.1 Advanced Querying
- **Goal**: Improve data retrieval capabilities
- **Features**:
  - Full-text search on content
  - Advanced filtering (date ranges, categories)
  - Sorting options (price, date, popularity)
  - Pagination with cursor-based navigation
- **Technical Implementation**:
  - Add search indexes to Supabase
  - Implement query builder in services
  - Add search endpoint: `GET /api/search`

#### 3.2 Media File Handling
- **Goal**: Support actual file uploads
- **Technical Details**:
  - Integrate with Blossom protocol for decentralized storage
  - Add file upload endpoint with multipart support
  - Implement file type validation and virus scanning
  - Add image resizing and optimization
- **Implementation**:
  - `app/services/blossom_service.py` - Blossom integration
  - Update media endpoints for file handling
  - Add file upload UI components

#### 3.3 Event Kind System
- **Goal**: Support different types of marketplace events
- **Event Types**:
  - `30023` - Long-form content (listings)
  - `30024` - Draft listings
  - `1` - Comments/reviews
  - `7` - Reactions (likes)
- **Technical Details**:
  - Extend NostrEvent model for different kinds
  - Add kind-specific validation rules
  - Implement kind-based filtering

### Phase 4: Production Improvements (Priority: MEDIUM)
**Estimated Time**: 1-2 weeks

#### 4.1 Monitoring & Logging
- **Goal**: Production-ready observability
- **Technical Details**:
  - Structured JSON logging with correlation IDs
  - Error tracking and alerting
  - Performance monitoring
  - Usage analytics
- **Implementation**:
  - Integrate with Vercel Analytics
  - Add Sentry for error tracking
  - Implement custom metrics collection

#### 4.2 API Documentation
- **Goal**: Developer-friendly API documentation
- **Technical Details**:
  - OpenAPI 3.0 specification
  - Interactive API explorer
  - Code examples in multiple languages
  - SDK generation
- **Tools**: Swagger UI, Redoc, or custom documentation site

#### 4.3 Manual Testing & CI/CD
- **Goal**: Reliable deployment pipeline with manual testing
- **Technical Details**:
  - Manual testing checklist for all features
  - Manual API endpoint validation
  - Manual user flow testing
  - Automated deployment on PR merge
- **Implementation**:
  - GitHub Actions for automated deployment only
  - Comprehensive manual testing procedures
  - Testing checklist documentation
  - Manual regression testing protocols

### Phase 5: Advanced Marketplace Features (Priority: LOW)
**Estimated Time**: 3-4 weeks

#### 5.1 Transaction System
- **Goal**: Handle marketplace transactions
- **Features**:
  - Escrow system for secure payments
  - Lightning Network integration
  - Transaction history and receipts
  - Dispute resolution system
- **Technical Details**:
  - Add transaction table to database
  - Implement escrow smart contracts
  - Lightning node integration
  - Multi-signature wallet support

#### 5.2 Reputation System
- **Goal**: Build trust in the marketplace
- **Features**:
  - User rating system
  - Review management
  - Reputation scoring algorithm
  - Trust indicators
- **Technical Details**:
  - Add reputation tables to database
  - Implement weighted scoring system
  - Add reputation display components

#### 5.3 Advanced Search & Discovery
- **Goal**: Help users find relevant items
- **Features**:
  - AI-powered recommendations
  - Category-based browsing
  - Trending items
  - Saved searches and alerts
- **Technical Details**:
  - Machine learning recommendation engine
  - Elasticsearch integration for advanced search
  - Real-time trending calculations

## 🛠️ Technical Implementation Details

### Database Schema Extensions

#### Additional Tables Needed:
```sql
-- Rate limiting
CREATE TABLE rate_limits (
    id SERIAL PRIMARY KEY,
    pubkey TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles
CREATE TABLE user_profiles (
    pubkey TEXT PRIMARY KEY,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace listings
CREATE TABLE marketplace_listings (
    id TEXT PRIMARY KEY,
    pubkey TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price_sats INTEGER,
    category TEXT,
    condition TEXT,
    location TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    buyer_pubkey TEXT NOT NULL,
    seller_pubkey TEXT NOT NULL,
    amount_sats INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    reviewer_pubkey TEXT NOT NULL,
    reviewee_pubkey TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Environment Variables

#### Additional Variables Needed:
```bash
# Security
RATE_LIMIT_WINDOW=3600  # 1 hour in seconds
RATE_LIMIT_MAX_REQUESTS=100
JWT_SECRET=your-jwt-secret

# Blossom Protocol
BLOSSOM_ENDPOINT=https://blossom.server.com
BLOSSOM_API_KEY=your-blossom-key

# Lightning Network
LIGHTNING_RPC_URL=your-lightning-rpc-url
LIGHTNING_MACAROON=your-macaroon

# Monitoring
SENTRY_DSN=your-sentry-dsn
VERCEL_ANALYTICS_ID=your-analytics-id
```

### API Endpoint Extensions

#### New Endpoints to Implement:
```
# Authentication
POST /api/auth/verify-signature
GET  /api/auth/profile

# Marketplace
POST /api/listings
GET  /api/listings
GET  /api/listings/{id}
PUT  /api/listings/{id}
DELETE /api/listings/{id}

# Search
GET  /api/search?q={query}&category={cat}&price_min={min}&price_max={max}

# Transactions
POST /api/transactions
GET  /api/transactions
GET  /api/transactions/{id}
PUT  /api/transactions/{id}/status

# Reviews
POST /api/reviews
GET  /api/reviews?pubkey={pubkey}
GET  /api/reviews/{id}

# Media Upload
POST /api/media/upload
GET  /api/media/{id}/download
```

### Frontend Architecture

#### Modern UI Design System:
- **Color Palette**: Use modern, accessible color schemes with proper contrast ratios
- **Typography**: Clean, readable fonts (Inter, Roboto, or system fonts)
- **Spacing**: Consistent 8px grid system for margins and padding
- **Shadows**: Subtle elevation with CSS box-shadow for depth
- **Animations**: Smooth transitions (200-300ms) for all interactive elements
- **Icons**: Consistent icon set (Heroicons, Lucide, or similar)

#### Component Structure:
```
public/
  index.html
  css/
    base/
      reset.css
      typography.css
      colors.css
    components/
      buttons.css
      cards.css
      forms.css
      navigation.css
      modals.css
    pages/
      home.css
      browse.css
      profile.css
    utilities/
      spacing.css
      animations.css
  js/
    components/
      WalletConnect.js
      ListingCard.js
      SearchFilters.js
      Modal.js
      Toast.js
    pages/
      Home.js
      Browse.js
      CreateListing.js
      Profile.js
    services/
      api.js
      nostr.js
      storage.js
    utils/
      validation.js
      formatting.js
      animations.js
  assets/
    icons/
    images/
    fonts/
```

#### Modern UI Features to Implement:
- **Glassmorphism**: Subtle backdrop blur effects for modals and cards
- **Micro-interactions**: Hover effects, button press animations, loading spinners
- **Skeleton Loading**: Placeholder content while data loads
- **Infinite Scroll**: Smooth loading of more content as user scrolls
- **Search Suggestions**: Real-time search with autocomplete
- **Image Galleries**: Lightbox for viewing listing images
- **Progress Indicators**: Visual feedback for multi-step processes

## 🚀 Getting Started

### For New Developers:

1. **Setup Development Environment**:
   ```bash
   git clone https://github.com/psam21/nostrmart.git
   cd nostrmart
   pip install -e .
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Set up Supabase project
   - Configure Vercel deployment

3. **Run Database Migration**:
   - Execute `migrations/001_init.sql` in Supabase
   - Verify tables are created

4. **Start Development**:
   - Choose a phase from the roadmap
   - Create feature branch
   - Implement following the technical specifications
   - Test thoroughly before submitting PR

### Development Guidelines:

- **Code Style**: Follow PEP 8 for Python, ESLint for JavaScript
- **Testing**: Manual testing for all new functionality using comprehensive checklists
- **Documentation**: Update README and API docs for new features
- **Security**: Always validate inputs and implement proper authentication
- **Performance**: Consider serverless function limits and optimize accordingly
- **Responsive Design**: Every feature must work beautifully on mobile, tablet, and desktop
- **Mobile-First**: Design and develop for mobile first, then enhance for larger screens
- **Cross-Device Consistency**: Maintain identical functionality and visual quality across all devices
- **Touch-Friendly**: Ensure all interactive elements meet minimum touch target sizes (44px)
- **Performance**: Optimize for mobile networks and slower devices

## 📊 Success Metrics

### Phase 1 Success Criteria (Frontend Development):
- [ ] Modern, rich UI is visually appealing and professional
- [ ] Users can connect Nostr wallets seamlessly
- [ ] Responsive design works on all device sizes
- [ ] Core marketplace UI components are functional
- [ ] Smooth animations and interactions implemented
- [ ] Dark/light theme toggle working
- [ ] Loading states and user feedback systems in place

### Phase 2 Success Criteria (Security & Authentication):
- [ ] All API endpoints require valid Nostr signatures
- [ ] Rate limiting prevents abuse
- [ ] Input validation blocks malicious data
- [ ] Security audit passes
- [ ] **Responsive**: All security features work seamlessly on mobile and desktop

### Phase 3 Success Criteria:
- [ ] Advanced search functionality
- [ ] File upload and storage working
- [ ] Multiple event kinds supported
- [ ] API performance optimized
- [ ] **Responsive**: All enhanced features provide rich mobile experience

### Phase 4 Success Criteria:
- [ ] Comprehensive monitoring in place
- [ ] API documentation complete
- [ ] Manual testing procedures documented and followed
- [ ] 99.9% uptime achieved
- [ ] **Responsive**: Monitoring dashboards work perfectly on all devices

### Phase 5 Success Criteria:
- [ ] Payment system functional
- [ ] Reputation system active
- [ ] Advanced discovery features
- [ ] User engagement metrics positive
- [ ] **Responsive**: All marketplace features provide consistent rich experience across devices

## 🧪 Manual Testing Procedures

### Testing Philosophy
All testing will be performed manually using comprehensive checklists and procedures. This approach ensures thorough validation of user-facing functionality and real-world usage scenarios.

### Pre-Deployment Testing Checklist

#### API Endpoint Testing
- [ ] **Health Check**: Verify `/api/health` returns proper status and database connectivity
- [ ] **Nostr Events**: Test event creation, retrieval, and filtering
- [ ] **Media Upload**: Test file upload and metadata storage
- [ ] **Authentication**: Verify signature validation and rate limiting
- [ ] **Error Handling**: Test invalid inputs and edge cases
- [ ] **Performance**: Check response times under normal load

#### Frontend Testing
- [ ] **Wallet Connection**: Test Nostr wallet integration on all devices
- [ ] **User Flows**: Complete end-to-end user journeys on mobile and desktop
- [ ] **Responsive Design**: Test on mobile (320px+), tablet (768px+), desktop (1024px+), large (1440px+)
- [ ] **Cross-Browser**: Test on Chrome, Firefox, Safari, Edge on all device types
- [ ] **Accessibility**: Verify keyboard navigation and screen reader compatibility
- [ ] **Touch Interactions**: Test touch targets, gestures, and mobile-specific interactions
- [ ] **Performance**: Verify fast loading and smooth animations on mobile networks
- [ ] **Visual Consistency**: Ensure identical rich experience across all screen sizes

#### Security Testing
- [ ] **Input Validation**: Test with malicious inputs
- [ ] **Rate Limiting**: Verify abuse prevention
- [ ] **Authentication**: Test signature verification
- [ ] **Data Sanitization**: Verify XSS prevention
- [ ] **File Upload**: Test with various file types and sizes

### Testing Environment Setup
1. **Local Development**: Test all changes locally first
2. **Staging Environment**: Deploy to Vercel preview for testing
3. **Production Validation**: Final testing on production deployment

### Manual Testing Tools
- **API Testing**: curl, Postman, or similar tools
- **Browser Testing**: Multiple browsers and devices
- **Network Testing**: Test with slow connections and timeouts
- **Load Testing**: Manual concurrent user simulation

### Testing Documentation
- Maintain detailed test logs for each release
- Document any issues found and their resolutions
- Create regression testing checklists for future releases
- Update testing procedures as new features are added

## 🔄 Maintenance & Updates

### Regular Tasks:
- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance optimization and feature planning
- **Annually**: Architecture review and technology updates

### Community Contributions:
- Open source development model
- Contributor guidelines and code of conduct
- Issue templates and PR guidelines
- Regular community calls and feedback sessions

---

**Last Updated**: September 2025
**Version**: 1.0
**Maintainer**: Development Team
