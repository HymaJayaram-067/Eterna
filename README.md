# Eterna - Real-time Meme Coin Data Aggregation Service

A production-ready service that aggregates real-time meme coin data from multiple DEX sources with efficient caching, WebSocket-based live updates, and a modern React-based user interface.

## 🚀 Features

### Backend Features
- **Multi-Source Aggregation**: Fetches and merges token data from DexScreener, Jupiter, and GeckoTerminal APIs
- **Real-time Updates**: WebSocket support for live price updates and volume spikes
- **Intelligent Caching**: Redis-backed caching with configurable TTL (default 30s)
- **Rate Limiting**: Built-in rate limiting with exponential backoff for API reliability
- **Smart Token Merging**: Deduplicates tokens from multiple sources
- **Advanced Filtering**: Filter by time periods, volume, market cap
- **Cursor-based Pagination**: Efficient pagination for large token lists
- **Dynamic Configuration**: Runtime configuration updates for cache TTL
- **Comprehensive Testing**: >70% code coverage with unit and integration tests

### Frontend Features
- **Modern React UI**: TypeScript-based React application with real-time data visualization
- **Live Updates**: WebSocket integration for instant price and volume updates
- **Interactive Charts**: Price and volume charts using Recharts library
- **Advanced Filtering**: Filter and sort tokens by multiple criteria (1h, 24h, 7d)
- **Responsive Design**: Mobile-friendly interface with modern CSS
- **Visual Highlights**: Automatic highlighting of tokens with significant price/volume changes

## 📋 API Endpoints

### REST API

- `GET /` - Service information (or React UI in production)
- `GET /api/tokens` - Get paginated tokens with filtering and sorting
  - Query params: `limit`, `cursor`, `sortBy`, `sortOrder`, `timePeriod`, `minVolume`, `minMarketCap`
- `GET /api/tokens/:address` - Get specific token by address
- `POST /api/refresh` - Manually trigger cache refresh
- `GET /api/health` - Health check endpoint
- `GET /api/config` - Get current configuration settings
- `PUT /api/config/cache-ttl` - Update cache TTL dynamically

### WebSocket Events

Connect to `ws://localhost:3000` and listen for:
- `initial_data` - Initial token data on connection
- `update` - Real-time price updates and volume spikes
- `error` - Error messages

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Web Framework**: Express.js
- **WebSocket**: Socket.io
- **Cache**: Redis (with ioredis client)
- **HTTP Client**: Axios with retry logic
- **Task Scheduling**: node-cron
- **Testing**: Jest with Supertest
- **Logging**: Winston

### Frontend
- **Framework**: React 18 with TypeScript
- **Charts**: Recharts for data visualization
- **HTTP Client**: Axios
- **WebSocket**: Socket.io-client
- **Styling**: CSS3 with responsive design

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- Redis (optional, service works without it)

### Setup

```bash
# Clone the repository
git clone https://github.com/HymaJayaram-067/Eterna.git
cd Eterna

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Or install all at once
npm run install:all

# Create .env file
cp .env.example .env

# Build the project (both backend and frontend)
npm run build

# Start the server in production mode
npm start

# Or run in development mode (backend only)
npm run dev

# Or run frontend in development mode (in a separate terminal)
npm run dev:frontend
```

## 🖥️ Running the Application

### Development Mode

For development, you'll want to run the backend and frontend separately:

**Terminal 1 - Backend:**
```bash
npm run dev
```
This starts the backend server on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```
This starts the React development server on `http://localhost:3001`

The frontend will proxy API requests to the backend automatically.

### Production Mode

```bash
# Build everything
npm run build

# Start the server
npm start
```

In production mode, the backend serves the built React application at `http://localhost:3000`

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

## 🎨 User Interface Features

### 1. Real-time Data Visualization

The frontend provides a modern, responsive interface for visualizing token data:

- **Live Token Cards**: Display key metrics including price, volume, market cap, liquidity, and price changes
- **Visual Highlighting**: Tokens with significant price or volume changes are automatically highlighted
- **Auto-refresh**: WebSocket connection provides instant updates without page reload

### 2. Interactive Charts

- **Volume Chart**: Displays top tokens by trading volume
- **Market Cap Chart**: Shows top tokens by market capitalization
- **Responsive Design**: Charts adapt to different screen sizes
- **Tooltips**: Hover over data points for detailed information

### 3. Advanced Filtering

The UI provides multiple filtering options:

- **Sort By**: Volume, Price Change, Market Cap, or Liquidity
- **Sort Order**: Ascending or Descending
- **Time Period**: Filter price changes by 1h, 24h, or 7d
- **Volume Filter**: Set minimum volume threshold
- **Market Cap Filter**: Set minimum market cap threshold

### 4. Connection Status

- **Live Indicator**: Shows WebSocket connection status
- **Health Metrics**: Displays server uptime and active connections
- **Manual Refresh**: Button to manually trigger cache refresh

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

# Get tokens with minimum volume filter and time period
curl "http://localhost:3000/api/tokens?minVolume=1000&timePeriod=24h"

# Get specific token
curl "http://localhost:3000/api/tokens/576P1t7XsRL4ZVj38LV2eYWxXRPguBADA8BxcNz1xo8y"

# Trigger manual refresh
curl -X POST "http://localhost:3000/api/refresh"

# Health check
curl "http://localhost:3000/api/health"

# Get current configuration
curl "http://localhost:3000/api/config"

# Update cache TTL (set to 60 seconds)
curl -X PUT "http://localhost:3000/api/config/cache-ttl" \
  -H "Content-Type: application/json" \
  -d '{"ttl": 60}'
```

### API Error Responses

All error responses now include enhanced error information:

```json
{
  "success": false,
  "error": "Failed to fetch tokens",
  "errorCode": "TOKEN_FETCH_ERROR",
  "errorDetails": "An error occurred while fetching token data. Please try again later or contact support if the issue persists.",
  "timestamp": 1699564800000
}
```

Error codes:
- `TOKEN_FETCH_ERROR`: Error fetching token list
- `TOKEN_NOT_FOUND`: Specific token not found
- `CACHE_REFRESH_ERROR`: Error refreshing cache
- `INVALID_PARAMETER`: Invalid request parameter

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