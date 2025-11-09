#!/bin/bash

# Integration Test Script for Eterna Data Aggregator
# This script tests the deployed service endpoints

BASE_URL="${1:-http://localhost:3000}"

echo "================================================"
echo "Eterna Data Aggregator - Integration Tests"
echo "================================================"
echo "Testing against: $BASE_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
TOTAL=0
PASSED=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    TOTAL=$((TOTAL + 1))
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$url")
    status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}PASSED${NC} (Status: $status)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}FAILED${NC} (Expected: $expected_status, Got: $status)"
        echo "Response: $body"
        return 1
    fi
}

test_json_field() {
    local name="$1"
    local url="$2"
    local field="$3"
    
    TOTAL=$((TOTAL + 1))
    echo -n "Testing $name... "
    
    response=$(curl -s "$url")
    value=$(echo "$response" | jq -r "$field")
    
    if [ "$value" != "null" ] && [ -n "$value" ]; then
        echo -e "${GREEN}PASSED${NC} (Field: $field = $value)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}FAILED${NC} (Field $field is null or empty)"
        echo "Response: $response"
        return 1
    fi
}

echo "=== Basic Endpoints ==="
test_endpoint "Root endpoint" "$BASE_URL/"
test_endpoint "Health check" "$BASE_URL/api/health"
test_json_field "Health status" "$BASE_URL/api/health" ".data.status"
test_json_field "Health uptime" "$BASE_URL/api/health" ".data.uptime"
echo ""

echo "=== Tokens API ==="
test_endpoint "Get all tokens" "$BASE_URL/api/tokens"
test_endpoint "Get tokens with limit" "$BASE_URL/api/tokens?limit=10"
test_endpoint "Get tokens sorted by volume" "$BASE_URL/api/tokens?sortBy=volume&sortOrder=desc"
test_endpoint "Get tokens with min volume filter" "$BASE_URL/api/tokens?minVolume=100"
echo ""

echo "=== Pagination ==="
test_json_field "Pagination - data field" "$BASE_URL/api/tokens?limit=5" ".data.data"
test_json_field "Pagination - total field" "$BASE_URL/api/tokens" ".data.total"
test_json_field "Pagination - hasMore field" "$BASE_URL/api/tokens" ".data.hasMore"
echo ""

echo "=== Error Handling ==="
test_endpoint "404 Not Found" "$BASE_URL/api/nonexistent" 404
test_endpoint "Token not found" "$BASE_URL/api/tokens/invalid-address" 404
echo ""

echo "=== POST Endpoints ==="
test_endpoint "Manual cache refresh" "$BASE_URL/api/refresh"
echo ""

echo "================================================"
echo "Test Results: $PASSED/$TOTAL passed"
echo "================================================"

if [ $PASSED -eq $TOTAL ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
