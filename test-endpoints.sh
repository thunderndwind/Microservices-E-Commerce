#!/bin/bash

# This script runs a series of curl commands to test the e-commerce microservices.

# Set the base URL for the API Gateway
BASE_URL="http://localhost:8080"
echo "Testing API at: $BASE_URL"
echo "--------------------------------------------------"

# --- Health Check ---
echo "1. Checking API Gateway Health Status..."
curl -s -X GET "$BASE_URL/health" | jq .
echo "--------------------------------------------------"

# --- User Registration ---
echo "2. Registering a new user..."
# Generate a random user email to ensure uniqueness on each run
USER_EMAIL="testuser$(date +%s)@example.com"
USER_PASSWORD="password123"

REGISTER_RESPONSE=$(
    curl -s -X POST "$BASE_URL/api/users/register" \
        -H "Content-Type: application/json" \
        -d '{
  "firstName": "Test",
  "lastName": "User",
  "email": "'"$USER_EMAIL"'",
  "password": "'"$USER_PASSWORD"'"
    }'
)

echo "$REGISTER_RESPONSE" | jq .
# Try both user ID extraction methods to handle different response formats
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
    USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.user.id')
fi
echo "--------------------------------------------------"

# --- User Login ---
echo "3. Logging in to get JWT token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "'"$USER_EMAIL"'",
        "password": "'"$USER_PASSWORD"'"
    }')

echo "$LOGIN_RESPONSE" | jq .

# Try both token extraction methods to handle different response formats
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "Login failed or token not found. Exiting."
    echo "Login response: $LOGIN_RESPONSE"
    exit 1
fi
echo "Login successful. Token received."
echo "--------------------------------------------------"

# --- Create Product ---
echo "4. Creating a new product..."
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/products" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Super Widget",
    "description": "A high-quality widget for all your needs.",
    "price": 29.99,
    "category": "Electronics",
    "stockQuantity": 100,
    "sku": "WIDGET-001-'"$(date +%s)"'"
}')

echo "$PRODUCT_RESPONSE" | jq .
# Try both product ID extraction methods to handle different response formats
PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.data.product._id')
if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" == "null" ]; then
    PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.product._id')
fi
echo "--------------------------------------------------"

# --- Get All Products ---
echo "5. Getting all products..."
curl -s -X GET "$BASE_URL/api/products" | jq .
echo "--------------------------------------------------"

# --- Make a Purchase ---
echo "6. Attempting to purchase the new product..."
if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" == "null" ]; then
    echo "Failed to create a product, cannot test purchase. Exiting."
    exit 1
fi

PURCHASE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/purchase" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "productId": "'"$PRODUCT_ID"'",
    "quantity": 2,
    "paymentDetails": {
        "paymentMethod": "CreditCard",
        "cardInfo": {
            "cardNumber": "1234-5678-9012-3456",
            "expiryDate": "12/25",
            "cvv": "123"
        }
    }
}')

echo "$PURCHASE_RESPONSE" | jq .
echo "--------------------------------------------------"

echo "Testing complete."
