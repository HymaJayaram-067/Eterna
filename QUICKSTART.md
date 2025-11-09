# Quick Start Guide

## For Reviewers / Evaluators

This guide helps you quickly get the project running and test all features.

## Prerequisites

- Node.js 18+ installed
- (Optional) Docker for Redis
- (Optional) Redis installed locally

## 1. Quick Setup (30 seconds)

```bash
# Clone the repository
git clone https://github.com/HymaJayaram-067/Eterna.git
cd Eterna

# Install dependencies
npm install

# Start the server (works without Redis using in-memory cache)
npm run dev
```

The server will start at `http://localhost:3000`

## 2. Test the API (2 minutes)

### Using the automated test script:
```bash
./test-api.sh
```

### Or manually with curl:
```bash
# Health check
curl http://localhost:3000/api/health

# Get tokens (sorted by volume)
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"

# Search for tokens
curl "http://localhost:3000/api/search?q=bonk"
```

### Using Postman:
1. Import `postman_collection.json`
2. Set base_url to `http://localhost:3000`
3. Run the collection

## 3. Test WebSocket (1 minute)

1. Ensure the server is running
2. Open `websocket-demo.html` in your browser
3. Click "Connect"
4. Watch real-time token updates

You'll see:
- Initial data load
- Live price updates
- Volume spike notifications

## 4. Run Tests (1 minute)

```bash
# Run all tests with coverage
npm test

# Should see: 25 tests passed
```

## 5. View Documentation

- **README.md** - Main documentation
- **API_DOCUMENTATION.md** - Detailed API reference
- **DEPLOYMENT.md** - Deployment instructions
- **TESTING.md** - Testing strategies
- **PROJECT_SUMMARY.md** - Project overview

## 6. Optional: Run with Docker

```bash
# Start both API and Redis
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Key Features to Test

### 1. Data Aggregation
```bash
curl "http://localhost:3000/api/tokens?limit=20"
```
- Notice tokens from multiple sources (DexScreener, GeckoTerminal)
- See merged data with combined sources

### 2. Filtering & Sorting
```bash
# Sort by volume
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"

# Sort by price change
curl "http://localhost:3000/api/tokens?sortBy=price_change&sortOrder=desc&limit=10"

# Sort by market cap
curl "http://localhost:3000/api/tokens?sortBy=market_cap&sortOrder=desc&limit=10"
```

### 3. Pagination
```bash
# First page
curl "http://localhost:3000/api/tokens?limit=5"

# Note the nextCursor in response, use it for next page
curl "http://localhost:3000/api/tokens?limit=5&cursor=5"
```

### 4. Search
```bash
curl "http://localhost:3000/api/search?q=bonk"
curl "http://localhost:3000/api/search?q=wif"
```

### 5. Caching (Response Time)
```bash
# First request (slower - hits external APIs)
time curl http://localhost:3000/api/tokens

# Second request within 30s (faster - uses cache)
time curl http://localhost:3000/api/tokens
```

### 6. Error Handling
```bash
# Invalid token address (404)
curl http://localhost:3000/api/tokens/invalid-address

# Missing search query (400)
curl http://localhost:3000/api/search

# Invalid route (404)
curl http://localhost:3000/invalid
```

### 7. WebSocket Real-time Updates

Open `websocket-demo.html` and observe:
- Initial data loads immediately
- Updates arrive every 5 seconds
- Price changes >1% trigger notifications
- Volume spikes >50% trigger alerts

## Performance Demonstration

### Response Times
```bash
# Make 10 rapid API calls
for i in {1..10}; do
  time curl -s http://localhost:3000/api/tokens > /dev/null
done
```

First call: ~500-1000ms (external API calls)
Subsequent calls: ~10-50ms (cached)

### Concurrent Requests
Open multiple browser tabs with the WebSocket demo to test multi-client support.

## Project Structure Quick Tour

```
src/
├── services/           # DexScreener, GeckoTerminal, Aggregation, Cache
├── routes/            # API endpoints
├── websocket/         # WebSocket server
├── utils/             # Rate limiter, retry logic
├── config/            # Configuration
├── types/             # TypeScript definitions
└── __tests__/         # 25 tests
```

## What Makes This Production-Ready?

1. **Error Handling**: Try breaking things - it recovers gracefully
2. **Caching**: Notice the performance boost on repeated requests
3. **Rate Limiting**: Protection against API rate limits
4. **Real-time**: WebSocket updates without new HTTP requests
5. **Testing**: 25 tests ensure reliability
6. **Documentation**: 6 comprehensive guides
7. **Deployment**: Ready for Railway, Render, Heroku, or Docker

## Common Issues & Solutions

### Redis Connection Error
**Issue**: "Redis not available, running without cache"
**Solution**: This is normal! App works fine with in-memory cache.

To use Redis:
```bash
docker run -d -p 6379:6379 redis:alpine
# or
./dev.sh redis
```

### Port Already in Use
**Issue**: Port 3000 is busy
**Solution**: Change PORT in `.env` file:
```bash
echo "PORT=3001" >> .env
npm run dev
```

### Tests Taking Long
**Issue**: Some tests timeout
**Solution**: This is due to external API calls being mocked. Tests should complete in <10 seconds.

## Deployment Quick Start

### Railway (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render
1. Connect GitHub repo
2. Set build: `npm install && npm run build`
3. Set start: `npm start`

### Heroku
```bash
heroku create
heroku addons:create heroku-redis:mini
git push heroku main
```

See `DEPLOYMENT.md` for detailed instructions.

## Video Demo Script

1. **Introduction** (10s)
   - Show README, explain project purpose

2. **Code Structure** (15s)
   - Show src/ directory structure
   - Highlight services, routes, websocket

3. **Start Server** (10s)
   - Run `npm run dev`
   - Show console output

4. **API Demonstration** (30s)
   - Run `./test-api.sh`
   - Show successful responses
   - Or use Postman collection

5. **WebSocket Demo** (20s)
   - Open websocket-demo.html
   - Show real-time updates
   - Open multiple tabs

6. **Tests** (15s)
   - Run `npm test`
   - Show 25 tests passing
   - Show coverage report

7. **Conclusion** (10s)
   - Highlight key features
   - Show documentation

Total: ~2 minutes

## Need Help?

- Check README.md for detailed setup
- See API_DOCUMENTATION.md for endpoint details
- Read TESTING.md for testing strategies
- Review PROJECT_SUMMARY.md for overview

## Contact

For questions or issues:
- GitHub: https://github.com/HymaJayaram-067/Eterna
- Issues: https://github.com/HymaJayaram-067/Eterna/issues

---

**Enjoy testing Eterna!** 🚀
