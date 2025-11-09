# Eterna - Real-time Meme Coin Data Aggregation Service

A production-ready service that aggregates real-time meme coin data from multiple DEX sources with efficient caching and WebSocket-based live updates.

## 🚀 Features

- **Multi-Source Aggregation**: Fetches and merges token data from DexScreener, Jupiter, and GeckoTerminal APIs
- **Real-time Updates**: WebSocket support for live price updates and volume spikes
- **Intelligent Caching**: Redis-backed caching with configurable TTL (default 30s)
- **Rate Limiting**: Built-in rate limiting with exponential backoff for API reliability
- **Smart Token Merging**: Deduplicates tokens from multiple sources
- **Advanced Filtering**: Filter by time periods, volume, market cap
- **Cursor-based Pagination**: Efficient pagination for large token lists
- **Comprehensive Testing**: >70% code coverage with unit and integration tests

## 📋 API Endpoints

### REST API

- `GET /` - Service information
- `GET /api/tokens` - Get paginated tokens with filtering and sorting
  - Query params: `limit`, `cursor`, `sortBy`, `sortOrder`, `minVolume`, `minMarketCap`
- `GET /api/tokens/:address` - Get specific token by address
- `POST /api/refresh` - Manually trigger cache refresh
- `GET /api/health` - Health check endpoint

### WebSocket Events

Connect to `ws://localhost:3000` and listen for:
- `initial_data` - Initial token data on connection
- `update` - Real-time price updates and volume spikes
- `error` - Error messages

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: Express.js
- **WebSocket**: Socket.io
- **Cache**: Redis (with ioredis client)
- **HTTP Client**: Axios with retry logic
- **Task Scheduling**: node-cron
- **Testing**: Jest with Supertest
- **Logging**: Winston

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- Redis (optional, service works without it)

### Setup

```bash
# Clone the repository
git clone https://github.com/HymaJayaram-067/Eterna.git
cd Eterna

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Build the project
npm run build

# Start the server
npm start

# Or run in development mode
npm run dev
```

## 🔧 Configuration

Environment variables (`.env`):

```env
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
CACHE_TTL=30
DEXSCREENER_RATE_LIMIT=300
JUPITER_RATE_LIMIT=600
GECKOTERMINAL_RATE_LIMIT=300
WS_PORT=3001
REFRESH_INTERVAL=30
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## 🏗️ Architecture & Design Decisions

### 1. Multi-Source Data Aggregation

The service fetches data from three different APIs:
- **DexScreener**: Primary source for Solana DEX data
- **Jupiter**: Price data validation and enrichment
- **GeckoTerminal**: Trending tokens and additional coverage

**Design Decision**: Using Promise.allSettled() to fetch from multiple sources in parallel, ensuring the service continues even if one source fails. This provides resilience and better data coverage.

### 2. Intelligent Token Merging

When the same token appears from multiple sources, the merger:
- Keeps the highest values for volume, market cap, liquidity
- Prefers non-zero price changes
- Uses the most recent timestamp
- Maintains protocol information from the most reliable source

**Why**: Different DEXs may have partial or outdated data. Merging ensures we get the most complete and accurate picture.

### 3. Two-Tier Caching Strategy

- **Redis Layer**: Primary cache with configurable TTL
- **Fallback Mode**: Service continues without Redis if unavailable

**Why**: Redis provides fast, distributed caching for production. The fallback ensures development/testing doesn't require Redis setup.

### 4. Rate Limiting with Exponential Backoff

Each API client has:
- Token bucket rate limiter for request throttling
- Exponential backoff for retry logic
- Separate limits per API provider

**Why**: Prevents API rate limit violations and handles transient failures gracefully. Exponential backoff prevents thundering herd problems.

### 5. WebSocket Architecture

- Initial data sent on connection
- Periodic updates (every 30s) broadcast to all connected clients
- Detects price changes >5% and volume spikes
- Separate channels for different update types

**Why**: Reduces server load compared to polling. Clients get instant updates while server controls update frequency.

### 6. Cursor-based Pagination

Instead of offset-based pagination, uses cursor (position index) for:
- Consistent results during data updates
- Better performance on large datasets
- Stateless pagination

**Why**: Offset pagination can skip/duplicate items when underlying data changes. Cursors provide stable pagination.

## 🚀 Deployment

### Free Hosting Options

1. **Render** (Recommended)
   - Free tier includes Redis
   - Auto-deploy from GitHub
   - SSL included

2. **Railway**
   - Easy setup
   - Built-in Redis
   - $5 free credit

3. **Fly.io**
   - Global edge deployment
   - Free tier available

## 📊 Performance Considerations

1. **Response Times**:
   - Cached requests: <50ms
   - Fresh data fetch: 500-2000ms (depends on API latency)
   - WebSocket updates: <10ms

2. **Scalability**:
   - Horizontal scaling supported (shared Redis cache)
   - Handles 100+ concurrent WebSocket connections per instance
   - Rate limiters prevent API exhaustion

3. **Resource Usage**:
   - Memory: ~150MB per instance
   - CPU: Low (<5% during normal operation)
   - Network: Depends on client count and update frequency

## 🔍 Monitoring & Debugging

- **Logs**: Winston logger with configurable levels
- **Health Check**: `/api/health` endpoint
- **WebSocket Stats**: Connected clients count in health endpoint

## 📝 Sample Token Data Structure

```json
{
  "token_address": "576P1t7XsRL4ZVj38LV2eYWxXRPguBADA8BxcNz1xo8y",
  "token_name": "PIPE CTO",
  "token_ticker": "PIPE",
  "price_sol": 4.4141209798877615e-7,
  "market_cap_sol": 441.41209798877617,
  "volume_sol": 1322.4350391679925,
  "liquidity_sol": 149.359428555,
  "transaction_count": 2205,
  "price_1hr_change": 120.61,
  "price_24hr_change": 15.3,
  "protocol": "Raydium CLMM",
  "last_updated": 1699564800000
}
```

## 📚 API Documentation

### Example Requests

```bash
# Get top 30 tokens by volume
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=30"

# Get tokens with minimum volume filter
curl "http://localhost:3000/api/tokens?minVolume=1000"

# Get specific token
curl "http://localhost:3000/api/tokens/576P1t7XsRL4ZVj38LV2eYWxXRPguBADA8BxcNz1xo8y"

# Trigger manual refresh
curl -X POST "http://localhost:3000/api/refresh"

# Health check
curl "http://localhost:3000/api/health"
```

### WebSocket Client Example

```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('initial_data', (data) => {
  console.log('Initial tokens:', data);
});

socket.on('update', (message) => {
  if (message.type === 'price_update') {
    console.log('Price updates:', message.data);
  } else if (message.type === 'volume_spike') {
    console.log('Volume spikes:', message.data);
  }
});
```

## 🧩 Postman Collection

Import the collection from `postman_collection.json` to test all endpoints.

## 📄 License

MIT

---

**Note**: This is a demonstration project for real-time data aggregation. API keys and rate limits are subject to the respective service providers' terms of service.