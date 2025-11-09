# Demo Video Script (1-2 minutes)

## Scene 1: Introduction (15 seconds)
**Visual**: Show README or title screen
**Script**:
"Hi! This is Eterna - a production-ready real-time data aggregation service for meme coins. It fetches data from multiple DEX sources, caches intelligently, and provides WebSocket updates. Let me show you how it works."

## Scene 2: Architecture Overview (15 seconds)
**Visual**: Show ARCHITECTURE.md diagram or draw simple flow
**Script**:
"The system aggregates data from DexScreener and GeckoTerminal APIs, merges duplicates, caches in Redis with a 30-second TTL, and broadcasts updates via WebSocket every 5 seconds. It handles rate limiting with exponential backoff automatically."

## Scene 3: API Demo (20 seconds)
**Visual**: Terminal showing curl commands and responses
**Script**:
"Let's test the REST API. First, the health check..."
```bash
curl localhost:3000/api/health
```
"Now fetch tokens sorted by volume..."
```bash
curl localhost:3000/api/tokens?sortBy=volume&limit=5 | jq
```
"Notice the response time - this is cached. Watch how pagination works..."
```bash
curl localhost:3000/api/tokens?limit=5&cursor=5 | jq
```

## Scene 4: Load Testing (20 seconds)
**Visual**: Run load test script
**Script**:
"Now let's test performance with rapid API calls..."
```bash
./scripts/load-test.sh http://localhost:3000 10
```
**Visual**: Show results
"As you can see, cached responses are under 50ms, with the first request around 200-500ms. Cache hit rate is excellent."

## Scene 5: WebSocket Demo (25 seconds)
**Visual**: Open http://localhost:3000 in browser
**Script**:
"Here's the interactive dashboard. It connects via WebSocket and shows live token data."

**Visual**: Open second browser tab with the same URL
"Watch this - I'll open a second tab. Both tabs receive real-time updates simultaneously."

**Visual**: Show update log filling in
"See the update log? These are live price changes and volume spikes being broadcast in real-time."

**Visual**: Click filters, apply different sorts
"I can filter by volume, sort by price change, and the data updates instantly without new HTTP requests - everything comes through WebSocket."

## Scene 6: System Design (15 seconds)
**Visual**: Show code structure or architecture doc
**Script**:
"The codebase is well-structured with services, API routes, WebSocket handlers, and comprehensive tests. We have 27 passing tests with over 80% coverage, rate limiting, error handling, and Docker support."

## Scene 7: Deployment Ready (10 seconds)
**Visual**: Show DEPLOYMENT.md or Docker Compose
**Script**:
"It's deployment-ready with Docker Compose, Render, Railway, and Heroku configurations. Just one command to get started..."
```bash
docker-compose up
```

## Closing (5 seconds)
**Visual**: Show GitHub repo or README
**Script**:
"Check out the full code and documentation on GitHub. Thanks for watching!"

---

## Recording Tips

1. **Screen Resolution**: 1920x1080 or 1280x720
2. **Font Size**: Increase terminal font to 16-18pt
3. **Recording Tool**: OBS Studio or QuickTime
4. **Audio**: Clear microphone, quiet environment
5. **Speed**: Speak clearly, not too fast
6. **Preparation**: 
   - Have all terminals/browsers open
   - Test all commands beforehand
   - Clear terminal history
   - Use syntax highlighting

## Quick Commands Checklist

Start services:
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start app
npm run dev
```

Prepare browsers:
```bash
# Open in browser
open http://localhost:3000
```

Have ready in terminals:
```bash
# Health check
curl localhost:3000/api/health | jq

# Get tokens
curl localhost:3000/api/tokens?sortBy=volume&limit=5 | jq

# Pagination
curl localhost:3000/api/tokens?limit=5&cursor=0 | jq

# Load test
./scripts/load-test.sh http://localhost:3000 10
```

## Upload Checklist

- [ ] Video is 1-2 minutes
- [ ] Shows API working with live data
- [ ] Multiple browser tabs showing WebSocket
- [ ] Load test with response times
- [ ] Architecture explanation
- [ ] Audio is clear
- [ ] Upload to YouTube (unlisted or public)
- [ ] Add to README.md

## YouTube Description Template

```
Eterna - Real-time Data Aggregation Service Demo

This video demonstrates a production-ready service that aggregates meme coin data from multiple DEX sources with efficient caching and WebSocket updates.

Features shown:
✅ REST API with filtering and pagination
✅ WebSocket real-time updates
✅ Multi-source data aggregation
✅ Redis caching with 30s TTL
✅ Rate limiting and error handling
✅ Load testing with rapid API calls
✅ Multiple browser tabs sync

Tech Stack:
- Node.js + TypeScript
- Express.js + Socket.io
- Redis (ioredis)
- DexScreener & GeckoTerminal APIs

GitHub: https://github.com/HymaJayaram-067/Eterna
Live Demo: [Add deployed URL]

Timestamps:
0:00 Introduction
0:15 Architecture
0:30 REST API Demo
0:50 Load Testing
1:15 WebSocket Real-time Updates
1:40 System Design
1:50 Deployment

#blockchain #cryptocurrency #websocket #nodejs #typescript #redis
```
