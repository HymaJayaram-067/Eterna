# Quick Start Guide

Get up and running with Eterna in under 5 minutes!

## Prerequisites

- Node.js 18+ installed
- (Optional) Redis installed locally

## Installation

```bash
# Clone the repository
git clone https://github.com/HymaJayaram-067/Eterna.git
cd Eterna

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

## Running Locally

### Option 1: Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start on http://localhost:3000

### Option 2: Production Build

```bash
# Build the project
npm run build

# Start the server
npm start
```

### Option 3: Docker

```bash
# Using Docker Compose (includes Redis)
docker-compose up

# Or just Docker
docker build -t eterna .
docker run -p 3000:3000 eterna
```

## Testing the API

### Using curl

```bash
# Get service info
curl http://localhost:3000/

# Check health
curl http://localhost:3000/api/health

# Get tokens
curl http://localhost:3000/api/tokens

# Get tokens with filters
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"

# Refresh cache
curl -X POST http://localhost:3000/api/refresh
```

### Using Postman

1. Open Postman
2. Import `postman_collection.json`
3. Update `baseUrl` variable to `http://localhost:3000`
4. Run requests!

### Testing WebSocket

1. Open `websocket-client.html` in your browser
2. Click "Connect"
3. Watch live token updates!

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
./test-integration.sh http://localhost:3000
```

## Common Issues

### Redis Connection Error

**Error**: `Redis Client Error ECONNREFUSED`

**Solution**: This is normal if Redis isn't installed. The service will continue to work without caching.

To install Redis:
- **macOS**: `brew install redis && brew services start redis`
- **Ubuntu**: `sudo apt install redis-server && sudo systemctl start redis`
- **Windows**: Use Docker or WSL

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**: Change the port in `.env`:
```
PORT=3001
```

### External API Failures

**Error**: API calls timing out or failing

**Solution**: 
1. Check your internet connection
2. Verify the APIs are accessible:
   ```bash
   curl https://api.dexscreener.com/latest/dex/search?q=solana
   curl https://api.geckoterminal.com/api/v2/networks/solana/trending_pools
   ```
3. If behind a firewall, you may need to configure proxy settings

## Directory Structure

```
Eterna/
├── src/                    # Source code
│   ├── api/               # REST API routes
│   ├── services/          # Business logic & API clients
│   ├── websocket/         # WebSocket server
│   ├── utils/             # Utilities
│   └── index.ts           # Entry point
├── dist/                  # Compiled JavaScript (after build)
├── node_modules/          # Dependencies
├── .env                   # Environment variables
└── package.json           # Project configuration
```

## API Quick Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service information |
| GET | `/api/health` | Health check |
| GET | `/api/tokens` | List all tokens (paginated) |
| GET | `/api/tokens/:address` | Get specific token |
| POST | `/api/refresh` | Manually refresh cache |

### Query Parameters for `/api/tokens`

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | number | Results per page (default: 30) | `?limit=10` |
| `cursor` | string | Pagination cursor | `?cursor=30` |
| `sortBy` | string | Sort field (volume, price_change, market_cap, liquidity) | `?sortBy=volume` |
| `sortOrder` | string | Sort direction (asc, desc) | `?sortOrder=desc` |
| `minVolume` | number | Minimum volume filter | `?minVolume=1000` |
| `minMarketCap` | number | Minimum market cap filter | `?minMarketCap=500` |

### WebSocket Events

**Client → Server:**
- `subscribe` - Subscribe to a channel
- `unsubscribe` - Unsubscribe from a channel

**Server → Client:**
- `initial_data` - Initial token snapshot
- `update` - Price updates and volume spikes
- `error` - Error messages

## Environment Variables

```bash
# Server Configuration
PORT=3000                       # Server port
NODE_ENV=development            # Environment

# Redis Configuration
REDIS_URL=redis://localhost:6379  # Redis connection string
CACHE_TTL=30                    # Cache time-to-live (seconds)

# Data Refresh
REFRESH_INTERVAL=30             # Data refresh interval (seconds)

# Rate Limits (requests per minute)
DEXSCREENER_RATE_LIMIT=300
JUPITER_RATE_LIMIT=600
GECKOTERMINAL_RATE_LIMIT=300
```

## Next Steps

1. **Explore the API** - Use Postman or curl to test endpoints
2. **Watch WebSocket updates** - Open the HTML client
3. **Read the docs** - Check README.md and DEPLOYMENT.md
4. **Deploy** - Follow DEPLOYMENT.md to deploy to production
5. **Customize** - Modify rate limits, cache TTL, etc.

## Getting Help

- 📖 **Documentation**: README.md, DEPLOYMENT.md, TESTING.md
- 🐛 **Issues**: Check logs in console for debugging
- 💬 **Questions**: Review PROJECT_SUMMARY.md for design decisions

## Performance Tips

1. **Enable Redis** for better caching performance
2. **Adjust CACHE_TTL** based on your needs (lower = fresher data, higher = less API calls)
3. **Monitor rate limits** to avoid API throttling
4. **Use pagination** for large result sets
5. **Scale horizontally** with multiple instances sharing Redis

Happy coding! 🚀
