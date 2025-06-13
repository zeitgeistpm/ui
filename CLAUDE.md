# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Zeitgeist ecosystem.

## Zeitgeist Ecosystem Overview

The Zeitgeist prediction markets platform consists of four main codebases:

1. **zeitgeist-runtime** - Substrate/Polkadot parachain implementation (Rust)
2. **zeitgeist-subsquid** - GraphQL indexing layer (TypeScript)
3. **zeitgeist-sdk** - TypeScript SDK for chain interactions (TypeScript)
4. **zeitgeist-ui** (current) - Next.js frontend application (TypeScript/React)

All codebases are located within the `/Users/robhyrk/Dev/ztg/zeitgeist-ui/` directory as subdirectories.

## Current UI Codebase (zeitgeist-ui)

### Development Commands

#### Core Development

- `yarn dev` - Start development server (staging environment)
- `yarn dev:prod` - Start development server (production environment)
- `yarn build` - Build for production
- `yarn build:staging` - Build for staging
- `yarn test` - Run unit tests with Vitest
- `yarn test:watch` - Run tests in watch mode

#### Code Quality

- `yarn prettier:check` - Check code formatting
- `yarn prettier:fix` - Fix code formatting
- `yarn prunable` - Find unused exports with ts-prune

#### Analysis

- `yarn analyze` - Analyze bundle size

### Architecture Overview

This is a Next.js 13.4 TypeScript application for Zeitgeist prediction markets built on the Polkadot blockchain ecosystem.

#### Key Technologies

- **Frontend**: Next.js with TypeScript, Tailwind CSS
- **State Management**: Jotai (atomic state management), TanStack Query (server state)
- **Blockchain**: Polkadot SDK, @zeitgeistpm/sdk for Zeitgeist chain interactions
- **URL State**: nuqs for search parameter management
- **Testing**: Vitest (unit), Playwright (e2e)

#### Core Directory Structure

- `/pages` - Next.js file-based routing with dynamic routes for markets, portfolios, court
- `/components` - Feature-organized React components (markets, portfolio, court, trade-form, ui)
- `/lib` - Core application logic organized by purpose:
  - `/lib/hooks` - Custom React hooks for blockchain interactions, queries, animations
  - `/lib/state` - Jotai atoms for global state management
  - `/lib/gql` - GraphQL queries and operations
  - `/lib/util` - Utility functions and helpers
  - `/lib/constants` - Application constants and configuration
  - `/lib/types` - TypeScript type definitions

#### Integration with Other Codebases

- **zeitgeist-sdk** - Used via `@zeitgeistpm/sdk` npm package for all blockchain interactions
- **zeitgeist-subsquid** - GraphQL queries via `/lib/gql` for indexed blockchain data
- **zeitgeist-runtime** - Interactions via SDK, runtime types via `@zeitgeistpm/augment-api`

### Development Patterns

- Functional components with TypeScript interfaces
- Named exports for components
- Jotai atoms for global state management
- TanStack Query for server state caching
- Tailwind CSS with mobile-first responsive design
- Directory naming: lowercase with dashes (market-card, use-zeitgeist)

### Market Lifecycle

Zeitgeist markets follow the pattern: Created → Active → Closed → Reported → Resolved
Handle different market types: Categorical and Scalar markets

### Testing Strategy

- Unit tests with Vitest in `.spec.ts` and `.test.ts` files
- E2E tests with Playwright in `/e2e` directory
- Test blockchain interactions and market trading flows

### Environment Setup

Copy `.env.example` to `.env.local` for required environment variables including blockchain endpoints and API keys.

## Related Codebases

### 1. Zeitgeist Runtime (zeitgeist-runtime)

**Location**: `/Users/robhyrk/Dev/ztg/zeitgeist-ui/zeitgeist-runtime`

**Purpose**: Substrate-based Polkadot parachain implementation containing the core blockchain logic for prediction markets.

#### Key Components (zrml modules)

- `prediction-markets` - Core prediction market functionality
- `neo-swaps` - Logarithmic Market Scoring Rule AMM for combinatorial markets
- `swaps` - Balancer-style CFMM
- `orderbook` - Order book implementation
- `court` - Decentralized dispute resolution
- `authorized` - Authorized dispute resolution
- `global-disputes` - Global dispute mechanism
- `combinatorial-tokens` - Zeitgeist 2.0 outcome tokens
- `futarchy` - On-chain governance via prediction markets
- `parimutuel` - Parimutuel market maker

#### Development Commands

```bash
# In zeitgeist-runtime directory
cargo build --release                    # Build standalone node
cargo build --features parachain --release  # Build parachain node
make run                                 # Run development node
make check                              # Check code without building
make build-wasm                         # Build WASM runtime
make try-runtime-upgrade-zeitgeist      # Test runtime upgrades
```

#### Integration with UI

- Runtime types exposed via `@zeitgeistpm/augment-api` package
- Blockchain interactions through Polkadot.js API and Zeitgeist SDK
- Chain endpoints: mainnet (Polkadot), Battery Station testnet (Rococo)

### 2. Zeitgeist SDK (zeitgeist-sdk)

**Location**: `/Users/robhyrk/Dev/ztg/zeitgeist-ui/zeitgeist-sdk`

**Purpose**: TypeScript SDK providing type-safe abstractions for interacting with the Zeitgeist blockchain.

