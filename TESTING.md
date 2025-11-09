# Testing Guide

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with verbose output
npm test -- --verbose
```

### Manual Integration Testing

The service has been manually tested with the following results:

#### Successful Tests ✓
- ✅ Root endpoint (`GET /`) - Returns service information
- ✅ Health check (`GET /api/health`) - Returns status, uptime, and WebSocket connections
- ✅ Tokens endpoint (`GET /api/tokens`) - Returns paginated token list
- ✅ Build process - TypeScript compiles without errors
- ✅ Linting - ESLint passes with only warnings (no errors)
- ✅ Server startup - Starts successfully on port 3000
- ✅ Graceful shutdown - Handles SIGTERM/SIGINT correctly

#### Test Results Summary

```
Test Suites: 3 passed, 3 total
Tests:       1 skipped, 24 passed, 25 total
Snapshots:   0 total
Time:        ~6.5s

Coverage:
- Statements: 37.98%
- Branches: 24.51%
- Functions: 26.66%
- Lines: 38.32%
```

**Note**: Coverage is lower than ideal because:
- API client code requires real external API calls
- WebSocket service needs integration testing
- Main application entry point tested manually
- Some error paths require specific conditions

### Integration Test Script

A bash script (`test-integration.sh`) is provided for quick endpoint testing:

```bash
# Test local deployment
./test-integration.sh http://localhost:3000

# Test production deployment
./test-integration.sh https://your-app.onrender.com
```

### API Testing with Postman

1. Import `postman_collection.json` into Postman
2. Set the `baseUrl` variable to your deployment URL
3. Run the entire collection or individual requests

### WebSocket Testing

1. Build and start the server:
   ```bash
   npm run build
   npm start
   ```

2. Open `websocket-client.html` in a web browser
3. Click "Connect" to establish WebSocket connection
4. Observe real-time updates

### Testing with External APIs

**Note**: The external API calls may fail in restricted network environments. To test with real APIs:

1. Deploy to a platform with unrestricted internet access (Render, Railway, Fly.io)
2. Verify the following APIs are accessible:
   - DexScreener: https://api.dexscreener.com
   - Jupiter: https://price.jup.ag
   - GeckoTerminal: https://api.geckoterminal.com

3. Monitor logs for successful API responses:
   ```
   Fetched X tokens from DexScreener
   Fetched Y tokens from GeckoTerminal
   Aggregated Z unique tokens
   ```

### Load Testing (Optional)

For production deployments, consider load testing:

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/tokens

# Using k6
k6 run load-test.js
```

### Continuous Integration

The project is ready for CI/CD integration:

```yaml
# Example GitHub Actions workflow
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm test
      - run: npm run lint
```

## Test Coverage Goals

### Current Coverage
- Core business logic (tokenAggregator): 85%
- API routes: 100%
- Utilities (logger, rateLimiter): 80-100%

### Recommended Additional Tests

1. **API Client Integration Tests**
   - Mock API responses with nock
   - Test retry logic
   - Test rate limiting

2. **WebSocket Tests**
   - Connection handling
   - Message broadcasting
   - Error scenarios

3. **Cache Service Tests**
   - Redis operations
   - Fallback behavior
   - TTL expiration

4. **End-to-End Tests**
   - Full request flow
   - WebSocket updates
   - Multi-client scenarios

## Debugging

### Enable Debug Logs

```bash
NODE_ENV=development npm run dev
```

### Common Issues

1. **Redis Connection Failed**
   - Expected if Redis is not running
   - Service continues with in-memory fallback

2. **External API Timeout**
   - Check network connectivity
   - Verify API endpoints are accessible
   - Review rate limit settings

3. **WebSocket Connection Failed**
   - Ensure server is running
   - Check CORS settings
   - Verify WebSocket URL

### Logs Location

- Development: Console output
- Production: stdout (captured by hosting platform)

## Performance Testing

### Expected Response Times

- Cached requests: <50ms
- Fresh API calls: 500-2000ms (network dependent)
- WebSocket updates: <10ms

### Monitoring

Check health endpoint regularly:
```bash
curl http://localhost:3000/api/health
```

Look for:
- Uptime
- WebSocket connections
- Response time
