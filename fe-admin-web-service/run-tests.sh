#!/bin/bash

# Frontend Test Runner Script
# This script runs various types of tests for the React frontend

set -e

echo "🧪 Running Frontend Tests"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run unit tests
run_unit_tests() {
    echo -e "\n${BLUE}📦 Running Unit Tests${NC}"
    echo "----------------------------------------"
    
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --silent
    
    echo -e "${YELLOW}Running unit and integration tests...${NC}"
    npm test
    
    echo -e "${GREEN}✅ Unit tests completed${NC}"
}

# Function to run tests with coverage
run_coverage_tests() {
    echo -e "\n${BLUE}📊 Running Tests with Coverage${NC}"
    echo "----------------------------------------"
    
    echo -e "${YELLOW}Running tests with coverage report...${NC}"
    npm run test:coverage
    
    echo -e "${YELLOW}Coverage report generated in coverage/ directory${NC}"
    echo -e "${GREEN}✅ Coverage tests completed${NC}"
}

# Function to run E2E tests
run_e2e_tests() {
    echo -e "\n${BLUE}🔗 Running End-to-End Tests${NC}"
    echo "----------------------------------------"
    
    echo -e "${YELLOW}Installing Playwright browsers...${NC}"
    npx playwright install --with-deps
    
    echo -e "${YELLOW}Building application...${NC}"
    npm run build
    
    echo -e "${YELLOW}Running E2E tests...${NC}"
    npm run test:e2e
    
    echo -e "${GREEN}✅ E2E tests completed${NC}"
}

# Function to run stress tests
run_stress_tests() {
    echo -e "\n${BLUE}⚡ Running Stress Tests${NC}"
    echo "----------------------------------------"
    
    echo -e "${YELLOW}Checking if backend services are running...${NC}"
    
    # Check if services are running
    if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${RED}❌ User service (port 3000) is not running${NC}"
        echo -e "${YELLOW}Please start backend services first:${NC}"
        echo "  cd .. && make up"
        return 1
    fi
    
    if ! curl -s http://localhost:3002/health > /dev/null 2>&1; then
        echo -e "${RED}❌ Product service (port 3002) is not running${NC}"
        echo -e "${YELLOW}Please start backend services first:${NC}"
        echo "  cd .. && make up"
        return 1
    fi
    
    if ! curl -s http://localhost:3003/health > /dev/null 2>&1; then
        echo -e "${RED}❌ Order service (port 3003) is not running${NC}"
        echo -e "${YELLOW}Please start backend services first:${NC}"
        echo "  cd .. && make up"
        return 1
    fi
    
    echo -e "${YELLOW}Running stress tests...${NC}"
    npm run test:stress
    
    echo -e "${GREEN}✅ Stress tests completed${NC}"
}

# Function to run linting
run_lint() {
    echo -e "\n${BLUE}🔍 Running Code Quality Checks${NC}"
    echo "----------------------------------------"
    
    echo -e "${YELLOW}Running ESLint...${NC}"
    npm run lint
    
    echo -e "${YELLOW}Checking Prettier formatting...${NC}"
    npm run format:check
    
    echo -e "${GREEN}✅ Code quality checks completed${NC}"
}

# Function to run all tests
run_all_tests() {
    echo -e "\n${BLUE}🚀 Running All Tests${NC}"
    echo "----------------------------------------"
    
    run_lint
    run_unit_tests
    run_coverage_tests
    run_e2e_tests
    
    echo -e "\n${GREEN}🎉 All frontend tests completed successfully!${NC}"
}

# Main execution
main() {
    local test_type=${1:-"unit"}
    
    echo -e "${BLUE}Test Type: ${test_type}${NC}"
    
    # Store the original directory
    ORIGINAL_DIR=$(pwd)
    
    case "$test_type" in
        "unit")
            run_unit_tests
            ;;
        "coverage")
            run_coverage_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "stress")
            run_stress_tests
            ;;
        "lint")
            run_lint
            ;;
        "all")
            run_all_tests
            ;;
        *)
            echo -e "${RED}❌ Unknown test type: ${test_type}${NC}"
            echo -e "${YELLOW}Available test types: unit, coverage, e2e, stress, lint, all${NC}"
            exit 1
            ;;
    esac
    
    # Return to original directory
    cd "$ORIGINAL_DIR"
}

# Help function
show_help() {
    echo "Usage: $0 [test_type]"
    echo ""
    echo "Test Types:"
    echo "  unit       Run unit and integration tests (default)"
    echo "  coverage   Run tests with coverage report"
    echo "  e2e        Run end-to-end tests"
    echo "  stress     Run stress/load tests (requires backend services)"
    echo "  lint       Run code quality checks (ESLint + Prettier)"
    echo "  all        Run all tests (except stress tests)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run unit tests"
    echo "  $0 coverage          # Run tests with coverage"
    echo "  $0 e2e               # Run E2E tests"
    echo "  $0 stress            # Run stress tests"
    echo "  $0 all               # Run all tests"
    echo ""
    echo "Prerequisites:"
    echo "  - Node.js 18+ installed"
    echo "  - npm dependencies installed (npm install)"
    echo "  - For stress tests: backend services running (make up)"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
