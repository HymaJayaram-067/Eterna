# Testing Guide

## Running Tests

### Unit and Integration Tests

Run all tests with coverage:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Test Coverage

The project includes 25+ tests covering:
- Rate limiting and retry logic
- Token aggregation and merging
- REST API endpoints
- Cache service functionality
- Error handling

Expected coverage:
- Statements: >50%
- Branches: >35%
- Functions: >50%
- Lines: >50%

### API Testing

#### Using the Test Script

Run the automated API test script:
```bash
./test-api.sh
# or with a custom URL
./test-api.sh https://your-deployed-url.com
```

This script tests all 13 API endpoints and validates responses.

#### Using cURL

Test individual endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# Get tokens
curl http://localhost:3000/api/tokens

# Get tokens with sorting
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"

# Search tokens
curl "http://localhost:3000/api/search?q=bonk"

# Get specific token
curl http://localhost:3000/api/tokens/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
```

#### Using Postman

1. Import `postman_collection.json`
2. Set the `base_url` variable to your server URL
3. Run the entire collection or individual requests

### WebSocket Testing

#### Using the Demo Page

1. Start the server:
   ```bash
   npm run dev
   ```

2. Open `websocket-demo.html` in a browser

3. Click "Connect" to establish WebSocket connection

4. Observe real-time updates in the UI

#### Using JavaScript

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected');
});

socket.on('initial_data', (message) => {
  console.log('Initial data:', message.data.length, 'tokens');
});

socket.on('price_update', (message) => {
  console.log('Price update:', message.data.token_ticker);
});

socket.on('volume_spike', (message) => {
  console.log('Volume spike:', message.data.token_ticker);
});
```

### Performance Testing

#### Response Time Testing

Test API response times:
```bash
# Using curl with timing
for i in {1..10}; do
  curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/tokens
done
```

Create `curl-format.txt`:
```
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

#### Load Testing with Apache Bench

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:3000/api/tokens

# Test with 1000 requests, 50 concurrent
ab -n 1000 -c 50 http://localhost:3000/api/health
```

### Cache Testing

Test cache effectiveness:

```bash
# First request (cache miss)
time curl http://localhost:3000/api/tokens

# Second request within 30s (cache hit - should be faster)
time curl http://localhost:3000/api/tokens

# Wait >30s and request again (cache miss)
sleep 31
time curl http://localhost:3000/api/tokens
```

### Error Handling Testing

Test various error scenarios:

```bash
# Invalid token address
curl http://localhost:3000/api/tokens/invalid-address

# Missing search query
curl http://localhost:3000/api/search

# Invalid route
curl http://localhost:3000/invalid-route

# Invalid sort parameter
curl "http://localhost:3000/api/tokens?sortBy=invalid"
```

## Manual Testing Checklist

### REST API
- [ ] Root endpoint returns API info
- [ ] Health check returns status
- [ ] Tokens list returns data with pagination
- [ ] Sorting works for all metrics
- [ ] Pagination cursor works correctly
- [ ] Token by address returns correct data
- [ ] Search returns relevant results
- [ ] Error responses have proper status codes

### WebSocket
- [ ] Connection established successfully
- [ ] Initial data received on connect
- [ ] Price updates received for changes >1%
- [ ] Volume spikes detected for >50% increases
- [ ] Multiple clients can connect simultaneously
- [ ] Reconnection works after disconnect

### Caching
- [ ] First request hits external APIs
- [ ] Second request uses cache (faster)
- [ ] Cache expires after TTL
- [ ] Falls back to in-memory if Redis unavailable

### Rate Limiting
- [ ] Rate limiter prevents excessive requests
- [ ] Exponential backoff works for retries
- [ ] API recovers after rate limit period

## CI/CD Testing

### GitHub Actions

The project is ready for CI/CD with these test commands:
```yaml
- name: Install dependencies
  run: npm install

- name: Run linter
  run: npm run lint

- name: Run tests
  run: npm test

- name: Build
  run: npm run build
```

## Troubleshooting Tests

### Tests Failing

If tests fail:
1. Check that all dependencies are installed: `npm install`
2. Ensure TypeScript compiles: `npm run build`
3. Check for syntax errors: `npm run lint`
4. Verify environment variables are set correctly

### WebSocket Not Connecting

If WebSocket doesn't connect:
1. Verify server is running
2. Check firewall settings
3. Ensure correct URL (http:// not https:// for local)
4. Check browser console for errors

### API Timing Out

If API requests time out:
1. Check external API availability
2. Verify rate limits not exceeded
3. Increase timeout values if needed
4. Check network connectivity

## Test Data

For manual testing, use these known Solana token addresses:

- BONK: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
- WIF: (address varies, search using `/api/search?q=wif`)

## Monitoring Tests

Monitor test execution:
```bash
# Watch mode for continuous testing
npm run test:watch

# Run specific test file
npm test -- rateLimiter.test.ts

# Run tests with verbose output
npm test -- --verbose
```
