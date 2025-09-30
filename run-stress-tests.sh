#!/bin/bash

# Backend Stress Test Runner Script
# This script runs stress tests for all backend services

set -e

echo "🚀 Backend Stress Test Runner"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to check if services are running
check_services() {
    echo -e "\n${BLUE}🔍 Checking if services are running...${NC}"
    
    services=("3000:User Service" "3002:Product Service" "3003:Order Service" "8080:API Gateway" "5672:RabbitMQ")
    all_running=true
    
    for service in "${services[@]}"; do
        port=$(echo $service | cut -d: -f1)
        name=$(echo $service | cut -d: -f2)
        
        if nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}✅ $name (port $port) is running${NC}"
        else
            echo -e "${RED}❌ $name (port $port) is not running${NC}"
            all_running=false
        fi
    done
    
    if [ "$all_running" = false ]; then
        echo -e "\n${RED}❌ Some services are not running. Please start them with:${NC}"
        echo -e "${YELLOW}make up${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All services are running!${NC}"
}

# Function to run API Gateway stress test
run_api_gateway_test() {
    echo -e "\n${PURPLE}🌐 Running API Gateway Stress Test${NC}"
    echo "----------------------------------------"
    
    if [ -f "stress-tests/api-gateway-load-test.yml" ]; then
        npx artillery run stress-tests/api-gateway-load-test.yml --output api-gateway-results.json
        echo -e "${GREEN}✅ API Gateway stress test completed${NC}"
        
        # Generate report
        if [ -f "api-gateway-results.json" ]; then
            npx artillery report api-gateway-results.json --output api-gateway-report.html
            echo -e "${YELLOW}📊 Report saved to: api-gateway-report.html${NC}"
        fi
    else
        echo -e "${RED}❌ API Gateway test config not found${NC}"
    fi
}

# Function to run User Service stress test
run_user_service_test() {
    echo -e "\n${PURPLE}👤 Running User Service Stress Test${NC}"
    echo "----------------------------------------"
    
    if [ -f "stress-tests/user-service-load-test.yml" ]; then
        npx artillery run stress-tests/user-service-load-test.yml --output user-service-results.json
        echo -e "${GREEN}✅ User Service stress test completed${NC}"
        
        # Generate report
        if [ -f "user-service-results.json" ]; then
            npx artillery report user-service-results.json --output user-service-report.html
            echo -e "${YELLOW}📊 Report saved to: user-service-report.html${NC}"
        fi
    else
        echo -e "${RED}❌ User Service test config not found${NC}"
    fi
}

# Function to run Product Service stress test
run_product_service_test() {
    echo -e "\n${PURPLE}📦 Running Product Service Stress Test${NC}"
    echo "----------------------------------------"
    
    if [ -f "stress-tests/product-service-load-test.yml" ]; then
        npx artillery run stress-tests/product-service-load-test.yml --output product-service-results.json
        echo -e "${GREEN}✅ Product Service stress test completed${NC}"
        
        # Generate report
        if [ -f "product-service-results.json" ]; then
            npx artillery report product-service-results.json --output product-service-report.html
            echo -e "${YELLOW}📊 Report saved to: product-service-report.html${NC}"
        fi
    else
        echo -e "${RED}❌ Product Service test config not found${NC}"
    fi
}

# Function to run Order Service stress test
run_order_service_test() {
    echo -e "\n${PURPLE}🛒 Running Order Service Stress Test${NC}"
    echo "----------------------------------------"
    
    if [ -f "stress-tests/order-service-load-test.yml" ]; then
        npx artillery run stress-tests/order-service-load-test.yml --output order-service-results.json
        echo -e "${GREEN}✅ Order Service stress test completed${NC}"
        
        # Generate report
        if [ -f "order-service-results.json" ]; then
            npx artillery report order-service-results.json --output order-service-report.html
            echo -e "${YELLOW}📊 Report saved to: order-service-report.html${NC}"
        fi
    else
        echo -e "${RED}❌ Order Service test config not found${NC}"
    fi
}

# Function to run RabbitMQ stress test
run_rabbitmq_test() {
    echo -e "\n${PURPLE}🐰 Running RabbitMQ Message Queue Stress Test${NC}"
    echo "----------------------------------------"
    
    if [ -f "stress-tests/rabbitmq-load-test.yml" ]; then
        npx artillery run stress-tests/rabbitmq-load-test.yml --output rabbitmq-results.json
        echo -e "${GREEN}✅ RabbitMQ stress test completed${NC}"
        
        # Generate report
        if [ -f "rabbitmq-results.json" ]; then
            npx artillery report rabbitmq-results.json --output rabbitmq-report.html
            echo -e "${YELLOW}📊 Report saved to: rabbitmq-report.html${NC}"
        fi
    else
        echo -e "${RED}❌ RabbitMQ test config not found${NC}"
    fi
}

# Function to run all tests
run_all_tests() {
    echo -e "\n${BLUE}🚀 Running ALL Backend Stress Tests${NC}"
    echo "======================================="
    
    run_api_gateway_test
    sleep 5
    run_user_service_test
    sleep 5
    run_product_service_test
    sleep 5
    run_order_service_test
    sleep 5
    run_rabbitmq_test
    
    echo -e "\n${GREEN}🎉 All stress tests completed!${NC}"
    echo -e "${YELLOW}📊 Check the generated HTML reports for detailed results${NC}"
}

# Function to show help
show_help() {
    echo "Backend Stress Test Runner"
    echo ""
    echo "Usage: $0 [test_type]"
    echo ""
    echo "Test types:"
    echo "  api-gateway    Run API Gateway stress test"
    echo "  user-service   Run User Service stress test"
    echo "  product-service Run Product Service stress test"
    echo "  order-service  Run Order Service stress test"
    echo "  rabbitmq       Run RabbitMQ message queue stress test"
    echo "  all            Run all stress tests (default)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 all               # Run all tests"
    echo "  $0 api-gateway       # Run API Gateway test only"
    echo "  $0 rabbitmq          # Run RabbitMQ test only"
    echo ""
    echo "Prerequisites:"
    echo "  - All services running (make up)"
    echo "  - Artillery installed (npm install -g artillery)"
    echo "  - netcat installed (for service checks)"
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Main execution
test_type=${1:-all}

# Check if services are running
check_services

# Install Artillery globally if not present
if ! command -v artillery &> /dev/null; then
    echo -e "${YELLOW}⚠️  Artillery not found globally. Installing...${NC}"
    npm install -g artillery
fi

# Run the specified test
case $test_type in
    "api-gateway")
        run_api_gateway_test
        ;;
    "user-service")
        run_user_service_test
        ;;
    "product-service")
        run_product_service_test
        ;;
    "order-service")
        run_order_service_test
        ;;
    "rabbitmq")
        run_rabbitmq_test
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo -e "${RED}❌ Unknown test type: ${test_type}${NC}"
        echo -e "${YELLOW}Available test types: api-gateway, user-service, product-service, order-service, rabbitmq, all${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✅ Stress testing completed!${NC}"
