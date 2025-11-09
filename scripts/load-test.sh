#!/bin/bash

# Load Testing Script for Eterna API
# Tests rapid API calls and measures response times

BASE_URL="${1:-http://localhost:3000}"
NUM_REQUESTS="${2:-10}"

echo "🚀 Eterna API Load Test"
echo "========================"
echo "Target: $BASE_URL"
echo "Requests: $NUM_REQUESTS"
echo ""

# Array to store response times
declare -a response_times

# Test 1: Health Check
echo "Test 1: Health Check"
start=$(date +%s%3N)
curl -s "$BASE_URL/api/health" > /dev/null
end=$(date +%s%3N)
echo "✓ Response time: $((end - start))ms"
echo ""

# Test 2: Rapid API Calls
echo "Test 2: Rapid API Calls to /api/tokens"
for i in $(seq 1 $NUM_REQUESTS); do
    start=$(date +%s%3N)
    response=$(curl -s -w "%{http_code}" "$BASE_URL/api/tokens?limit=20" -o /dev/null)
    end=$(date +%s%3N)
    duration=$((end - start))
    response_times+=($duration)
    
    if [ "$response" = "200" ]; then
        echo "✓ Request $i: ${duration}ms (Status: $response)"
    else
        echo "✗ Request $i: ${duration}ms (Status: $response)"
    fi
done
echo ""

# Calculate statistics
total=0
min=${response_times[0]}
max=${response_times[0]}

for time in "${response_times[@]}"; do
    total=$((total + time))
    if [ $time -lt $min ]; then
        min=$time
    fi
    if [ $time -gt $max ]; then
        max=$time
    fi
done

avg=$((total / ${#response_times[@]}))

echo "📊 Statistics"
echo "============"
echo "Total Requests: ${#response_times[@]}"
echo "Average: ${avg}ms"
echo "Min: ${min}ms"
echo "Max: ${max}ms"
echo ""

# Test 3: Different Endpoints
echo "Test 3: Testing Different Endpoints"

endpoints=(
    "/api/tokens?sortBy=volume&sortOrder=desc"
    "/api/tokens?sortBy=price_change&timePeriod=1h"
    "/api/tokens?minVolume=100"
    "/api/tokens?limit=5&cursor=0"
)

for endpoint in "${endpoints[@]}"; do
    start=$(date +%s%3N)
    response=$(curl -s -w "%{http_code}" "$BASE_URL$endpoint" -o /dev/null)
    end=$(date +%s%3N)
    duration=$((end - start))
    echo "✓ $endpoint: ${duration}ms (Status: $response)"
done
echo ""

# Test 4: Cache Performance
echo "Test 4: Cache Performance Test"
echo "First call (cache miss):"
start=$(date +%s%3N)
curl -s "$BASE_URL/api/tokens?limit=10" > /dev/null
end=$(date +%s%3N)
first_call=$((end - start))
echo "  Time: ${first_call}ms"

echo "Second call (cache hit):"
start=$(date +%s%3N)
curl -s "$BASE_URL/api/tokens?limit=10" > /dev/null
end=$(date +%s%3N)
second_call=$((end - start))
echo "  Time: ${second_call}ms"

improvement=$(( (first_call - second_call) * 100 / first_call ))
echo "  Cache improvement: ${improvement}%"
echo ""

echo "✅ Load test completed!"
