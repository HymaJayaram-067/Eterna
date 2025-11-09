# Deployment Guide

## Deploying to Render

Render is recommended for easy deployment with Redis support.

### Steps:

1. **Create a Render Account**: Sign up at [render.com](https://render.com)

2. **Create a Redis Instance**:
   - Click "New +" → "Redis"
   - Name: `eterna-redis`
   - Plan: Free
   - Click "Create Redis"
   - Copy the Internal Redis URL

3. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configuration:
     - Name: `eterna-aggregator`
     - Environment: `Node`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Plan: Free

4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   REDIS_URL=<your-redis-internal-url>
   CACHE_TTL=30
   REFRESH_INTERVAL=30
   ```

5. **Deploy**: Click "Create Web Service"

Your service will be available at: `https://eterna-aggregator.onrender.com`

---

## Deploying to Railway

Railway offers $5 free credit and easy setup.

### Steps:

1. **Create Railway Account**: Sign up at [railway.app](https://railway.app)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add Redis**:
   - Click "New" → "Database" → "Add Redis"
   - Railway will automatically set `REDIS_URL`

4. **Configure Service**:
   - Add environment variables:
     ```
     NODE_ENV=production
     PORT=3000
     CACHE_TTL=30
     REFRESH_INTERVAL=30
     ```

5. **Generate Domain**:
   - Go to Settings → Generate Domain

Your service will be available at the generated domain.

---

## Deploying to Fly.io

Fly.io offers global edge deployment.

### Steps:

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Create fly.toml**:
   ```toml
   app = "eterna-aggregator"
   
   [build]
     builder = "paketobuildpacks/builder:base"
   
   [[services]]
     internal_port = 3000
     protocol = "tcp"
   
     [[services.ports]]
       handlers = ["http"]
       port = 80
   
     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```

4. **Deploy**:
   ```bash
   fly launch
   fly deploy
   ```

5. **Add Redis** (Optional - requires paid plan):
   ```bash
   fly redis create
   fly secrets set REDIS_URL=<redis-url>
   ```

---

## Environment Variables

Ensure these are set in your deployment:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Environment mode |
| `PORT` | Yes | 3000 | Server port |
| `REDIS_URL` | No | redis://localhost:6379 | Redis connection URL |
| `CACHE_TTL` | No | 30 | Cache TTL in seconds |
| `REFRESH_INTERVAL` | No | 30 | Data refresh interval in seconds |
| `DEXSCREENER_RATE_LIMIT` | No | 300 | DexScreener requests per minute |
| `JUPITER_RATE_LIMIT` | No | 600 | Jupiter requests per minute |
| `GECKOTERMINAL_RATE_LIMIT` | No | 300 | GeckoTerminal requests per minute |

---

## Post-Deployment Verification

1. **Test Health Endpoint**:
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Test Tokens Endpoint**:
   ```bash
   curl https://your-domain.com/api/tokens?limit=5
   ```

3. **Test WebSocket**:
   - Open `websocket-client.html` in browser
   - Update the connection URL to your deployment URL
   - Click "Connect" and verify data loads

4. **Import Postman Collection**:
   - Import `postman_collection.json`
   - Update `baseUrl` variable to your deployment URL
   - Run all requests

---

## Monitoring

### Logs

- **Render**: Dashboard → Logs tab
- **Railway**: Project → Deployments → View Logs
- **Fly.io**: `fly logs`

### Metrics

Monitor:
- Response times (should be <100ms for cached requests)
- Error rates (should be <1%)
- WebSocket connections
- Redis hit rate

---

## Troubleshooting

### Issue: Service crashes on startup

**Solution**: Check logs for Redis connection errors. If Redis is unavailable, the service should still start (it falls back to no caching).

### Issue: No token data returned

**Solution**: 
1. Check if APIs are responding: Test DexScreener, Jupiter, GeckoTerminal directly
2. Check rate limits in logs
3. Verify network connectivity from deployment platform

### Issue: WebSocket not connecting

**Solution**:
1. Ensure CORS is enabled (it is by default)
2. Check if WebSocket protocol is supported by hosting platform
3. Update client to use `wss://` for HTTPS deployments

---

## Scaling

### Horizontal Scaling

The service is stateless and can be scaled horizontally:
- Multiple instances can share the same Redis cache
- Load balancer will distribute WebSocket connections
- Each instance refreshes cache independently (Redis handles deduplication)

### Vertical Scaling

If needed, increase:
- Memory (if caching many tokens)
- CPU (if handling many WebSocket connections)

Recommended for high traffic:
- 512MB RAM
- 1 vCPU
- Redis with persistence enabled
