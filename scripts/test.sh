#!/bin/bash

# Microservices E-Commerce Testing Script
echo "🧪 Testing Microservices E-Commerce Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API endpoints
USER_SERVICE_URL="http://localhost:8081"
INVENTORY_SERVICE_URL="http://localhost:8082"
API_GATEWAY_URL="http://localhost:8080"

# Global variables
USER_TOKEN=""
PRODUCT_ID=""

# Helper function to make HTTP requests
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local headers=$4

    if [ -n "$headers" ]; then
        if [ -n "$data" ]; then
            curl -s -X $method \
                -H "Content-Type: application/json" \
                -H "$headers" \
                -d "$data" \
                "$url"
        else
            curl -s -X $method \
                -H "Content-Type: application/json" \
                -H "$headers" \
                "$url"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X $method \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$url"
        else
            curl -s -X $method \
                -H "Content-Type: application/json" \
                "$url"
        fi
    fi
}

# Check if services are running
check_services() {
    echo -e "${BLUE}🔍 Checking service health...${NC}"

    # Check User Service
    response=$(curl -s -o /dev/null -w "%{http_code}" $USER_SERVICE_URL/actuator/health 2>/dev/null || echo "000")
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ User Service is running${NC}"
    else
        echo -e "${RED}❌ User Service is not accessible${NC}"
        return 1
    fi

    # Check Inventory Service
    response=$(curl -s -o /dev/null -w "%{http_code}" $INVENTORY_SERVICE_URL/health 2>/dev/null || echo "000")
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Inventory Service is running${NC}"
    else
        echo -e "${RED}❌ Inventory Service is not accessible${NC}"
        return 1
    fi

    echo ""
}

# Test User Service
test_user_service() {
    echo -e "${BLUE}👤 Testing User Service...${NC}"

    # Test user registration
    echo -e "${YELLOW}📝 Testing user registration...${NC}"
    register_data='{
        "email": "testuser@example.com",
        "password": "password123",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890",
        "address": "123 Test Street, Test City"
    }'

    response=$(make_request "POST" "$USER_SERVICE_URL/api/users/register" "$register_data")
    echo "$response" | jq '.'

    if echo "$response" | jq -r '.success' | grep -q "true"; then
        echo -e "${GREEN}✅ User registration successful${NC}"
    else
        echo -e "${RED}❌ User registration failed${NC}"
    fi

    # Test user login
    echo -e "${YELLOW}🔐 Testing user login...${NC}"
    login_data='{
        "email": "testuser@example.com",
        "password": "password123"
    }'

    response=$(make_request "POST" "$USER_SERVICE_URL/api/users/login" "$login_data")
    echo "$response" | jq '.'

    if echo "$response" | jq -r '.success' | grep -q "true"; then
        echo -e "${GREEN}✅ User login successful${NC}"
        USER_TOKEN=$(echo "$response" | jq -r '.token')
        echo -e "${BLUE}🎫 Token saved for future requests${NC}"
    else
        echo -e "${RED}❌ User login failed${NC}"
        return 1
    fi

    # Test get user profile
    echo -e "${YELLOW}👤 Testing get user profile...${NC}"
    response=$(make_request "GET" "$USER_SERVICE_URL/api/users/profile" "" "Authorization: Bearer $USER_TOKEN")
    echo "$response" | jq '.'

    if echo "$response" | jq -r '.success' | grep -q "true"; then
        echo -e "${GREEN}✅ Get user profile successful${NC}"
    else
        echo -e "${RED}❌ Get user profile failed${NC}"
    fi

    echo ""
}

# Test Inventory Service
test_inventory_service() {
    echo -e "${BLUE}📦 Testing Inventory Service...${NC}"

    # Test create product
    echo -e "${YELLOW}➕ Testing product creation...${NC}"
    product_data='{
        "name": "Test Laptop",
        "description": "A high-performance laptop for testing purposes",
        "price": 999.99,
        "category": "Electronics",
        "stockQuantity": 50,
        "specifications": {
            "brand": "TestBrand",
            "model": "TB-2024",
            "color": "Silver",
            "weight": 2.5
        },
        "images": ["https://example.com/laptop.jpg"],
        "tags": ["laptop", "electronics", "computer"]
    }'

    response=$(make_request "POST" "$INVENTORY_SERVICE_URL/api/products" "$product_data")
    echo "$response" | jq '.'

    if echo "$response" | jq -r '.success' | grep -q "true"; then
        echo -e "${GREEN}✅ Product creation successful${NC}"
        PRODUCT_ID=$(echo "$response" | jq -r '.data.product._id')
        echo -e "${BLUE}📦 Product ID saved: $PRODUCT_ID${NC}"
    else
        echo -e "${RED}❌ Product creation failed${NC}"
        return 1
    fi

    # Test get all products
    echo -e "${YELLOW}📋 Testing get all products...${NC}"
    response=$(make_request "GET" "$INVENTORY_SERVICE_URL/api/products")
    echo "$response" | jq '.'

    if echo "$response" | jq -r '.success' | grep -q "true"; then
        echo -e "${GREEN}✅ Get all products successful${NC}"
    else
        echo -e "${RED}❌ Get all products failed${NC}"
    fi

    # Test get single product
    echo -e "${YELLOW}🔍 Testing get single product...${NC}"
    response=$(make_request "GET" "$INVENTORY_SERVICE_URL/api/products/$PRODUCT_ID")
    echo "$response" | jq '.'

    if echo "$response" | jq -r '.success' | grep -q "true"; then
        echo -e "${GREEN}✅ Get single product successful${NC}"
    else
        echo -e "${RED}❌ Get single product failed${NC}"
    fi

    # Test update stock
    echo -e "${YELLOW}📊 Testing stock update...${NC}"
    stock_data='{"stockQuantity": 75}'
    response=$(make_request "PUT" "$INVENTORY_SERVICE_URL/api/products/$PRODUCT_ID/stock" "$stock_data")
    echo "$response" | jq '.'

    if echo "$response" | jq -r '.success' | grep -q "true"; then
        echo -e "${GREEN}✅ Stock update successful${NC}"
    else
        echo -e "${RED}❌ Stock update failed${NC}"
    fi

    echo ""
}

