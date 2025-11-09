# Quick Start Guide

Get up and running with Eterna (with UI) in under 5 minutes!

## Prerequisites

- Node.js 18+ installed
- (Optional) Redis installed locally for caching

## Installation

```bash
# Clone the repository
git clone https://github.com/HymaJayaram-067/Eterna.git
cd Eterna

# Install all dependencies (backend + frontend)
npm run install:all
# Or install separately:
# npm install              # Backend
# cd frontend && npm install  # Frontend

# Create environment file
cp .env.example .env
```

## Running Locally

### Option 1: Development Mode (Recommended)

Run backend and frontend separately for hot reload:

**Terminal 1 - Backend:**
```bash
npm run dev
```
Backend runs on http://localhost:3000

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```
Frontend runs on http://localhost:3001

Open http://localhost:3001 in your browser to see the UI!

### Option 2: Production Build

```bash
# Build everything (backend + frontend)
npm run build

# Start the server
npm start
```

Open http://localhost:3000 to see the integrated UI!

### Option 3: Docker

```bash
# Using Docker Compose (includes Redis)
docker-compose up

# Or just Docker
docker build -t eterna .
docker run -p 3000:3000 eterna
```

## Testing the Application

### Using the Web UI

1. **Open the UI** in your browser (http://localhost:3001 in dev mode, or http://localhost:3000 in production)
2. **Watch for real-time updates** - Tokens with significant changes will highlight automatically
3. **Try the filters**:
   - Change sort order (Volume, Price Change, Market Cap, Liquidity)
   - Select time periods (1h, 24h, 7d)
   - Set minimum volume or market cap thresholds
4. **View the charts** showing top tokens by volume and market cap
5. **Monitor connection status** in the header (should show "Live")

### Using the REST API (curl)

```bash
# Get service info
curl http://localhost:3000/

# Check health
curl http://localhost:3000/api/health

# Get tokens
curl http://localhost:3000/api/tokens

# Get tokens with filters
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10&timePeriod=24h"

# Get configuration
curl http://localhost:3000/api/config

# Update cache TTL
curl -X PUT "http://localhost:3000/api/config/cache-ttl" \
  -H "Content-Type: application/json" \
  -d '{"ttl": 60}'

# Refresh cache
curl -X POST http://localhost:3000/api/refresh
```

### Testing WebSocket

Option 1: Use the React UI (automatic WebSocket connection)

Option 2: Use the standalone test client:
1. Open `websocket-client.html` in your browser
2. Click "Connect"
3. Watch live token updates!

## Running Tests

```bash
# Backend tests
npm test

# Backend tests in watch mode
npm run test:watch

# Frontend tests
cd frontend
npm test

# Integration tests
./test-integration.sh http://localhost:3000
```

## Common Issues

### Frontend Issues

#### Frontend Won't Start
**Error**: Port 3001 already in use

**Solution**: React will automatically offer to use a different port. Press 'y' when prompted.

#### Cannot Connect to Backend
**Error**: Network error or API calls failing

**Solution**:
1. Ensure backend is running on port 3000
2. Check `frontend/package.json` has `"proxy": "http://localhost:3000"`
3. Verify REACT_APP_API_URL in `frontend/.env.development`

#### WebSocket Not Connecting
**Error**: Connection status shows "Disconnected"

**Solution**:
1. Verify backend is running
2. Check browser console for errors
3. Ensure REACT_APP_WS_URL is set correctly
4. Check for firewall/proxy blocking WebSocket

### Backend Issues

#### Redis Connection Error

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
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # React components (Header, Filters, TokenCard, Charts)
│   │   ├── services/     # API and WebSocket services
│   │   ├── types.ts      # TypeScript type definitions
│   │   └── App.tsx       # Main application component
│   ├── public/           # Static assets
│   └── build/            # Production build (after npm run build)
├── src/                  # Backend source code
│   ├── api/             # REST API routes
│   ├── services/        # Business logic & API clients
│   ├── websocket/       # WebSocket server
│   ├── utils/           # Utilities
│   └── index.ts         # Entry point
├── dist/                # Compiled JavaScript (after build)
├── .env                 # Environment variables
└── package.json         # Project configuration
```

## API Quick Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service information (or UI in production) |
| GET | `/api/health` | Health check |
| GET | `/api/config` | Get current configuration |
| PUT | `/api/config/cache-ttl` | Update cache TTL |
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
| `timePeriod` | string | Time period for price changes (1h, 24h, 7d) | `?timePeriod=24h` |
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

1. **Explore the UI** - Try the filtering, sorting, and real-time updates
2. **Explore the API** - Use curl or Postman to test endpoints
3. **Watch WebSocket updates** - See real-time price and volume changes
4. **Read the docs** - Check README.md, FRONTEND.md, and DEPLOYMENT.md
5. **Deploy** - Follow DEPLOYMENT.md to deploy to production
6. **Customize** - Modify rate limits, cache TTL, UI components, etc.

## Getting Help

- 📖 **Documentation**: 
  - README.md - Complete project documentation
  - FRONTEND.md - Frontend architecture and components
  - DEPLOYMENT.md - Production deployment guide
  - TESTING.md - Testing guidelines
  - PROJECT_SUMMARY.md - Design decisions
- 🐛 **Issues**: Check logs in console for debugging
- 💬 **Questions**: Review documentation or check GitHub issues

## Performance Tips

1. **Enable Redis** for better caching performance
2. **Adjust CACHE_TTL** based on your needs (lower = fresher data, higher = less API calls)
3. **Monitor rate limits** to avoid API throttling
4. **Use pagination** for large result sets
5. **Scale horizontally** with multiple instances sharing Redis

Happy coding! 🚀
