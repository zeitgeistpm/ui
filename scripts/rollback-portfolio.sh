#!/bin/bash

# Portfolio Page Performance Optimization Rollback Script
# This script rolls back the portfolio optimization changes

set -e # Exit on error

echo "=========================================="
echo "Portfolio Page Optimization Rollback"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "pages/portfolio" ]; then
    echo -e "${RED}Error: Please run this script from the zeitgeist-ui root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting rollback process...${NC}"
echo ""

# Check if backups exist
BACKUPS_EXIST=true
if [ ! -f "pages/portfolio/[address].backup.tsx" ]; then
    echo -e "${RED}Warning: No backup found for [address].tsx${NC}"
    BACKUPS_EXIST=false
fi

if [ "$BACKUPS_EXIST" = false ]; then
    echo -e "${RED}Cannot proceed with rollback - backup files not found${NC}"
    echo "The migration may not have been run, or backups may have been deleted."
    exit 1
fi

# Confirm rollback
echo -e "${YELLOW}This will restore the original portfolio implementation.${NC}"
read -p "Are you sure you want to rollback? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled."
    exit 0
fi

echo ""

# Step 1: Restore portfolio page
echo "Step 1: Restoring portfolio page..."
if [ -f "pages/portfolio/[address].backup.tsx" ]; then
    mv pages/portfolio/[address].backup.tsx pages/portfolio/[address].tsx
    echo -e "${GREEN}✓ Restored [address].tsx${NC}"
fi

# Step 2: Restore PredictionsTabGroup
echo "Step 2: Restoring PredictionsTabGroup..."
if [ -f "components/portfolio/PredictionsTabGroup.backup.tsx" ]; then
    mv components/portfolio/PredictionsTabGroup.backup.tsx components/portfolio/PredictionsTabGroup.tsx
    echo -e "${GREEN}✓ Restored PredictionsTabGroup.tsx${NC}"
fi

# Step 3: Restore CreatedMarketsTabGroup
echo "Step 3: Restoring CreatedMarketsTabGroup..."
if [ -f "components/portfolio/CreatedMarketsTabGroup.backup.tsx" ]; then
    mv components/portfolio/CreatedMarketsTabGroup.backup.tsx components/portfolio/CreatedMarketsTabGroup.tsx
    echo -e "${GREEN}✓ Restored CreatedMarketsTabGroup.tsx${NC}"
fi

echo ""

# Step 4: Clean up optimized files if they exist
echo "Step 4: Cleaning up optimization files..."
CLEANUP_FILES=(
    "pages/portfolio/[address].optimized.tsx"
    "components/portfolio/PredictionsTabGroup.optimized.tsx"
    "components/portfolio/CreatedMarketsTabGroup.optimized.tsx"
)

for file in "${CLEANUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo -e "${GREEN}✓ Removed $file${NC}"
    fi
done

echo ""

# Step 5: Note about new hooks
echo -e "${YELLOW}Note: New hook files in lib/hooks/queries/portfolio/ have been preserved.${NC}"
echo "These files are not being used after rollback and can be safely removed if desired:"
echo "  - lib/hooks/queries/portfolio/usePortfolioCore.ts"
echo "  - lib/hooks/queries/portfolio/usePositionPrices.ts"
echo "  - lib/hooks/queries/portfolio/usePositionPnL.ts"
echo "  - lib/hooks/queries/portfolio/usePortfolioSummary.ts"
echo "  - lib/hooks/queries/portfolio/usePortfolioTabs.ts"
echo "  - lib/hooks/queries/portfolio/queryConfig.ts"
echo "  - lib/hooks/queries/portfolio/index.ts"
echo ""

# Step 6: Build check
echo "Step 6: Running build check..."
echo -e "${YELLOW}Running TypeScript check...${NC}"
yarn tsc --noEmit || {
    echo -e "${YELLOW}Warning: TypeScript check failed${NC}"
    echo "This might be expected if there were other changes."
    echo "Please review and fix any type errors."
}

echo ""
echo "=========================================="
echo -e "${GREEN}Rollback completed successfully!${NC}"
echo "=========================================="
echo ""
echo "The portfolio page has been restored to its original implementation."
echo "Please run 'yarn dev' to verify everything is working correctly."