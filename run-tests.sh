#!/bin/bash

# Test Runner Script for All Services
# This script runs tests for all backend services

set -e

echo "🧪 Running Tests for All Backend Services"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run tests for a service
run_service_tests() {
    local service_name=$1
    local service_path=$2
    
    echo -e "\n${BLUE}📦 Testing ${service_name}${NC}"
    echo "----------------------------------------"
    
    if [ -d "$service_path" ]; then
        cd "$service_path"
        
        # Check if package.json exists
        if [ -f "package.json" ]; then
            echo -e "${YELLOW}Installing dependencies...${NC}"
            npm install --silent
            
            echo -e "${YELLOW}Running unit tests...${NC}"
            npm test
            
            echo -e "${GREEN}✅ ${service_name} tests completed${NC}"
        else
            echo -e "${RED}❌ No package.json found in ${service_path}${NC}"
            return 1
        fi
        
        cd - > /dev/null
    else
        echo -e "${RED}❌ Service directory ${service_path} not found${NC}"
        return 1
    fi
}

# Function to run tests with coverage
run_coverage_tests() {
    local service_name=$1
    local service_path=$2
    
    echo -e "\n${BLUE}📊 Running Coverage Tests for ${service_name}${NC}"
    echo "----------------------------------------"
    
    if [ -d "$service_path" ]; then
        cd "$service_path"
        
        if [ -f "package.json" ]; then
            echo -e "${YELLOW}Running tests with coverage...${NC}"
            npm run test:coverage
            
            echo -e "${GREEN}✅ ${service_name} coverage completed${NC}"
        else
            echo -e "${RED}❌ No package.json found in ${service_path}${NC}"
            return 1
        fi
        
        cd - > /dev/null
    else
        echo -e "${RED}❌ Service directory ${service_path} not found${NC}"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    local service_name=$1
    local service_path=$2
    
    echo -e "\n${BLUE}🔗 Running Integration Tests for ${service_name}${NC}"
    echo "----------------------------------------"
    
    if [ -d "$service_path" ]; then
        cd "$service_path"
        
        if [ -f "package.json" ]; then
            echo -e "${YELLOW}Running integration tests...${NC}"
            npm run test:integration
            
            echo -e "${GREEN}✅ ${service_name} integration tests completed${NC}"
        else
            echo -e "${RED}❌ No package.json found in ${service_path}${NC}"
            return 1
        fi
        
        cd - > /dev/null
    else
        echo -e "${RED}❌ Service directory ${service_path} not found${NC}"
        return 1
    fi
}

# Main execution
main() {
    local test_type=${1:-"unit"}
    local service=${2:-"all"}
    
    echo -e "${BLUE}Test Type: ${test_type}${NC}"
    echo -e "${BLUE}Service: ${service}${NC}"
    
    # Store the original directory
    ORIGINAL_DIR=$(pwd)
    
    # Run tests based on parameters
    if [ "$service" = "all" ]; then
        # Test all services
        for service_name in "user-service" "product-service" "order-service"; do
            service_path="./$service_name"
            
            if [ "$test_type" = "coverage" ]; then
                run_coverage_tests "$service_name" "$service_path"
            elif [ "$test_type" = "integration" ]; then
                run_integration_tests "$service_name" "$service_path"
            else
                run_service_tests "$service_name" "$service_path"
            fi
        done
    else
        # Test specific service
        case "$service" in
            "user-service")
                service_path="./user-service"
                ;;
            "product-service")
                service_path="./product-service"
                ;;
            "order-service")
                service_path="./order-service"
                ;;
            *)
                echo -e "${RED}❌ Unknown service: ${service}${NC}"
                echo -e "${YELLOW}Available services: user-service, product-service, order-service${NC}"
                exit 1
                ;;
        esac
        
        if [ "$test_type" = "coverage" ]; then
            run_coverage_tests "$service" "$service_path"
        elif [ "$test_type" = "integration" ]; then
            run_integration_tests "$service" "$service_path"
        else
            run_service_tests "$service" "$service_path"
        fi
    fi
    
    # Return to original directory
    cd "$ORIGINAL_DIR"
    
    echo -e "\n${GREEN}🎉 All tests completed successfully!${NC}"
}

# Help function
show_help() {
    echo "Usage: $0 [test_type] [service]"
    echo ""
    echo "Test Types:"
    echo "  unit       Run unit tests (default)"
    echo "  coverage   Run tests with coverage"
    echo "  integration Run integration tests"
    echo ""
    echo "Services:"
    echo "  all              Test all services (default)"
    echo "  user-service     Test user service only"
    echo "  product-service  Test product service only"
    echo "  order-service    Test order service only"
    echo ""
    echo "Examples:"
    echo "  $0                           # Run unit tests for all services"
    echo "  $0 coverage                  # Run coverage tests for all services"
    echo "  $0 unit user-service         # Run unit tests for user service only"
    echo "  $0 coverage product-service  # Run coverage tests for product service only"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
