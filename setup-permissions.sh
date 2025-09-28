#!/bin/bash

# Setup Permissions Script
# This script ensures all .sh files have proper execute permissions

set -e

echo "🔧 Setting up file permissions..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find and set permissions for all .sh files
echo -e "${YELLOW}Setting execute permissions for .sh files...${NC}"

# Main directory .sh files
for file in *.sh; do
    if [ -f "$file" ]; then
        chmod +x "$file"
        echo -e "${GREEN}✅ $file${NC}"
    fi
done

# Check subdirectories for .sh files
find . -name "*.sh" -type f -exec chmod +x {} \;

echo ""
echo -e "${YELLOW}Verifying permissions...${NC}"

# List all .sh files with their permissions
find . -name "*.sh" -type f -exec ls -la {} \; | while read line; do
    echo -e "${GREEN}$line${NC}"
done

echo ""
echo -e "${GREEN}🎉 All permissions set successfully!${NC}"
