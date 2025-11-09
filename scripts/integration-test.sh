#!/bin/bash

# Integration test script for Eterna service
# Tests all major functionality

BASE_URL="${1:-http://localhost:3000}"
FAILED=0

echo "🧪 Eterna Integration Tests"
echo "============================"
echo "Target: $BASE_URL"
echo ""

# Helper function
test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status" = "$expected_status" ]; then
        echo "✓ PASS (Status: $status)"
        return 0
    else
        echo "✗ FAIL (Expected: $expected_status, Got: $status)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test 1: Health Check
echo "Test Suite 1: Basic Endpoints"
echo "-----------------------------"
test_endpoint "Health Check" "/api/health"
test_endpoint "Root Endpoint" "/"
echo ""

# Test 2: Token Endpoints
echo "Test Suite 2: Token Endpoints"
echo "-----------------------------"
test_endpoint "Get All Tokens" "/api/tokens"
test_endpoint "Get Tokens with Limit" "/api/tokens?limit=5"
test_endpoint "Get Tokens Sorted by Volume" "/api/tokens?sortBy=volume&sortOrder=desc"
test_endpoint "Get Tokens Sorted by Price Change" "/api/tokens?sortBy=price_change&timePeriod=1h"
echo ""

# Test 3: Filtering
echo "Test Suite 3: Filtering"
echo "----------------------"
test_endpoint "Filter by Min Volume" "/api/tokens?minVolume=100"
test_endpoint "Filter by Min Market Cap" "/api/tokens?minMarketCap=500"
test_endpoint "Combined Filters" "/api/tokens?minVolume=50&minMarketCap=100&sortBy=volume"
echo ""

# Test 4: Pagination
echo "Test Suite 4: Pagination"
echo "-----------------------"
test_endpoint "First Page" "/api/tokens?limit=5&cursor=0"
test_endpoint "Second Page" "/api/tokens?limit=5&cursor=5"
echo ""

# Test 5: Cache Operations
echo "Test Suite 5: Cache Operations"
echo "------------------------------"
test_endpoint "Invalidate Cache" "/api/cache/invalidate" "200"
sleep 1
test_endpoint "Fetch After Cache Clear" "/api/tokens?limit=10"
echo ""

# Test 6: Edge Cases
echo "Test Suite 6: Edge Cases"
echo "-----------------------"
test_endpoint "Invalid Sort Field" "/api/tokens?sortBy=invalid" "200"
test_endpoint "Negative Limit" "/api/tokens?limit=-1" "200"
test_endpoint "Very Large Limit" "/api/tokens?limit=1000" "200"
test_endpoint "Non-existent Endpoint" "/api/nonexistent" "404"
echo ""

# Test 7: Response Structure
echo "Test Suite 7: Response Structure"
echo "--------------------------------"

echo -n "Checking tokens response structure... "
response=$(curl -s "$BASE_URL/api/tokens?limit=1")

if echo "$response" | grep -q '"success"' && \
   echo "$response" | grep -q '"data"' && \
   echo "$response" | grep -q '"pagination"'; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    FAILED=$((FAILED + 1))
fi

echo -n "Checking token data fields... "
if echo "$response" | grep -q '"token_address"' && \
   echo "$response" | grep -q '"token_name"' && \
   echo "$response" | grep -q '"price_sol"' && \
   echo "$response" | grep -q '"volume_sol"'; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    FAILED=$((FAILED + 1))
fi

echo -n "Checking pagination fields... "
if echo "$response" | grep -q '"hasMore"' && \
   echo "$response" | grep -q '"total"'; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 8: Performance
echo "Test Suite 8: Performance"
echo "------------------------"

echo -n "Response time under 500ms... "
start=$(date +%s%3N)
curl -s "$BASE_URL/api/tokens?limit=20" > /dev/null
end=$(date +%s%3N)
duration=$((end - start))

if [ $duration -lt 500 ]; then
    echo "✓ PASS (${duration}ms)"
else
    echo "✗ FAIL (${duration}ms > 500ms)"
    FAILED=$((FAILED + 1))
fi

echo -n "Cached response faster... "
start=$(date +%s%3N)
curl -s "$BASE_URL/api/tokens?limit=20" > /dev/null
end=$(date +%s%3N)
cached_duration=$((end - start))

if [ $cached_duration -lt $duration ]; then
    echo "✓ PASS (${cached_duration}ms < ${duration}ms)"
else
    echo "⚠ WARNING (Cache may not be working: ${cached_duration}ms)"
fi
echo ""

# Summary
echo "================================"
echo "Test Summary"
echo "================================"
if [ $FAILED -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ $FAILED test(s) failed"
    exit 1
fi
