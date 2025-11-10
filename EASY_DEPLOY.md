# Easy Deployment Guide for Eterna

This guide helps you deploy Eterna to Render, Vercel, Railway, or other platforms without dependency issues.

## 🚀 Quick Deploy Options

### Option 1: Deploy to Render (Recommended - Full Stack with Redis)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

**Steps:**

1. **Fork/Clone this repository** to your GitHub account

2. **Go to Render Dashboard** (https://dashboard.render.com)

3. **Click "New +" → "Blueprint"**
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`
   - Click "Apply"

4. **Wait for deployment** (3-5 minutes)
   - Backend will be deployed
   - Redis instance will be created
   - Environment variables will be set automatically

5. **Access your app** at the provided URL

**Manual Setup (Alternative):**

1. Create a **Redis** instance:
   - Click "New +" → "Redis"
   - Name: `eterna-redis`
   - Plan: Free
   - Copy the Internal Redis URL

2. Create a **Web Service**:
   - Click "New +" → "Web Service"
   - Connect your repository
   - Settings:
     - **Name**: `eterna-backend`
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. Set **Environment Variables**:
   ```
   NODE_ENV=production
   REDIS_URL=<paste-redis-internal-url>
   PORT=10000
   ```

---

### Option 2: Deploy to Railway (Easy with Free Credits)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

**Steps:**

1. **Go to Railway** (https://railway.app)

2. **Click "Start a New Project"**
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add Redis Database**:
   - Click "New" → "Database" → "Add Redis"
   - Railway auto-sets `REDIS_URL`

4. **Add Environment Variables**:
   - Click on your service → "Variables"
   - Add:
     ```
     NODE_ENV=production
     PORT=3000
     CACHE_TTL=30
     REFRESH_INTERVAL=30
     ```

5. **Generate Domain**:
   - Settings → "Generate Domain"

6. **Access your app** at the generated domain

---

### Option 3: Deploy to Vercel (Serverless - No Redis)

⚠️ **Note**: Vercel is serverless, so Redis caching won't work, but the app will still function.

**Steps:**

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy from GitHub**:
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your repository
   - Vercel will auto-detect settings from `vercel.json`
   - Click "Deploy"

3. **Set Environment Variables** (in Vercel dashboard):
   ```
   NODE_ENV=production
   CACHE_TTL=30
   REFRESH_INTERVAL=30
   ```

4. **Access your app** at the provided Vercel URL

**Using CLI:**
```bash
cd /path/to/Eterna
vercel --prod
```

---

## 🔧 Pre-Deployment Checklist

Before deploying, ensure:

- [x] All dependencies are listed in `package.json` ✅
- [x] TypeScript is in dependencies (not devDependencies) ✅
- [x] Build scripts are properly configured ✅
- [x] Node version is specified in `engines` ✅
- [x] Environment variables are documented ✅
- [x] Frontend build is integrated ✅

---

## 📋 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | production | Set to "production" for deployment |
| `PORT` | Platform-specific | 3000 | Server port (Render uses 10000) |
| `REDIS_URL` | No | - | Redis connection string (optional) |
| `CACHE_TTL` | No | 30 | Cache time-to-live in seconds |
| `REFRESH_INTERVAL` | No | 30 | Data refresh interval in seconds |
| `DEXSCREENER_RATE_LIMIT` | No | 300 | API requests per minute |
| `JUPITER_RATE_LIMIT` | No | 600 | API requests per minute |
| `GECKOTERMINAL_RATE_LIMIT` | No | 300 | API requests per minute |

---

## 🔍 Troubleshooting Deployment Issues

### Issue: "Module not found" or dependency errors

**Solution:**
1. Ensure `typescript` is in `dependencies` (not `devDependencies`) ✅ Fixed
2. Clear build cache and redeploy
3. Check that `postinstall` script runs `build:backend`

### Issue: Build fails with "Cannot find module"

**Solution:**
```bash
# Locally test the build process
npm install
npm run build
npm start
```

### Issue: Frontend not loading in production

**Solution:**
1. Verify build command includes frontend: `npm run build`
2. Check that `frontend/build` directory exists after build
3. Ensure backend serves static files from `frontend/build`

### Issue: Redis connection error

**Solution:**
- **If using Render/Railway**: Check that Redis instance is created and `REDIS_URL` is set
- **If using Vercel**: Redis won't work (serverless). App functions without it.
- App will still work without Redis, just without caching

### Issue: Port already in use

**Solution:**
Most platforms set `PORT` automatically. Don't hardcode port 3000.
```javascript
// Already handled in code
const port = process.env.PORT || 3000;
```

### Issue: WebSocket connection fails

**Solution:**
1. Ensure platform supports WebSocket (Render, Railway ✅, Vercel ⚠️ limited)
2. For HTTPS deployments, frontend should use `wss://` instead of `ws://`
3. Check CORS settings allow your frontend domain

---

## ✅ Post-Deployment Verification

1. **Test Health Endpoint**:
   ```bash
   curl https://your-app-url.com/api/health
   ```
   Expected: `{"success":true,"data":{"status":"ok",...}}`

2. **Test Tokens Endpoint**:
   ```bash
   curl https://your-app-url.com/api/tokens?limit=5
   ```
   Expected: Token data array

3. **Test Frontend**:
   - Open `https://your-app-url.com` in browser
   - Should see Eterna UI with token cards
   - Check that WebSocket connects (green "Live" indicator)

4. **Check Logs**:
   - **Render**: Dashboard → Logs
   - **Railway**: Project → Deployments → Logs
   - **Vercel**: Dashboard → Functions → Logs

---

## 📊 Platform Comparison

| Feature | Render | Railway | Vercel |
|---------|--------|---------|--------|
| Free Tier | ✅ Yes | ✅ $5 credit | ✅ Yes |
| Redis Support | ✅ Yes | ✅ Yes | ❌ No |
| WebSocket | ✅ Full | ✅ Full | ⚠️ Limited |
| Build Time | ~3-5 min | ~2-3 min | ~1-2 min |
| Auto-deploy | ✅ Yes | ✅ Yes | ✅ Yes |
| Custom Domain | ✅ Yes | ✅ Yes | ✅ Yes |
| **Recommended For** | **Full-stack apps** | Quick deploys | Serverless apps |

---

## 🎯 Recommended: Render

For this project, **Render is recommended** because:
- ✅ Free Redis instance included
- ✅ Full WebSocket support
- ✅ Simple blueprint deployment
- ✅ Automatic SSL
- ✅ Good for Node.js apps

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- Project README: [README.md](./README.md)
- Detailed Deployment: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🆘 Need Help?

1. Check the logs in your deployment platform
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting
3. Test locally first: `npm install && npm run build && npm start`
4. Ensure all environment variables are set correctly

---

## 🎉 Success!

Once deployed, your Eterna app will:
- ✅ Fetch 30-50+ tokens from multiple sources
- ✅ Display real-time updates via WebSocket
- ✅ Show interactive charts
- ✅ Support filtering and sorting
- ✅ Serve the React frontend automatically

Enjoy your deployed meme coin aggregator! 🚀
