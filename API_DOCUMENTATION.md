# API Documentation

## Base URL
- Development: `http://localhost:3000`
- Production: `https://your-deployment-url.com`

## Authentication
No authentication required for this version.

## REST API Endpoints

### 1. Root Endpoint
Get API information and available endpoints.

**Endpoint:** `GET /`

**Response:**
```json
{
  "name": "Eterna - Real-time Data Aggregation Service",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "tokens": "/api/tokens",
    "tokenByAddress": "/api/tokens/:address",
    "search": "/api/search?q=query"
  },
  "websocket": {
    "enabled": true,
    "updateInterval": 5000
  }
}
```

### 2. Health Check
Check if the API is running and healthy.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-09T05:00:00.000Z",
  "uptime": 123.456
}
```

### 3. List Tokens
Get a paginated list of tokens with optional filtering and sorting.

**Endpoint:** `GET /api/tokens`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| limit | number | Number of tokens per page (1-100) | 30 |
| cursor | string | Pagination cursor from previous response | - |
| sortBy | string | Sort field: `volume`, `price_change`, `market_cap`, `liquidity` | - |
| sortOrder | string | Sort order: `asc`, `desc` | `desc` |
| timePeriod | string | Time period: `1h`, `24h`, `7d` | - |

**Example Request:**
```bash
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"
```

**Response:**
```json
{
  "data": [
    {
      "token_address": "576P1t7XsRL4ZVj38LV2eYWxXRPguBADA8BxcNz1xo8y",
      "token_name": "PIPE CTO",
      "token_ticker": "PIPE",
      "price_sol": 0.00000044141209798877615,
      "market_cap_sol": 441.41209798877617,
      "volume_sol": 1322.4350391679925,
      "liquidity_sol": 149.359428555,
      "transaction_count": 2205,
      "price_1hr_change": 120.61,
      "price_24hr_change": 85.23,
      "price_7d_change": 0,
      "protocol": "Raydium CLMM",
      "source": "DexScreener",
      "last_updated": 1699502400000
    }
  ],
  "pagination": {
    "limit": 10,
    "nextCursor": "10",
    "hasMore": true
  }
}
```

### 4. Get Token by Address
Get detailed information about a specific token.

**Endpoint:** `GET /api/tokens/:address`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| address | string | Token contract address |

**Example Request:**
```bash
curl "http://localhost:3000/api/tokens/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
```

**Success Response (200):**
```json
{
  "token_address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  "token_name": "Bonk",
  "token_ticker": "BONK",
  "price_sol": 0.00000123,
  "market_cap_sol": 123456.78,
  "volume_sol": 45678.90,
  "liquidity_sol": 12345.67,
  "transaction_count": 15234,
  "price_1hr_change": 2.5,
  "price_24hr_change": 15.3,
  "price_7d_change": 0,
  "protocol": "Raydium",
  "source": "DexScreener,GeckoTerminal",
  "last_updated": 1699502400000
}
```

**Error Response (404):**
```json
{
  "error": "Token not found",
  "address": "invalid-address"
}
```

### 5. Search Tokens
Search for tokens by name or symbol.

**Endpoint:** `GET /api/search`

**Query Parameters:**
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| q | string | Search query | Yes |

**Example Request:**
```bash
curl "http://localhost:3000/api/search?q=bonk"
```

**Response:**
```json
{
  "data": [
    {
      "token_address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      "token_name": "Bonk",
      "token_ticker": "BONK",
      "price_sol": 0.00000123,
      "market_cap_sol": 123456.78,
      "volume_sol": 45678.90,
      "liquidity_sol": 12345.67,
      "transaction_count": 15234,
      "price_1hr_change": 2.5,
      "price_24hr_change": 15.3,
      "protocol": "Raydium",
      "source": "DexScreener",
      "last_updated": 1699502400000
    }
  ]
}
```

**Error Response (400):**
```json
{
  "error": "Missing query parameter",
  "message": "Please provide a search query using the \"q\" parameter"
}
```

## WebSocket API

### Connection
Connect to the WebSocket server at the base URL.

**URL:** `ws://localhost:3000` (development)

**Example (JavaScript):**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});
```

### Events

#### 1. Initial Data
Sent immediately after connection with current token data.

**Event:** `initial_data`

**Payload:**
```json
{
  "type": "initial_data",
  "data": [
    {
      "token_address": "...",
      "token_name": "...",
      "token_ticker": "...",
      ...
    }
  ],
  "timestamp": 1699502400000
}
```

#### 2. Price Update
Sent when a token's price changes by more than 1%.

**Event:** `price_update`

**Payload:**
```json
{
  "type": "price_update",
  "data": {
    "token_address": "...",
    "token_name": "...",
    "token_ticker": "...",
    "price_sol": 0.00000123,
    ...
  },
  "timestamp": 1699502400000
}
```

#### 3. Volume Spike
Sent when a token's volume increases by more than 50%.

**Event:** `volume_spike`

**Payload:**
```json
{
  "type": "volume_spike",
  "data": {
    "token_address": "...",
    "token_name": "...",
    "token_ticker": "...",
    "volume_sol": 12345.67,
    ...
  },
  "timestamp": 1699502400000
}
```

#### 4. Error
Sent when an error occurs.

**Event:** `error`

**Payload:**
```json
{
  "type": "error",
  "error": "Error message",
  "timestamp": 1699502400000
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

## Rate Limiting

The API implements rate limiting for external DEX API calls:
- DexScreener: 300 requests per minute
- GeckoTerminal: 30 requests per minute

Internal API endpoints are not rate-limited but use caching to reduce load.

## Caching

- Default cache TTL: 30 seconds
- Cache is shared across all requests
- Cache key includes query parameters
- Falls back to in-memory cache if Redis is unavailable

## Example Usage

### Fetch Top 10 Tokens by Volume
```bash
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"
```

### Search for a Specific Token
```bash
curl "http://localhost:3000/api/search?q=bonk"
```

### Get Token Details
```bash
curl "http://localhost:3000/api/tokens/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
```

### WebSocket Connection (Browser)
```javascript
const socket = io('http://localhost:3000');

socket.on('initial_data', (message) => {
  console.log('Initial tokens:', message.data);
});

socket.on('price_update', (message) => {
  console.log(`${message.data.token_ticker} price changed!`);
});

socket.on('volume_spike', (message) => {
  console.log(`${message.data.token_ticker} volume spike!`);
});
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/HymaJayaram-067/Eterna/issues
- Documentation: See README.md
