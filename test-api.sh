#!/bin/bash

# API Test Script for Eterna
# This script tests all REST API endpoints

BASE_URL="${1:-http://localhost:3000}"
echo "Testing Eterna API at: $BASE_URL"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for tests
TOTAL=0
PASSED=0

# Test function
test_endpoint() {
    TOTAL=$((TOTAL + 1))
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    echo -e "\n${YELLOW}Test $TOTAL: $name${NC}"
    echo "URL: $url"
    
    response=$(curl -s -w "\n%{http_code}" "$url")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" == "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        echo "Response: $(echo "$body" | jq -r '.' 2>/dev/null || echo "$body" | head -c 200)"
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $http_code)"
        echo "Response: $body"
    fi
}

echo ""
echo "Starting API Tests..."
echo "========================================"

# Test 1: Root endpoint
test_endpoint "Root Endpoint" "$BASE_URL/" 200

# Test 2: Health check
test_endpoint "Health Check" "$BASE_URL/api/health" 200

# Test 3: Get all tokens
test_endpoint "Get All Tokens" "$BASE_URL/api/tokens" 200

# Test 4: Get tokens with limit
test_endpoint "Get Tokens (limit=5)" "$BASE_URL/api/tokens?limit=5" 200

# Test 5: Get tokens sorted by volume
test_endpoint "Get Tokens Sorted by Volume" "$BASE_URL/api/tokens?sortBy=volume&sortOrder=desc&limit=10" 200

# Test 6: Get tokens sorted by price change
test_endpoint "Get Tokens Sorted by Price Change" "$BASE_URL/api/tokens?sortBy=price_change&sortOrder=desc&limit=10" 200

# Test 7: Get tokens sorted by market cap
test_endpoint "Get Tokens Sorted by Market Cap" "$BASE_URL/api/tokens?sortBy=market_cap&sortOrder=desc&limit=10" 200

# Test 8: Search for tokens
test_endpoint "Search Tokens (bonk)" "$BASE_URL/api/search?q=bonk" 200

# Test 9: Search with different query
test_endpoint "Search Tokens (wif)" "$BASE_URL/api/search?q=wif" 200

# Test 10: Get token by address (should work if token exists)
test_endpoint "Get Token by Address" "$BASE_URL/api/tokens/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" 200

# Test 11: Get token by invalid address (should 404)
test_endpoint "Get Token by Invalid Address" "$BASE_URL/api/tokens/invalid-address-123" 404

# Test 12: Search without query (should 400)
test_endpoint "Search Without Query (Should Fail)" "$BASE_URL/api/search" 400

# Test 13: Invalid route (should 404)
test_endpoint "Invalid Route (Should Fail)" "$BASE_URL/invalid-route" 404

echo ""
echo "========================================"
echo "Test Results"
echo "========================================"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $((TOTAL - PASSED))${NC}"
echo -e "Success Rate: $(awk "BEGIN {print ($PASSED/$TOTAL)*100}")%"

if [ $PASSED -eq $TOTAL ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed${NC}"
    exit 1
fi
