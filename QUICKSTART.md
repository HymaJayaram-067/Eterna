# Quick Start Guide

Get the Eterna service up and running in 5 minutes!

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- Redis ([Installation Guide](https://redis.io/docs/getting-started/installation/))

## Option 1: Quick Start (Local Development)

### Step 1: Install Redis (if not already installed)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Windows:**
Use [Redis for Windows](https://github.com/microsoftarchive/redis/releases) or Docker:
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Step 2: Clone and Setup

```bash
# Clone repository
git clone https://github.com/HymaJayaram-067/Eterna.git
cd Eterna

# Install dependencies
npm install

# Setup environment
cp .env.example .env
```

### Step 3: Run the Service

```bash
# Development mode (with hot reload)
npm run dev

# Or build and run production
npm run build
npm start
```

### Step 4: Test It!

Open your browser to [http://localhost:3000](http://localhost:3000)

You should see the interactive dashboard!

## Option 2: Docker (Easiest!)

```bash
# Clone repository
git clone https://github.com/HymaJayaram-067/Eterna.git
cd Eterna

# Start everything with Docker Compose
docker-compose up

# Open http://localhost:3000 in your browser
```

That's it! Redis and the app will start automatically.

## Verify Installation

### Check Health
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-11-09T12:00:00.000Z"
}
```

### Get Tokens
```bash
curl http://localhost:3000/api/tokens?limit=5
```

### Run Tests
```bash
npm test
```

### Run Load Test
```bash
./scripts/load-test.sh http://localhost:3000 10
```

## Next Steps

1. **Explore the API**: Import `postman_collection.json` into Postman
2. **Test WebSocket**: Open http://localhost:3000 in multiple browser tabs
3. **Read Docs**: Check out README.md and ARCHITECTURE.md
4. **Deploy**: Follow DEPLOYMENT.md to deploy to the cloud

## Common Issues

### Redis Connection Error
**Problem**: `Redis Client Error: connect ECONNREFUSED`

**Solution**:
```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG

# If not, start Redis:
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### Port Already in Use
**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**: Change PORT in `.env`:
```
PORT=3001
```

### TypeScript Errors
**Problem**: Build fails with TypeScript errors

**Solution**:
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Development Tips

### Hot Reload
```bash
npm run dev
```
Changes to `.ts` files will automatically restart the server.

### Watch Tests
```bash
npm run test:watch
```

### Format Code
```bash
npm run format
```

### Lint Code
```bash
npm run lint
npm run lint:fix
```

## API Examples

### Get Top Volume Tokens
```bash
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"
```

### Get Tokens with Price Increase
```bash
curl "http://localhost:3000/api/tokens?sortBy=price_change&timePeriod=1h&sortOrder=desc"
```

### Filter by Volume
```bash
curl "http://localhost:3000/api/tokens?minVolume=100&sortBy=volume"
```

### Paginate Results
```bash
# First page
curl "http://localhost:3000/api/tokens?limit=5&cursor=0"

# Next page (use nextCursor from response)
curl "http://localhost:3000/api/tokens?limit=5&cursor=5"
```

### Clear Cache
```bash
curl -X POST "http://localhost:3000/api/cache/invalidate"
```

## WebSocket Example (JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
    <script>
        const socket = io('http://localhost:3000');
        
        socket.on('connect', () => {
            console.log('Connected!');
            socket.emit('subscribe', {});
        });
        
        socket.on('initial_data', (data) => {
            console.log('Initial tokens:', data.tokens);
        });
        
        socket.on('token_updates', (data) => {
            console.log('Updates:', data.updates);
        });
    </script>
</body>
</html>
```

## Performance Testing

### Load Test
```bash
./scripts/load-test.sh http://localhost:3000 20
```

### Integration Test
```bash
./scripts/integration-test.sh http://localhost:3000
```

## Need Help?

- 📖 Read the [README](README.md)
- 🏗️ Check [ARCHITECTURE](ARCHITECTURE.md)
- 🚀 See [DEPLOYMENT](DEPLOYMENT.md)
- 🐛 Open an [Issue](https://github.com/HymaJayaram-067/Eterna/issues)

## What's Next?

- Deploy to production (see DEPLOYMENT.md)
- Customize the configuration in `.env`
- Add more DEX sources
- Build your own client application
- Contribute improvements!

---

Happy coding! 🚀
