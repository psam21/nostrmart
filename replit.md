# Overview

This is a decentralized marketplace built on Nostr protocol that allows users to buy and sell items using Bitcoin Lightning payments. The application leverages Nostr for authentication, Blossom protocol for media storage, and integrates with Lightning Network for payments. Users can create listings, browse items, and conduct peer-to-peer transactions without traditional intermediaries.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Architecture
- **Flask Web Framework**: Lightweight Python web application with SQLAlchemy ORM for database operations
- **SQLite Database**: Default database for development with PostgreSQL support via environment configuration
- **Modular Structure**: Separated concerns with dedicated modules for authentication (`nostr_auth.py`), media handling (`blossom_client.py`), utilities (`utils.py`), and routing (`routes.py`)

## Authentication System
- **Nostr Protocol Integration**: Users authenticate using Nostr public keys (npub format) instead of traditional username/password
- **Browser Extension Support**: Primary authentication method via NIP-07 compatible extensions like Alby or nos2x
- **Manual Authentication**: Fallback option for users without browser extensions
- **Session Management**: Flask sessions with challenge-response authentication flow

## Media Storage
- **Blossom Protocol**: Decentralized media storage using content-addressed blobs
- **Multiple Server Support**: Fallback mechanism across multiple Blossom servers for reliability
- **File Validation**: SHA-256 hash verification and content type validation for uploaded media

## Data Models
- **User Model**: Stores Nostr public keys (both npub and hex formats), profile information, and metadata
- **Listing Model**: Product listings with title, description, price (in satoshis), condition, category, and image references
- **Cascading Relationships**: User deletions automatically clean up associated listings

## Frontend Architecture
- **Server-Side Rendered Templates**: Jinja2 templates with Bootstrap 5 for responsive design
- **Progressive Enhancement**: JavaScript modules for Nostr extension integration and enhanced UX
- **Custom Styling**: CSS custom properties for consistent theming with orange/purple color scheme

## Payment Integration
- **Bitcoin Lightning**: Prices stored in satoshis with BTC conversion utilities
- **Payment Hash Generation**: Placeholder for Lightning invoice generation (implementation pending)

# External Dependencies

## Core Technologies
- **Flask**: Web framework with SQLAlchemy extension for ORM
- **Bootstrap 5**: Frontend CSS framework for responsive design
- **Font Awesome**: Icon library for UI elements
- **Inter Font**: Typography from Google Fonts

## Nostr Ecosystem
- **Browser Extensions**: NIP-07 compatible extensions (Alby, nos2x) for user authentication
- **secp256k1**: Cryptographic library for public key validation and signature verification

## Blossom Protocol
- **Blossom Servers**: Multiple server endpoints for redundant media storage
  - blossom.primal.net
  - blossom.band
  - nostr.media
- **Content-Addressed Storage**: SHA-256 based file identification and retrieval

## Database
- **SQLite**: Default development database
- **PostgreSQL**: Production database support via DATABASE_URL environment variable
- **Connection Pooling**: Configured with pool recycling and pre-ping for reliability

## JavaScript Libraries
- **nostr-tools**: Minified library for Nostr protocol operations (referenced but implementation details abstracted)
- **Custom Modules**: Separate files for authentication logic and general application functionality