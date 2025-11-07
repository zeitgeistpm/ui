# Tools and Libraries Used in Zeitgeist UI

## Core Framework & Runtime
- **Next.js** (13.4.19) - React framework with SSR/SSG
- **React** (18.2.0) - UI library
- **React DOM** (18.2.0) - React renderer for web
- **TypeScript** (5.0.4) - Type-safe JavaScript

## Styling & UI Components
- **Tailwind CSS** (3.4.1) - Utility-first CSS framework
- **@headlessui/react** (1.7.17) - Unstyled UI components
- **@headlessui/tailwindcss** (0.1.2) - Tailwind integration for Headless UI
- **@tailwindcss/container-queries** (0.1.1) - Container query support
- **@tailwindcss/line-clamp** (0.4.2) - Line clamping utilities
- **styled-components** (5.3.3) - CSS-in-JS styling
- **framer-motion** (10.16.1) - Animation library
- **boring-avatars** (1.6.1) - Avatar generation

## State Management
- **Jotai** (2.0.4) - Atomic state management
- **@tanstack/react-query** (4.19.0) - Server state management
- **@tanstack/query-core** (4.29.1) - Query core logic
- **jotai-tanstack-query** (0.7.0) - Jotai + TanStack Query integration

## Blockchain & Web3
- **@polkadot/api** (16.4.1) - Polkadot blockchain API
- **@polkadot/extension-dapp** (0.58.7) - Browser extension integration
- **@polkadot/keyring** (13.4.4) - Key management
- **@polkadot/types** (16.4.1) - Type definitions
- **@polkadot/ui-keyring** (3.12.2) - UI keyring utilities
- **@zeitgeistpm/sdk** (4.2.0) - Zeitgeist SDK
- **@zeitgeistpm/augment-api** (3.8.0) - API augmentations
- **@zeitgeistpm/utility** (3.8.0) - Utility functions
- **@zeitgeistpm/avatara-nft-sdk** (1.3.1) - NFT SDK
- **@zeitgeistpm/avatara-util** (1.2.0) - Avatar utilities

## Wallet Integration
- **@talismn/connect-wallets** (1.2.3) - Talisman wallet connector
- **@walletconnect/modal** (2.6.2) - WalletConnect modal
- **@walletconnect/sign-client** (2.12.0) - WalletConnect signing
- **@walletconnect/universal-provider** (2.12.0) - Universal provider
- **@web3auth/base** (8.0.0) - Web3Auth base
- **@web3auth/no-modal** (8.0.1) - Web3Auth without modal
- **@web3auth/openlogin-adapter** (8.0.1) - OpenLogin adapter

## Data Fetching & API
- **graphql-request** (5.0.0) - GraphQL client
- **axios** (0.21.4) - HTTP client
- **@yornaath/batshit** (0.8.0) - Batch fetching utility

## Forms & Validation
- **react-hook-form** (7.43.9) - Form management
- **zod** (3.21.4) - Schema validation
- **zod-validation-error** (3.0.2) - Validation error handling
- **validatorjs** (3.22.1) - Validation library

## UI Components & Libraries
- **react-select** (5.10.1) - Select input component
- **react-table** (7.7.0) - Table component
- **react-data-table-component** (6.11.8) - Data table
- **recharts** (2.4.3) - Charting library
- **react-circular-progressbar** (2.1.0) - Progress bars
- **react-countdown-circle-timer** (2.5.4) - Countdown timer
- **react-color** (2.19.3) - Color picker
- **react-datetime** (3.1.1) - Date/time picker
- **react-quill** (2.0.0) - Rich text editor
- **react-feather** (2.0.9) - Feather icons
- **react-icons** (4.9.0) - Icon library
- **react-spinners** (0.10.6) - Loading spinners

## Carousel & Media
- **embla-carousel** (8.0.0-rc19) - Carousel component
- **embla-carousel-react** (8.0.0-rc19) - React integration
- **pure-react-carousel** (1.27.8) - Alternative carousel
- **react-twitch-embed** (3.0.2) - Twitch embedding

## Utilities
- **moment** (2.29.1) - Date manipulation
- **moment-timezone** (0.5.43) - Timezone support
- **decimal.js** (10.4.3) - Decimal arithmetic
- **lodash.merge** (4.6.2) - Object merging
- **use-debounce** (7.0.1) - Debouncing hook
- **object-hash** (2.2.0) - Object hashing
- **flexsearch** (0.7.21) - Full-text search
- **fuse.js** (6.6.2) - Fuzzy search
- **rxjs** (7.5.6) - Reactive programming

## Drag & Drop
- **@dnd-kit/core** (6.0.8) - Drag and drop core
- **@dnd-kit/sortable** (7.0.2) - Sortable lists

## Image & Media Processing
- **sharp** (0.31.2) - Image processing
- **plaiceholder** (2.5.0) - Image placeholders
- **@plaiceholder/next** (2.5.0) - Next.js integration
- **next-sanity-image** (6.1.1) - Sanity image optimization

## Content Management
- **@sanity/client** (6.10.0) - Sanity CMS client
- **@portabletext/react** (3.0.11) - Portable text renderer
- **groq** (3.23.4) - GROQ query language
- **@notionhq/client** (2.2.3) - Notion API client

## IPFS & Storage
- **ipfs-http-client** (60.0.1) - IPFS HTTP client
- **ipfs-utils** (9.0.14) - IPFS utilities
- **multiformats** (13.0.1) - Multiformat support

## Analytics & Monitoring
- **fathom-client** (3.2.0) - Privacy-focused analytics
- **react-hotjar** (3.0.1) - Hotjar integration
- **@subsocial/grill-widget** (0.1.3) - Social features

## QR Code & Authentication
- **next-qrcode** (2.5.1) - QR code generation
- **jose** (5.2.4) - JWT/JWE/JWS implementation

## Email & Communication
- **@getbrevo/brevo** (2.0.0-beta.4) - Email service

## Development Tools
- **vitest** (0.34.6) - Unit testing framework
- **@playwright/test** (1.28.1) - E2E testing
- **prettier** (3.1.0) - Code formatter
- **prettier-plugin-tailwindcss** (0.5.7) - Tailwind formatting
- **ts-prune** (0.10.3) - Dead code detection
- **@next/bundle-analyzer** (12.3.1) - Bundle analysis
- **cross-env** (7.0.3) - Cross-platform env variables
- **dotenv** (9.0.2) - Environment variables
- **commander** (8.3.0) - CLI framework

## Build Tools
- **postcss** (8.2.13) - CSS processing
- **autoprefixer** (10.2.5) - CSS vendor prefixes
- **next-transpile-modules** (9.1.0) - Module transpilation
- **ts-node** (10.9.1) - TypeScript execution

## Testing Libraries
- **@testing-library/react** (14.0.0) - React testing utilities
- **react-test-renderer** (18.2.0) - Test renderer
- **start-server-and-test** (1.14.0) - Server/test coordination

## Misc Libraries
- **@vercel/og** (0.5.19) - OG image generation
- **next-absolute-url** (1.2.2) - URL utilities
- **font-color-contrast** (11.1.0) - Color contrast calculations
- **median-range** (0.0.11) - Statistics utility
- **toformat** (2.0.0) - Number formatting
- **ts-opaque** (3.0.1) - Opaque types
- **uri-js** (4.4.1) - URI parsing
- **react-resize-detector** (7.0.0) - Resize detection
- **react-intersection-observer** (9.4.1) - Intersection observer