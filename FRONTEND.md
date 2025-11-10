# Frontend Documentation

## Overview

The Eterna frontend is a modern React application built with TypeScript that provides real-time visualization of meme coin data. It features live updates via WebSocket, interactive charts, and advanced filtering capabilities.

## Architecture

### Components Structure

```
frontend/src/
├── components/
│   ├── Header.tsx/css          # App header with status indicators
│   ├── Filters.tsx/css         # Filtering and sorting controls
│   ├── TokenCard.tsx/css       # Individual token display card
│   └── TokenChart.tsx/css      # Chart component for data visualization
├── services/
│   ├── api.ts                  # REST API service layer
│   └── websocket.ts            # WebSocket service layer
├── types.ts                    # TypeScript type definitions
├── App.tsx/css                 # Main application component
└── index.tsx                   # Application entry point
```

## Key Features

### 1. Real-time Updates

The application connects to the backend WebSocket server and receives live updates:

```typescript
// WebSocket connection
wsService.connect();

// Listen for updates
wsService.on('update', (message: WebSocketMessage) => {
  if (message.type === 'price_update') {
    // Handle price update
  } else if (message.type === 'volume_spike') {
    // Handle volume spike
  }
});
```

### 2. Visual Highlighting

Tokens with significant changes are automatically highlighted:

- Price changes > 5% trigger visual highlighting
- Volume spikes are highlighted
- Highlights fade after 3 seconds

### 3. Interactive Charts

Two main charts are provided:
- **Volume Chart**: Top tokens by trading volume
- **Market Cap Chart**: Top tokens by market capitalization

Charts are built using Recharts and include:
- Responsive design
- Interactive tooltips
- Automatic formatting of large numbers

### 4. Advanced Filtering

Users can filter tokens by:
- **Sort By**: Volume, Price Change, Market Cap, Liquidity
- **Sort Order**: Ascending or Descending
- **Time Period**: 1h, 24h, or 7d
- **Min Volume**: Minimum trading volume threshold
- **Min Market Cap**: Minimum market cap threshold

## Component Details

### Header Component

Displays:
- Application title and subtitle
- WebSocket connection status (Live/Disconnected)
- Server uptime and active connections
- Manual refresh button

```tsx
<Header 
  wsConnected={wsConnected} 
  onRefresh={handleRefresh} 
/>
```

### Filters Component

Provides filtering controls:

```tsx
<Filters 
  params={params} 
  onParamsChange={setParams} 
/>
```

### TokenCard Component

Displays individual token information:

```tsx
<TokenCard 
  token={token} 
  highlighted={isHighlighted} 
/>
```

Features:
- Token name and ticker
- Current price in SOL
- Volume, market cap, and liquidity
- Price changes (1h, 24h)
- Protocol and transaction count
- Visual highlighting for updates

### TokenChart Component

Renders data visualization:

```tsx
<TokenChart
  tokens={tokens}
  dataKey="volume_sol"
  title="Top Tokens by Volume"
  color="#3498db"
/>
```

## Services

### API Service

Handles all REST API calls:

```typescript
import { api } from './services/api';

// Fetch tokens
const tokens = await api.getTokens({
  sortBy: 'volume',
  sortOrder: 'desc',
  limit: 30
});

// Get specific token
const token = await api.getTokenByAddress(address);

// Refresh cache
await api.refreshCache();

// Get health status
const health = await api.getHealth();

// Get configuration
const config = await api.getConfig();
```

### WebSocket Service

Manages WebSocket connection:

```typescript
import { wsService } from './services/websocket';

// Connect
wsService.connect();

// Subscribe to events
wsService.on('connect', () => {
  console.log('Connected');
});

wsService.on('initial_data', (data) => {
  console.log('Initial data received', data);
});

wsService.on('update', (message) => {
  console.log('Update received', message);
});

// Disconnect
wsService.disconnect();
```

## State Management

The application uses React hooks for state management:

```typescript
const [tokens, setTokens] = useState<Token[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [wsConnected, setWsConnected] = useState<boolean>(false);
const [params, setParams] = useState<TokenQueryParams>({...});
```

## Styling

The application uses plain CSS with:
- CSS Grid for layouts
- Flexbox for component alignment
- CSS animations for visual effects
- Responsive media queries
- Custom properties for theming

### Responsive Design

Breakpoints:
- Desktop: > 768px
- Mobile: ≤ 768px

## Environment Configuration

Create a `.env.development` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=http://localhost:3000
```

For production, set these in your build environment.

## Building and Deployment

### Development

```bash
cd frontend
npm start
```

Runs on http://localhost:3001 with hot reload.

### Production Build

```bash
cd frontend
npm run build
```

Creates optimized production build in `frontend/build/`.

### Deployment

The backend serves the frontend in production:

1. Build the frontend: `npm run build`
2. Backend serves from `frontend/build/` when `NODE_ENV=production`
3. Access the UI at `http://localhost:3000`

## Testing

The frontend includes:
- Jest test setup
- React Testing Library
- Component tests

Run tests:
```bash
cd frontend
npm test
```

## Performance Optimizations

1. **Memoization**: Using `useCallback` for event handlers
2. **Conditional Rendering**: Only render when data changes
3. **Debouncing**: Filter changes are applied immediately but API calls are optimized
4. **WebSocket**: Reduces unnecessary API calls
5. **Code Splitting**: React lazy loading (can be added)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### WebSocket Connection Issues

If WebSocket doesn't connect:
1. Check backend is running on port 3000
2. Verify CORS settings
3. Check browser console for errors
4. Ensure firewall allows WebSocket connections

### API Errors

If API calls fail:
1. Verify backend is running
2. Check API URL in `.env.development`
3. Inspect network tab for request details
4. Review error messages in console

### Build Errors

If build fails:
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf build`
3. Check TypeScript errors
4. Verify all dependencies are installed

## Future Enhancements

Potential improvements:
- [ ] Add token search functionality
- [ ] Implement token favorites/watchlist
- [ ] Add more chart types (candlestick, area)
- [ ] Historical data visualization
- [ ] Dark mode toggle
- [ ] Export data to CSV
- [ ] Price alerts
- [ ] Mobile app version