#### Package Structure

- `@zeitgeistpm/sdk` - Main SDK package
- `@zeitgeistpm/rpc` - RPC interactions and transaction utilities
- `@zeitgeistpm/indexer` - GraphQL client for Subsquid data
- `@zeitgeistpm/utility` - Functional programming utilities
- `@zeitgeistpm/augment-api` - Polkadot.js API type augmentations
- `@zeitgeistpm/web3.storage` - IPFS and storage abstractions

#### Development Commands

```bash
# In zeitgeist-sdk directory
yarn build:bsr          # Build for Battery Station testnet
yarn build:mainnet      # Build for mainnet
yarn test              # Run tests
yarn coverage          # Run test coverage
```

#### Key Features

- Type-safe market creation and interaction
- AMM swap calculations and pool operations
- Account balance and asset management
- Prediction market lifecycle operations
- IPFS metadata storage integration

#### Integration with UI

- Imported via `@zeitgeistpm/sdk` package
- Used in custom hooks in `/lib/hooks`
- Provides type-safe blockchain operations
- Handles complex market math calculations

### 3. Zeitgeist Subsquid (zeitgeist-subsquid)

**Location**: `/Users/robhyrk/Dev/ztg/zeitgeist-ui/zeitgeist-subsquid`

**Purpose**: Subsquid-based indexer that processes Zeitgeist blockchain events and provides a GraphQL API for efficient data querying.

#### Architecture

```
Zeitgeist Chain → Subsquid Archive → Archive GraphQL Gateway → Subsquid Processor → Query Node API
```

#### Development Commands

```bash
# In zeitgeist-subsquid directory
yarn indexer:start:local    # Start local development (ephemeral DB)
yarn indexer:start:test     # Start testnet deployment
yarn indexer:start:main     # Start mainnet deployment
yarn api:start             # Start GraphQL API server
yarn migration:apply       # Apply database migrations
yarn codegen               # Generate entity classes from schema
yarn build                 # Build processor
```

#### Key Features

- Real-time blockchain event processing
- Historical market data aggregation
- Account balance and asset tracking
- Pool liquidity and swap history
- Court and dispute event indexing

#### Environments

- **Local**: Development with non-persistent storage
- **Test**: Testnet (Battery Station) - https://processor.bsr.zeitgeist.pm/graphql
- **Main**: Mainnet - https://processor.rpc-0.zeitgeist.pm/graphql

#### Integration with UI

- GraphQL queries in `/lib/gql`
- Used for historical data, market listings, portfolio tracking
- Provides efficient pagination and filtering
- Real-time subscriptions for live data

## Cross-Codebase Development Workflow

### Making Changes to Runtime

1. Modify runtime code in `zeitgeist-runtime/zrml/`
2. Update SDK types: `cd zeitgeist-sdk && yarn build:bsr`
3. Update UI dependencies: `cd zeitgeist-ui && yarn install`
4. Test integration in UI development environment

### Adding New GraphQL Queries

1. Modify schema in `zeitgeist-subsquid/schema.graphql`
2. Generate types: `cd zeitgeist-subsquid && yarn codegen`
3. Add mappings in `zeitgeist-subsquid/src/mappings/`
4. Update SDK indexer package: `cd zeitgeist-sdk && yarn build:bsr`
5. Add queries in UI: `zeitgeist-ui/lib/gql/`

### SDK Changes

1. Modify SDK packages in `zeitgeist-sdk/packages/`
2. Build SDK: `cd zeitgeist-sdk && yarn build:bsr`
3. Update UI package versions if needed
4. Test in UI development environment

## Common Integration Patterns

### Blockchain Interactions

- Use SDK abstractions through custom hooks
- Handle wallet connection states and network switching
- Implement proper loading/error states for blockchain operations
- Use BigNumber.js for precise token calculations

### Data Fetching

- Use TanStack Query for server state (GraphQL data)
- Use Jotai for client state (UI state, user preferences)
- Combine indexed data (Subsquid) with real-time chain data (SDK)

### Type Safety

- Runtime types via `@zeitgeistpm/augment-api`
- SDK types for function parameters and returns
- GraphQL types auto-generated from Subsquid schema
- Strict TypeScript configuration across all codebases

## Environment Variables

Create appropriate `.env.local` files in each codebase:

- **UI**: Copy from `.env.example`, includes GraphQL endpoints, chain endpoints
- **Subsquid**: Requires database configuration, chain endpoints
- **SDK**: Environment-specific build configurations
- **Runtime**: No environment variables needed for development

## Testing Strategy

- **Runtime**: Rust unit tests, integration tests, benchmarks
- **SDK**: Vitest unit tests, integration tests with test network
- **Subsquid**: Database migration tests, processor integration tests
- **UI**: Vitest unit tests, Playwright e2e tests

## Troubleshooting

### Common Issues

1. **Type mismatches**: Ensure SDK packages are up-to-date after runtime changes
2. **GraphQL errors**: Check Subsquid processor is running and schema is current
3. **Build failures**: Clear node_modules and rebuild SDK packages
4. **Chain connection**: Verify endpoints and network configuration

### Development Tips

- Use staging environment for UI development to avoid testnet rate limits
- Keep SDK packages synchronized across all TypeScript codebases
- Monitor Subsquid processor logs for indexing issues
- Use browser dev tools to inspect GraphQL query performance
