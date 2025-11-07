# Code Style and Conventions for Zeitgeist UI

## Language & Framework
- **TypeScript** with strict type checking (tsconfig.json)
- **React 18** with functional components and hooks
- **Next.js 13.4** with file-based routing

## File Naming Conventions
- **Components**: PascalCase (e.g., `MarketCard.tsx`, `PortfolioHeader.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useMarket.ts`, `useWallet.tsx`)
- **Utilities**: camelCase (e.g., `formatBalance.ts`, `calculateOdds.ts`)
- **Pages**: lowercase with dashes for routes (e.g., `market-details.tsx`)
- **Directories**: lowercase with dashes (e.g., `market-card`, `trade-form`)

## Component Structure
- Use named exports for components (not default exports)
- Define TypeScript interfaces for props
- Place interfaces/types at the top of the file
- Functional components with arrow functions or function declarations

## State Management
- **Jotai** atoms for global state (in `/lib/state/`)
- **TanStack Query** for server state and caching
- **React hooks** for local component state
- Avoid prop drilling - use context or atoms for shared state

## Styling
- **Tailwind CSS** for styling with utility classes
- Mobile-first responsive design
- Use Tailwind config for consistent theming
- Avoid inline styles unless dynamic
- CSS modules in `/styles/` for complex styles

## Import Order
1. External libraries (React, Next.js, etc.)
2. Internal aliases/paths
3. Components
4. Hooks
5. Utilities/helpers
6. Types/interfaces
7. Styles

## TypeScript Practices
- Explicit type annotations for function parameters and returns
- Use interfaces for object shapes, types for unions/primitives
- Avoid `any` type - use `unknown` if type is truly unknown
- Leverage type inference where obvious

## Testing
- Unit tests alongside components (`.test.ts`, `.spec.ts`)
- E2E tests in `/e2e/` directory
- Test file naming: `ComponentName.test.tsx`
- Use Vitest for unit tests, Playwright for E2E

## Code Formatting
- **Prettier** for automatic formatting
- 2 spaces for indentation
- Single quotes for strings
- No semicolons (configured in .prettierrc.js)
- Max line length handled by Prettier

## Git Commit Messages
- Use conventional commits when possible
- Format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep messages concise and descriptive

## Best Practices
- Keep components small and focused (single responsibility)
- Extract reusable logic into custom hooks
- Use proper loading and error states
- Handle edge cases and null/undefined values
- Memoize expensive computations with useMemo/useCallback
- Follow React best practices (Rules of Hooks, etc.)

## Directory Organization
- `/components/` - Organized by feature (markets/, portfolio/, etc.)
- `/lib/hooks/` - Custom React hooks
- `/lib/state/` - Jotai atoms and global state
- `/lib/util/` - Utility functions and helpers
- `/lib/gql/` - GraphQL queries and operations
- `/lib/constants/` - Application constants
- `/lib/types/` - Shared TypeScript types

## Comments & Documentation
- Use JSDoc comments for complex functions
- Inline comments for non-obvious logic
- Keep comments concise and relevant
- Update comments when code changes
- Document component props with TypeScript interfaces