# Test product filtering and search
test_product_filtering() {
    echo -e "${BLUE}🔍 Testing Product Filtering and Search...${NC}"

    # Test category filtering
    echo -e "${YELLOW}📂 Testing category filtering...${NC}"
    response=$(make_request "GET" "$INVENTORY_SERVICE_URL/api/products?category=Electronics")
    echo "$response" | jq '.'

    # Test search functionality
    echo -e "${YELLOW}🔎 Testing search functionality...${NC}"
    response=$(make_request "GET" "$INVENTORY_SERVICE_URL/api/products?search=laptop")
    echo "$response" | jq '.'

    # Test price range filtering
    echo -e "${YELLOW}💰 Testing price range filtering...${NC}"
    response=$(make_request "GET" "$INVENTORY_SERVICE_URL/api/products?minPrice=500&maxPrice=1500")
    echo "$response" | jq '.'

    echo ""
}

# Test pagination
test_pagination() {
    echo -e "${BLUE}📄 Testing Pagination...${NC}"

    echo -e "${YELLOW}📃 Testing pagination (page 1, limit 5)...${NC}"
    response=$(make_request "GET" "$INVENTORY_SERVICE_URL/api/products?page=1&limit=5")
    echo "$response" | jq '.'

    echo ""
}

# Create sample data
create_sample_data() {
    echo -e "${BLUE}🎭 Creating sample data...${NC}"

    # Create multiple products
    products=(
        '{"name":"Gaming Laptop","description":"High-end gaming laptop","price":1599.99,"category":"Electronics","stockQuantity":25,"tags":["gaming","laptop"]}'
        '{"name":"Running Shoes","description":"Comfortable running shoes","price":129.99,"category":"Sports","stockQuantity":100,"tags":["shoes","running","sports"]}'
        '{"name":"Programming Book","description":"Learn to code like a pro","price":49.99,"category":"Books","stockQuantity":75,"tags":["book","programming","education"]}'
        '{"name":"Coffee Mug","description":"Keep your coffee hot","price":19.99,"category":"Home","stockQuantity":200,"tags":["mug","coffee","kitchen"]}'
    )

    for product in "${products[@]}"; do
        response=$(make_request "POST" "$INVENTORY_SERVICE_URL/api/products" "$product")
        if echo "$response" | jq -r '.success' | grep -q "true"; then
            product_name=$(echo "$product" | jq -r '.name')
            echo -e "${GREEN}✅ Created product: $product_name${NC}"
        else
            echo -e "${RED}❌ Failed to create product${NC}"
        fi
    done

    echo ""
}

# Run load test
run_load_test() {
    echo -e "${BLUE}⚡ Running basic load test...${NC}"

    echo -e "${YELLOW}🔄 Making 10 concurrent requests to get products...${NC}"

    for i in {1..10}; do
        (
            response=$(make_request "GET" "$INVENTORY_SERVICE_URL/api/products")
            if echo "$response" | jq -r '.success' | grep -q "true"; then
                echo -e "${GREEN}✅ Request $i successful${NC}"
            else
                echo -e "${RED}❌ Request $i failed${NC}"
            fi
        ) &
    done

    wait
    echo -e "${GREEN}✅ Load test completed${NC}"
    echo ""
}

# Main test execution
main() {
    echo "🚀 Starting comprehensive testing..."
    echo "======================================"

    # Check if jq is installed
    if ! command -v jq &>/dev/null; then
        echo -e "${RED}❌ jq is not installed. Please install jq to run tests.${NC}"
        echo "Install with: sudo apt install jq (Ubuntu/Debian) or brew install jq (macOS)"
        exit 1
    fi

    if ! check_services; then
        echo -e "${RED}❌ Some services are not running. Please start the services first.${NC}"
        echo "Run: ./scripts/setup.sh dev"
        exit 1
    fi

    echo "🧪 Running tests..."
    echo "=================="

    test_user_service
    test_inventory_service
    create_sample_data
    test_product_filtering
    test_pagination
    run_load_test

    echo -e "${GREEN}🎉 All tests completed!${NC}"
    echo ""
    echo "📊 Test Summary:"
    echo "- User Service: Registration, Login, Profile management"
    echo "- Inventory Service: CRUD operations, Stock management"
    echo "- Product Features: Filtering, Search, Pagination"
    echo "- Performance: Basic load testing"
    echo ""
    echo -e "${BLUE}💡 Next steps:${NC}"
    echo "1. Implement Payment Service"
    echo "2. Add API Gateway with gRPC integration"
    echo "3. Implement end-to-end purchase workflow"
    echo "4. Add comprehensive error handling and monitoring"
}

# Handle script arguments
case "$1" in
quick)
    check_services && test_user_service && test_inventory_service
    ;;
load)
    check_services && run_load_test
    ;;
data)
    check_services && create_sample_data
    ;;
*)
    main
    ;;
esac
