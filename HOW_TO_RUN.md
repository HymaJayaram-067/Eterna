# How to Run Eterna (Updated with Token Fetch Fix)

## Quick Start - Development Mode (Recommended)

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd /home/runner/work/Eterna/Eterna

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Run Backend and Frontend

**Option A: Run Both Separately (Best for Development)**

Open two terminal windows:

**Terminal 1 - Start Backend:**
```bash
cd /home/runner/work/Eterna/Eterna
npm run dev
```
- Backend runs on: http://localhost:3000
- API endpoints available at: http://localhost:3000/api/*
- WebSocket server ready

**Terminal 2 - Start Frontend:**
```bash
cd /home/runner/work/Eterna/Eterna
npm run dev:frontend
```
- Frontend runs on: http://localhost:3001
- Opens automatically in browser
- Hot reload enabled

**Then open your browser to:** http://localhost:3001

---

## Production Mode

### Build and Run

```bash
cd /home/runner/work/Eterna/Eterna

# Install all dependencies
npm run install:all

# Build both backend and frontend
npm run build

# Start in production mode
npm start
```

**Then open your browser to:** http://localhost:3000

---

## What You'll See

After starting the application:

1. **Header Section**
   - "Eterna" title
   - Connection status: "Live" (green) when connected
   - Server uptime and connection count
   - Refresh button

2. **Filters Section**
   - Sort By: Volume, Price Change, Market Cap, Liquidity
   - Order: Ascending/Descending
   - Time Period: 1h, 24h, 7d buttons
   - Min Volume and Min Market Cap input fields

3. **Charts Section**
   - Top Tokens by Volume (line chart)
   - Top Tokens by Market Cap (line chart)
   - Interactive tooltips on hover

4. **Live Tokens Section**
   - **NOW DISPLAYS: 30-50+ token cards** (was only 2 before fix)
   - Each card shows:
     - Token ticker and name
     - Current price in SOL
     - 24h Volume
     - Market Cap
     - Liquidity
     - 1h and 24h price changes (color-coded)
     - Protocol and transaction count
   - Tokens auto-highlight when updated via WebSocket

---

## Testing the Fix

### Verify Token Count

1. Start the application (either mode above)
2. Open browser to the frontend URL
3. Wait for initial load (5-10 seconds)
4. **You should see 30-50+ tokens displayed** instead of just 2

### Check Browser Console

Open browser DevTools (F12) and check Console:
```
WebSocket connected
Received initial data {data: Array(30+), ...}
```

### Check Backend Logs

In the terminal running the backend, you should see:
```
[info]: DexScreener: Total pairs found: 40+
[info]: GeckoTerminal: Fetched 15+ trending pools
[info]: GeckoTerminal: Fetched 20+ new pools
[info]: Aggregated 45+ unique tokens
```

---

## Environment Setup (Optional)

### Backend (.env file)

Create `/home/runner/work/Eterna/Eterna/.env`:
```env
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379  # Optional
CACHE_TTL=30
REFRESH_INTERVAL=30
```

### Frontend (.env.development file)

Already configured in `/home/runner/work/Eterna/Eterna/frontend/.env.development`:
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=http://localhost:3000
```

---

## Troubleshooting

### "No tokens displayed"

**Check 1: Backend logs**
```bash
# Look for errors in terminal running backend
# Should see: "Aggregated X unique tokens"
```

**Check 2: Network connectivity**
```bash
# Test API directly
curl http://localhost:3000/api/tokens
```

**Check 3: Browser console**
```javascript
// Should see WebSocket connected
// Check for error messages
```

### "Only 2 tokens showing"

This was the bug that's now fixed! If you still see only 2 tokens:

1. Make sure you pulled the latest changes (commit bb78407 or later)
2. Rebuild the backend: `npm run build:backend`
3. Restart the backend server
4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### "WebSocket shows Disconnected"

1. Verify backend is running on port 3000
2. Check CORS settings in backend
3. Check browser console for WebSocket errors
4. Restart both backend and frontend

### "Port already in use"

**For backend (port 3000):**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

**For frontend (port 3001):**
```bash
# React will offer to use different port
# Press 'y' when prompted
```

---

## Testing Features

### 1. Real-Time Updates
- Keep browser open for 30+ seconds
- Watch for tokens that get highlighted (blue border)
- These are tokens with >5% price changes or volume spikes
- Highlights fade after 3 seconds

### 2. Filtering
Try different combinations:
```
- Sort by: Volume, Order: Descending
- Time Period: 24h
- Min Volume: 1000
```

### 3. Charts
- Hover over chart lines to see token details
- Charts show top 10 tokens by selected metric

### 4. Manual Refresh
- Click "Refresh" button in header
- Data fetches fresh from APIs
- Should complete in 2-5 seconds

---

## API Testing (Optional)

Test the REST API directly:

```bash
# Get all tokens
curl http://localhost:3000/api/tokens

# Get tokens with filters
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"

# Get configuration
curl http://localhost:3000/api/config

# Health check
curl http://localhost:3000/api/health

# Refresh cache
curl -X POST http://localhost:3000/api/refresh
```

---

## Next Steps

1. ✅ Start the application
2. ✅ Verify 30-50+ tokens are displayed
3. ✅ Test filtering and sorting
4. ✅ Watch for real-time updates
5. ✅ Explore the charts
6. 📖 Read FRONTEND.md for architecture details
7. 📖 Read README.md for full documentation

---

## Need Help?

- **Documentation**: See README.md, FRONTEND.md, QUICKSTART.md
- **Fix Details**: See TOKEN_FETCH_FIX.md
- **Issues**: Check terminal logs and browser console
