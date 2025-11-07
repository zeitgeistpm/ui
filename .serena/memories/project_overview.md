# Zeitgeist UI Project Overview

## Project Purpose
Zeitgeist UI is a Next.js frontend application for the Zeitgeist prediction markets platform built on Polkadot/Substrate blockchain. It provides a web interface for users to interact with prediction markets, trade, and participate in decentralized governance.

## Tech Stack
- **Framework**: Next.js 13.4 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: 
  - Jotai (atomic state management)
  - TanStack Query (server state caching)
- **Blockchain Integration**: 
  - Polkadot.js API
  - @zeitgeistpm/sdk (Zeitgeist SDK)
- **Testing**: 
  - Vitest (unit tests)
  - Playwright (E2E tests)
- **Build Tools**: Yarn 3.2.2, PostCSS, Autoprefixer

## Project Structure
- `/pages` - Next.js file-based routing
- `/components` - React components organized by feature
- `/lib` - Core application logic (hooks, state, GraphQL, utilities)
- `/e2e` - End-to-end tests
- `/public` - Static assets
- `/styles` - Global styles and CSS modules

## Key Features
- Prediction market creation and trading
- Portfolio management
- Court system for dispute resolution
- AMM swaps and liquidity provision
- Wallet connectivity (Polkadot ecosystem wallets)
- Real-time market data via GraphQL (Subsquid indexer)