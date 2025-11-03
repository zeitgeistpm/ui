#!/bin/bash

# Portfolio Page Performance Optimization Migration Script
# This script automates the migration to the optimized portfolio implementation

set -e # Exit on error

echo "=========================================="
echo "Portfolio Page Performance Migration"
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

echo -e "${YELLOW}Starting migration process...${NC}"
echo ""

# Step 1: Create backups
echo "Step 1: Creating backups..."
if [ -f "pages/portfolio/[address].tsx" ]; then
    cp pages/portfolio/[address].tsx pages/portfolio/[address].backup.tsx
    echo -e "${GREEN}✓ Backed up [address].tsx${NC}"
fi

if [ -f "components/portfolio/PredictionsTabGroup.tsx" ]; then
    cp components/portfolio/PredictionsTabGroup.tsx components/portfolio/PredictionsTabGroup.backup.tsx
    echo -e "${GREEN}✓ Backed up PredictionsTabGroup.tsx${NC}"
fi

if [ -f "components/portfolio/CreatedMarketsTabGroup.tsx" ]; then
    cp components/portfolio/CreatedMarketsTabGroup.tsx components/portfolio/CreatedMarketsTabGroup.backup.tsx
    echo -e "${GREEN}✓ Backed up CreatedMarketsTabGroup.tsx${NC}"
fi

echo ""

# Step 2: Apply optimized versions
echo "Step 2: Applying optimized versions..."

# Check if optimized files exist
if [ ! -f "pages/portfolio/[address].new.tsx" ]; then
    echo -e "${RED}Error: Optimized portfolio page not found at pages/portfolio/[address].new.tsx${NC}"
    echo "Please ensure all optimized files have been created before running this script."
    exit 1
fi

# Apply portfolio page
mv pages/portfolio/[address].new.tsx pages/portfolio/[address].tsx
echo -e "${GREEN}✓ Applied optimized portfolio page${NC}"

# Apply PredictionsTabGroup if exists
if [ -f "components/portfolio/PredictionsTabGroup.optimized.tsx" ]; then
    mv components/portfolio/PredictionsTabGroup.optimized.tsx components/portfolio/PredictionsTabGroup.tsx
    echo -e "${GREEN}✓ Applied optimized PredictionsTabGroup${NC}"
fi

# Apply CreatedMarketsTabGroup if exists
if [ -f "components/portfolio/CreatedMarketsTabGroup.optimized.tsx" ]; then
    mv components/portfolio/CreatedMarketsTabGroup.optimized.tsx components/portfolio/CreatedMarketsTabGroup.tsx
    echo -e "${GREEN}✓ Applied optimized CreatedMarketsTabGroup${NC}"
fi

echo ""

# Step 3: Check for dependencies
echo "Step 3: Checking dependencies..."
if grep -q "react-intersection-observer" package.json; then
    echo -e "${GREEN}✓ react-intersection-observer already installed${NC}"
else
    echo -e "${YELLOW}Installing react-intersection-observer...${NC}"
    yarn add react-intersection-observer
    echo -e "${GREEN}✓ Installed react-intersection-observer${NC}"
fi

echo ""

# Step 4: Verify new hooks exist
echo "Step 4: Verifying new hooks..."
HOOKS_DIR="lib/hooks/queries/portfolio"
REQUIRED_HOOKS=(
    "usePortfolioCore.ts"
    "usePositionPrices.ts"
    "usePositionPnL.ts"
    "usePortfolioSummary.ts"
    "usePortfolioTabs.ts"
    "queryConfig.ts"
    "index.ts"
)

ALL_HOOKS_PRESENT=true
for hook in "${REQUIRED_HOOKS[@]}"; do
    if [ -f "$HOOKS_DIR/$hook" ]; then
        echo -e "${GREEN}✓ $hook present${NC}"
    else
        echo -e "${RED}✗ $hook missing${NC}"
        ALL_HOOKS_PRESENT=false
    fi
done

if [ "$ALL_HOOKS_PRESENT" = false ]; then
    echo ""
    echo -e "${RED}Error: Not all required hook files are present.${NC}"
    echo "Please ensure all hook files have been created before proceeding."
    exit 1
fi

echo ""

# Step 5: Build check
echo "Step 5: Running build check..."
echo -e "${YELLOW}Running TypeScript check...${NC}"
yarn tsc --noEmit || {
    echo -e "${RED}TypeScript check failed!${NC}"
    echo "Please fix any type errors before proceeding."
    echo ""
    echo "To rollback:"
    echo "  ./scripts/rollback-portfolio.sh"
    exit 1
}
echo -e "${GREEN}✓ TypeScript check passed${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}Migration completed successfully!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run 'yarn dev' to test the changes locally"
echo "2. Test all portfolio tabs thoroughly"
echo "3. Check performance improvements in DevTools"
echo ""
echo "To rollback if needed:"
echo "  ./scripts/rollback-portfolio.sh"
echo ""
echo -e "${YELLOW}Note: Old hook file (usePortfolioPositions.ts) has been preserved.${NC}"
echo "You can safely remove it after confirming everything works."