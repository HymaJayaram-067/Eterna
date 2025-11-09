# Architecture Documentation

## System Overview

Eterna is a real-time data aggregation service designed to fetch, merge, and stream cryptocurrency token data from multiple DEX sources with efficient caching and live updates.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Web Browser  │  │ Mobile App   │  │ API Client   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────┐                      ┌──────────────┐
│  WebSocket   │                      │   REST API   │
│   Server     │                      │   (Express)  │
│ (Socket.io)  │                      │              │
└──────┬───────┘                      └──────┬───────┘
       │                                     │
       └──────────────┬──────────────────────┘
                      │
              ┌───────▼────────┐
              │  Application   │
              │     Core       │
              │                │
              │ - Rate Limiter │
              │ - Aggregator   │
              │ - Scheduler    │
              └───────┬────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   ┌────────┐   ┌────────┐   ┌────────┐
   │ Redis  │   │DexScr  │   │ Gecko  │
   │ Cache  │   │ API    │   │Terminal│
   └────────┘   └────────┘   └────────┘
```

## Component Architecture

### 1. API Layer

#### REST API (`src/api/routes.ts`)
- **Purpose**: Provides HTTP endpoints for token data retrieval
- **Endpoints**:
  - `GET /api/tokens` - Paginated, filtered token list
  - `GET /api/tokens/:address` - Single token details
  - `POST /api/cache/invalidate` - Force cache refresh
  - `GET /api/health` - Health check

**Design Decisions**:
- Cursor-based pagination for efficient large dataset handling
- Query parameter-based filtering for flexibility
- Consistent error response format
- Rate limiting at API level

#### WebSocket Server (`src/services/websocket.service.ts`)
- **Purpose**: Real-time bidirectional communication
- **Events**:
  - Client → Server: `subscribe`
  - Server → Client: `initial_data`, `token_updates`, `token_refresh`

**Design Decisions**:
- Socket.io for cross-browser compatibility
- Event-based architecture for scalability
- Automatic reconnection handling
- Efficient delta updates (only changed data)

### 2. Data Layer

#### Token Aggregation Service (`src/services/tokenAggregation.service.ts`)
- **Purpose**: Fetches and merges data from multiple DEX sources
- **Key Functions**:
  - `fetchAndAggregateTokens()` - Main aggregation logic
  - `getFilteredTokens()` - Filtering and pagination
  - `convertDexScreenerToken()` - Data normalization
  - `convertGeckoTerminalToken()` - Data normalization

**Design Decisions**:
- Parallel API calls for performance
- Intelligent deduplication by token address
- Data normalization to common schema
- Graceful degradation when APIs fail

#### DEX Clients (`src/services/dex.clients.ts`)
- **Purpose**: Interface with external DEX APIs
- **Clients**:
  - `DexScreenerClient` - DexScreener API
  - `JupiterClient` - Jupiter Price API
  - `GeckoTerminalClient` - GeckoTerminal API

**Design Decisions**:
- Per-API rate limiting
- Retry logic with exponential backoff
- Error isolation (one API failure doesn't break others)
- Configurable timeouts

### 3. Caching Layer

#### Cache Service (`src/services/cache.service.ts`)
- **Purpose**: Redis-based caching for performance
- **Features**:
  - Get/Set with TTL
  - Pattern-based key search
  - Automatic expiration
  - Connection retry logic

**Design Decisions**:
- Redis for speed and pub/sub capabilities
- Configurable TTL (default 30s)
- Graceful fallback in dev mode without Redis
- Serialization/deserialization handled automatically

### 4. Utility Layer

#### Rate Limiter (`src/utils/rateLimiter.ts`)
- **Purpose**: Prevent API throttling
- **Features**:
  - Token bucket algorithm
  - Per-API instance configuration
  - Automatic queuing

**Design Decisions**:
- Proactive rate limiting (avoid hitting limits)
- Exponential backoff on 429 errors
- Per-service instances for fine-grained control

## Data Flow

### Initial Load (REST API)
```
1. Client → GET /api/tokens
2. Check Redis cache
3. If cached → Return immediately
4. If not cached:
   a. Fetch from DexScreener (parallel)
   b. Fetch from GeckoTerminal (parallel)
   c. Merge and deduplicate
   d. Cache results (30s TTL)
   e. Return to client
