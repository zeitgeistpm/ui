# Task Completion Checklist

When completing any coding task in the Zeitgeist UI project, follow these steps:

## Before Committing Code

### 1. Code Formatting
Run Prettier to ensure consistent code formatting:
```bash
yarn prettier:check
```
If there are formatting issues, fix them:
```bash
yarn prettier:fix
```

### 2. Type Checking
Ensure TypeScript compilation succeeds:
```bash
yarn build
```

### 3. Testing
Run the test suite to ensure no regressions:
```bash
yarn test
```

For comprehensive testing including E2E:
```bash
yarn test && npx playwright test
```

### 4. Dead Code Check (Optional)
Check for unused exports:
```bash
yarn prunable
```

### 5. Bundle Size (For Major Changes)
If you've added new dependencies or significant code:
```bash
yarn analyze
```

## Code Review Checklist

Before marking a task as complete, verify:

- [ ] All TypeScript types are properly defined (no `any` types)
- [ ] Components follow the project's naming conventions
- [ ] New features have appropriate loading and error states
- [ ] Complex logic is extracted into custom hooks
- [ ] State management follows project patterns (Jotai/TanStack Query)
- [ ] Tailwind classes are used for styling
- [ ] Mobile responsiveness is maintained
- [ ] No console.log statements left in code
- [ ] Imports are properly organized
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Edge cases are handled (null/undefined checks)
- [ ] Performance considerations (memoization where needed)

## Documentation Updates

If your changes affect:
- Public APIs or component interfaces - update TypeScript interfaces
- User-facing features - consider updating relevant documentation
- Configuration - update .env.example if needed

## Final Steps

1. Review your changes with `git diff`
2. Ensure all files are properly saved
3. Stage and commit with descriptive message
4. Push changes to appropriate branch

## Common Issues to Check

- **Import paths**: Ensure imports use correct relative paths
- **Environment variables**: Verify correct usage of NEXT_PUBLIC_ prefix
- **Async operations**: Proper error handling with try/catch
- **React hooks**: Following Rules of Hooks
- **Key props**: Lists have proper key props
- **Memory leaks**: Cleanup in useEffect when needed