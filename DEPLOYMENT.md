# Deployment Guide

This guide covers deploying the Eterna service to various hosting platforms.

## Prerequisites

- GitHub account with repository access
- Redis instance (or use free tier from Redis Labs, Upstash, or Railway)

## Option 1: Deploy to Render (Recommended - Free Tier Available)

### Step 1: Setup Redis

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Redis"
3. Choose a name (e.g., `eterna-redis`)
4. Select free tier
5. Click "Create Redis"
6. Copy the "Internal Redis URL" (format: `redis://...`)

### Step 2: Deploy Application

1. From Render Dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `eterna-service`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3000` (Render will override with their port)
   - `REDIS_URL` = (paste your Internal Redis URL from Step 1)
   - `CACHE_TTL` = `30`

5. Click "Create Web Service"

6. Wait for deployment to complete (~5 minutes)

7. Your service will be available at: `https://eterna-service.onrender.com`

### Important Notes for Render:
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Upgrade to paid tier ($7/mo) for always-on service

## Option 2: Deploy to Railway

### Step 1: Setup Redis

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Provision Redis"
3. Copy the connection URL from the Redis variables

### Step 2: Deploy Application

1. Click "New" → "GitHub Repo"
2. Select your repository
3. Railway will auto-detect Node.js
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `REDIS_URL` = (paste your Redis URL from Step 1)
   - `CACHE_TTL` = `30`

5. Deploy

Your service will be at: `https://your-app.railway.app`

## Option 3: Deploy with Docker (Any Platform)

### Using Docker Compose (Local/VPS)

```bash
# Clone repository
git clone https://github.com/HymaJayaram-067/Eterna.git
cd Eterna

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop services
docker-compose down
```

Access at: `http://localhost:3000`

### Deploy to Docker-compatible platforms (Fly.io, DigitalOcean, etc.)

1. Build image:
```bash
docker build -t eterna:latest .
```

2. Push to registry:
```bash
docker tag eterna:latest your-registry/eterna:latest
docker push your-registry/eterna:latest
```

3. Deploy according to platform instructions

## Option 4: Deploy to Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create eterna-service`
4. Add Redis: `heroku addons:create heroku-redis:mini`
5. Set env vars:
```bash
heroku config:set NODE_ENV=production
heroku config:set CACHE_TTL=30
```
6. Deploy:
```bash
git push heroku main
```

## Post-Deployment Verification

### 1. Check Health Endpoint
```bash
curl https://your-app-url/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-11-09T12:00:00.000Z"
}
```

### 2. Test API
```bash
curl https://your-app-url/api/tokens?limit=5
```

### 3. Test WebSocket
Open browser to: `https://your-app-url/`

You should see the live dashboard with token data.

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `REDIS_URL` | Yes | - | Redis connection string |
| `CACHE_TTL` | No | `30` | Cache TTL in seconds |

## Troubleshooting

### Redis Connection Fails
- Verify `REDIS_URL` is correct
- Check if Redis service is running
- Ensure network connectivity between app and Redis

### WebSocket Not Working
- Ensure CORS is configured correctly
- Check if platform supports WebSocket connections
- Verify Socket.io client version matches server

### High Memory Usage
- Reduce `CACHE_TTL` to lower cache size
- Limit number of tokens cached
- Monitor Redis memory usage

### API Rate Limiting Issues
- DEX APIs have rate limits
- Service automatically handles backoff
- Consider caching more aggressively

## Performance Optimization

1. **Increase Cache TTL** for less frequent updates:
   ```
   CACHE_TTL=60
   ```

2. **Use Redis persistence** for faster cold starts

3. **Enable compression** in production:
   ```javascript
   app.use(compression());
   ```

4. **Monitor performance** with APM tools like New Relic or DataDog

## Security Checklist

- ✅ Environment variables stored securely
- ✅ Rate limiting enabled
- ✅ CORS configured appropriately
- ✅ No secrets in code
- ✅ HTTPS enabled (automatic on most platforms)
- ✅ Redis password protected (if using external Redis)

## Monitoring

### Recommended Metrics to Track
- API response times
- Cache hit rate
- WebSocket connection count
- API error rates
- Redis memory usage

### Logging
- Application logs available via platform dashboard
- Consider using external logging service (Papertrail, Loggly)

## Scaling Considerations

### Horizontal Scaling
- Use shared Redis instance
- Enable sticky sessions for WebSocket
- Load balance HTTP requests

### Vertical Scaling
- Increase memory for larger cache
- More CPU for faster API processing

## Support

For deployment issues, please:
1. Check platform-specific documentation
2. Review application logs
3. Open GitHub issue with deployment details
