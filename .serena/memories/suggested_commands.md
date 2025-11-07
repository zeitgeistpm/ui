# Suggested Commands for Zeitgeist UI Development

## Development Server
- `yarn dev` - Start development server with staging environment
- `yarn dev:prod` - Start development server with production environment

## Building
- `yarn build` - Build for production
- `yarn build:staging` - Build for staging environment
- `yarn build:prod` - Build for production environment
- `yarn start` - Start production server after build

## Code Quality & Formatting
- `yarn prettier:check` - Check code formatting for .tsx files
- `yarn prettier:fix` - Auto-fix code formatting for .tsx files
- `yarn prunable` - Find unused exports (dead code detection)

## Testing
- `yarn test` - Run unit tests once with Vitest
- `yarn test:watch` - Run unit tests in watch mode with Vitest
- `npx playwright test` - Run E2E tests with Playwright

## Bundle Analysis
- `yarn analyze` - Analyze bundle size
- `yarn analyze:server` - Analyze server bundle
- `yarn analyze:browser` - Analyze browser bundle

## Git Commands (Darwin/macOS)
- `git status` - Check current branch and changes
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit staged changes
- `git push` - Push to remote repository
- `git pull` - Pull latest changes

## File System Commands (Darwin/macOS)
- `ls -la` - List all files with details
- `cd <directory>` - Change directory
- `pwd` - Print working directory
- `mkdir <name>` - Create directory
- `rm -rf <path>` - Remove files/directories
- `find . -name "*.tsx"` - Find files by pattern
- `grep -r "pattern" .` - Search for text in files

## Package Management (Yarn)
- `yarn install` - Install dependencies
- `yarn add <package>` - Add new dependency
- `yarn add -D <package>` - Add dev dependency
- `yarn remove <package>` - Remove dependency

## Environment Setup
- Copy `.env.example` to `.env.local` for local development
- Environment files: `.env.development`, `.env.production`, `.env.local`

## Common Workflows
1. Before committing: `yarn prettier:check` → `yarn test`
2. Check bundle size: `yarn analyze`
3. Find unused code: `yarn prunable`
4. Full test suite: `yarn test && npx playwright test`