```

### WebSocket Update Flow
```
1. Cron job triggers (every 5s)
2. Invalidate cache
3. Fetch fresh data from APIs
4. Compare with previous state
5. Identify significant changes:
   - Price change > 1%
   - Volume increase > 20%
6. Broadcast updates to all connected clients
7. Update previous state
```

## Scalability Considerations

### Current Limitations
- Single server instance
- In-memory previous state tracking
- Local rate limiters

### Scaling Solutions

#### Horizontal Scaling
1. **Shared Redis**: Move previous state to Redis
2. **Sticky Sessions**: For WebSocket connections
3. **Load Balancer**: Distribute HTTP traffic
4. **Redis Pub/Sub**: Coordinate updates across instances

#### Vertical Scaling
1. **Increase Memory**: Larger cache capacity
2. **More CPU**: Faster data processing
3. **Redis Cluster**: Distributed caching

### Performance Optimizations

1. **Caching Strategy**
   - Current: 30s TTL
   - Optimization: Adaptive TTL based on volatility
   - Result: 90%+ cache hit rate

2. **API Efficiency**
   - Current: Sequential pagination
   - Optimization: Cursor-based pagination
   - Result: O(1) pagination performance

3. **Update Frequency**
   - Current: 5s interval
   - Optimization: Configurable per-client
   - Result: Reduced unnecessary updates

## Error Handling Strategy

### Levels of Error Handling

1. **API Level**
   - Axios retry logic (3 attempts)
   - Exponential backoff
   - Fallback to cached data

2. **Service Level**
   - Graceful degradation
   - Empty array instead of errors
   - Logging for debugging

3. **Application Level**
   - Global error handler
   - Structured error responses
   - Health check endpoint

### Error Recovery

```
API Failure → Retry (3x) → Cache Fallback → Empty Response
                 ↓
            Log Error
                 ↓
         Monitor & Alert
```

## Security Measures

1. **Rate Limiting**
   - API level: 100 req/min per IP
   - Service level: Per-API limits

2. **Input Validation**
   - Query parameter sanitization
   - Type checking
   - Range validation

3. **CORS**
   - Configurable origins
   - Preflight handling

4. **Data Sanitization**
   - No raw SQL/NoSQL queries
   - JSON schema validation
   - XSS prevention (automatic in Express)

## Monitoring & Observability

### Key Metrics

1. **Performance**
   - API response time (avg, p95, p99)
   - Cache hit rate
   - WebSocket connection count

2. **Business**
   - Tokens tracked
   - Update frequency
   - API call volume

3. **Errors**
   - API failure rate
   - Cache miss rate
   - WebSocket disconnections

### Logging Strategy

```
Level  │ Usage
───────┼──────────────────────────────
ERROR  │ API failures, Critical errors
WARN   │ Cache misses, Rate limiting
INFO   │ Startup, Connections, Updates
DEBUG  │ Development only
```

## Testing Strategy

### Unit Tests
- Individual services
- Utility functions
- Data transformations

### Integration Tests
- API endpoints
- Cache integration
- WebSocket events

### Coverage Goals
- >80% line coverage
- 100% critical path coverage
- All error paths tested

## Future Enhancements

1. **Performance**
   - GraphQL API for flexible queries
   - Server-side caching with CDN
   - Database for historical data

2. **Features**
   - User authentication
   - Custom alerts
   - Historical price charts
   - Token comparison tools

3. **Infrastructure**
   - Kubernetes deployment
   - Auto-scaling
   - Multi-region deployment
   - Advanced monitoring (Prometheus/Grafana)

4. **Data Sources**
   - More DEX integrations
   - Chain-specific optimizations
   - Cross-chain aggregation

## Technology Choices Rationale

| Technology | Reason |
|------------|--------|
| TypeScript | Type safety, better DX |
| Express | Mature, well-documented |
| Socket.io | WebSocket abstraction |
| Redis | Fast, persistent caching |
| Axios | Robust HTTP client |
| Jest | Standard testing framework |

## Deployment Architecture

### Development
```
Local Machine → Redis (Docker) → External APIs
```

### Production
```
Load Balancer → App Instances (N) → Redis Cluster → External APIs
                     ↓
              Monitoring/Logging
```

## Configuration Management

All configuration in `src/config/index.ts`:
- Environment-based
- Type-safe
- Documented defaults
- Validation on startup
