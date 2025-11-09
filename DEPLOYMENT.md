# Deployment Guide

## Deploy to Railway

Railway is recommended for easy deployment with built-in Redis support.

### Steps:

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add Redis**
   - Click "New"
   - Select "Database"
   - Choose "Redis"

4. **Set Environment Variables**
   - In your service settings, go to "Variables"
   - Add the following:
     ```
     PORT=3000
     NODE_ENV=production
     CACHE_TTL=30
     ```
   - Railway will automatically set `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`

5. **Deploy**
   - Railway will automatically deploy on every push to your main branch
   - Your app will be available at `https://your-app.railway.app`

## Deploy to Render

### Steps:

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   - Name: `eterna-api`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **Add Redis**
   - Create a new Redis instance from Render dashboard
   - Copy the Internal Redis URL

5. **Set Environment Variables**
   ```
   PORT=10000
   NODE_ENV=production
   REDIS_HOST=<your-redis-host>
   REDIS_PORT=<your-redis-port>
   REDIS_PASSWORD=<your-redis-password>
   CACHE_TTL=30
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

## Deploy to Heroku

### Steps:

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   heroku create eterna-api
   ```

4. **Add Redis**
   ```bash
   heroku addons:create heroku-redis:mini -a eterna-api
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production -a eterna-api
   heroku config:set CACHE_TTL=30 -a eterna-api
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

7. **Open App**
   ```bash
   heroku open -a eterna-api
   ```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Port number | 3000 | No |
| NODE_ENV | Environment | development | No |
| REDIS_HOST | Redis host | localhost | No |
| REDIS_PORT | Redis port | 6379 | No |
| REDIS_PASSWORD | Redis password | - | No |
| CACHE_TTL | Cache TTL in seconds | 30 | No |

## Health Check

After deployment, verify the service is running:

```bash
curl https://your-app-url.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-09T...",
  "uptime": 123.456
}
```

## WebSocket Testing

Test WebSocket connection:
1. Open `websocket-demo.html` in a browser
2. Update the server URL to your deployed URL
3. Click "Connect"
4. You should see live token updates

## Monitoring

### Railway
- View logs in Railway dashboard
- Monitor CPU and memory usage
- Set up alerts

### Render
- Check deployment logs
- Monitor service health
- View metrics dashboard

## Troubleshooting

### App not starting
- Check environment variables are set correctly
- Verify build logs for errors
- Ensure Redis is accessible

### WebSocket not connecting
- Verify CORS is enabled
- Check firewall settings
- Ensure WebSocket protocol is allowed

### High memory usage
- Reduce cache TTL
- Limit concurrent API requests
- Optimize token data storage

## Scaling

### Horizontal Scaling
- Deploy multiple instances
- Use shared Redis for cache
- Load balance with Railway/Render

### Vertical Scaling
- Increase memory allocation
- Upgrade Redis plan
- Optimize queries
