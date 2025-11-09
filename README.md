# Eterna - Real-time Data Aggregation Service

A high-performance real-time data aggregation service for meme coin trading data from multiple DEX sources with WebSocket support for live updates.

## 🚀 Features

- **Multi-Source Aggregation**: Fetches and merges data from DexScreener and GeckoTerminal APIs
- **Intelligent Caching**: Redis-based caching with fallback to in-memory cache (configurable 30s TTL)
- **Rate Limiting**: Exponential backoff retry mechanism to handle API rate limits
- **Real-time Updates**: WebSocket server for live price updates and volume spike notifications
- **Advanced Filtering**: Filter by time periods (1h, 24h, 7d) and sort by multiple metrics
- **Cursor-based Pagination**: Efficient pagination for large token lists
- **Error Recovery**: Robust error handling with circuit breaker pattern

## 📋 API Endpoints

### REST API

- `GET /` - API information
- `GET /api/health` - Health check endpoint
- `GET /api/tokens` - List tokens with filtering, sorting, and pagination
- `GET /api/tokens/:address` - Get specific token by address
- `GET /api/search?q=query` - Search for tokens

### Query Parameters for `/api/tokens`

- `limit` - Number of tokens per page (default: 30)
- `cursor` - Pagination cursor
- `sortBy` - Sort field: `volume`, `price_change`, `market_cap`, `liquidity`
- `sortOrder` - Sort order: `asc`, `desc`
- `timePeriod` - Time period: `1h`, `24h`, `7d`

### WebSocket Events

- `initial_data` - Initial token data on connection
- `price_update` - Real-time price updates (>1% change)
- `volume_spike` - Volume spike notifications (>50% increase)
- `error` - Error notifications

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: Express.js
- **WebSocket**: Socket.io
- **Cache**: Redis (with ioredis client) + In-memory fallback
- **HTTP Client**: Axios with retry logic
- **Testing**: Jest with Supertest
- **Linting**: ESLint with TypeScript plugin

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- Redis (optional, but recommended)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/HymaJayaram-067/Eterna.git
cd Eterna
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=3000
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=30
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Using Docker

Build and run with Docker Compose:
```bash
docker-compose up -d
```

This will start both the API server and Redis.

Access the API at `http://localhost:3000`

To stop:
```bash
docker-compose down
```

### Using Development Helper

```bash
# Complete setup (install dependencies + Redis)
./dev.sh setup

# Start development server
./dev.sh dev

# Run tests
./dev.sh test

# See all commands
./dev.sh help
```

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 📡 API Usage Examples

### Get Tokens with Sorting
```bash
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"
```

### Search for Tokens
```bash
curl "http://localhost:3000/api/search?q=bonk"
```

### Get Token by Address
```bash
curl "http://localhost:3000/api/tokens/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
```

### WebSocket Connection (JavaScript)
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('initial_data', (data) => {
  console.log('Initial tokens:', data);
});

socket.on('price_update', (data) => {
  console.log('Price update:', data);
});

socket.on('volume_spike', (data) => {
  console.log('Volume spike:', data);
});
```

## 🏗️ Architecture & Design Decisions

### 1. Multi-Source Aggregation
The service fetches data from multiple DEX APIs in parallel and intelligently merges duplicate tokens by:
- Averaging price data
- Taking maximum volume and liquidity values
- Maintaining source attribution
- Using the most recent timestamp

### 2. Caching Strategy
**Two-tier caching approach:**
- **Primary**: Redis for distributed caching (production)
- **Fallback**: In-memory cache when Redis is unavailable
- **TTL**: Configurable (default 30 seconds)
- **Cache invalidation**: Automatic based on TTL

### 3. Rate Limiting & Error Recovery
- **Rate limiter** with sliding window algorithm
- **Exponential backoff** retry mechanism (3 retries with increasing delays)
- **Circuit breaker** pattern to prevent cascading failures
- **Smart retry logic**: Don't retry on 4xx errors (except 429)

### 4. Real-time Updates
- **WebSocket server** using Socket.io for bi-directional communication
- **Periodic updates** every 5 seconds (configurable)
- **Intelligent notifications**:
  - Price updates for >1% changes
  - Volume spikes for >50% increases
- **Efficient broadcasting** to all connected clients

### 5. Data Flow
```
External APIs → Rate Limiter → Retry Logic → Aggregation → Cache → REST/WebSocket → Client
```

### 6. Scalability Considerations
- Stateless design for horizontal scaling
- Redis for shared cache across instances
- Configurable update intervals
- Cursor-based pagination for large datasets

## 🧪 Testing

The project includes comprehensive test coverage:

- **Unit tests**: Rate limiter, retry logic
- **Integration tests**: Aggregation service, API endpoints
- **API tests**: All REST endpoints with various scenarios

Run tests with coverage:
```bash
npm test
```

## 📊 Postman Collection

Import `postman_collection.json` into Postman to test all endpoints. The collection includes:
- Health check
- Token listing with various filters
- Search functionality
- Pagination examples
- Token detail retrieval

## 🌐 Deployment

The application can be deployed to any platform that supports Node.js:

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render
1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables

### Heroku
```bash
heroku create eterna-api
git push heroku main
```

## 🔐 Security Considerations

- No sensitive API keys stored in code
- Environment variables for configuration
- Input validation on all endpoints
- Rate limiting to prevent abuse
- CORS enabled for cross-origin requests

## 📈 Performance Optimization

- **Parallel API calls** for faster data aggregation
- **Connection pooling** for Redis
- **Efficient caching** reduces API calls by ~90%
- **Cursor-based pagination** for large datasets
- **In-memory fallback** ensures availability

## 🐛 Error Handling

The service includes comprehensive error handling:
- API failures with retry logic
- Cache failures with fallback
- WebSocket connection errors
- Invalid input validation
- Graceful degradation when services are unavailable

## 📝 License

ISC

## 👨‍💻 Author

HymaJayaram-067

## 🙏 Acknowledgments

- DexScreener API
- GeckoTerminal API
- Axiom.trade for inspiration