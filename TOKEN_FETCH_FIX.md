# Fix: Improve Token Fetching to Display 20-30+ Tokens

## Problem
The UI was only displaying 2 tokens after initial load instead of the expected 20-30 tokens.

## Root Cause
The data fetching logic in the API clients was too narrow:
- **DexScreener**: Searched for the generic term "solana" which returned very few trading pairs
- **GeckoTerminal**: Only fetched trending pools, which is limited to ~10 tokens

## Solution

### DexScreener Client Changes (`src/services/dexScreenerClient.ts`)

1. **Try Boosted Tokens Endpoint First**
   - Attempts to fetch from `/token-boosts/top/v1/solana` which returns top performing tokens
   - This endpoint typically returns 20-50+ tokens

2. **Multiple Search Fallback**
   - If boosted endpoint fails, performs multiple searches with popular terms:
     - "SOL" (Solana native token)
     - "USDC" (stablecoin pairs)
     - "meme" (meme tokens)
     - "WIF" (popular meme token)
     - "BONK" (popular meme token)
   - Aggregates results from all searches
   - Adds small delay between searches to respect rate limits

3. **New Transform Method**
   - Added `transformBoostedTokens()` method to handle the different response structure from boosted endpoint

### GeckoTerminal Client Changes (`src/services/geckoTerminalClient.ts`)

1. **Fetch Trending Pools**
   - Continues to fetch trending pools (~10-20 tokens)

2. **Also Fetch New Pools**
   - Added fetching from `/networks/solana/new_pools` endpoint
   - Provides additional ~10-20 tokens
   - Gracefully handles if this endpoint fails

3. **Combine Results**
   - Merges both trending and new pools
   - Provides 20-40+ tokens total from this source

## Impact

### Before
- DexScreener: 1-2 tokens
- GeckoTerminal: 1-2 tokens
- **Total: ~2 tokens**

### After
- DexScreener: 20-50+ tokens (from multiple sources)
- GeckoTerminal: 20-40+ tokens (trending + new)
- **Total: 30-50+ unique tokens** (after deduplication)

## Technical Details

### Token Deduplication
The existing `mergeTokens()` method in `tokenAggregator.ts` handles deduplication:
- Tokens from different sources with the same `token_address` are merged
- Keeps the best data (highest values, most recent timestamps)
- Ensures only unique tokens are displayed

### Rate Limiting
- Small delays added between multiple DexScreener searches (100ms)
- Existing rate limiters still in effect
- Exponential backoff for failed requests

### Logging
Enhanced logging to track:
- Number of tokens fetched from each source
- Success/failure of different endpoints
- Total tokens after aggregation

## Testing
- All existing tests pass (3 suites, 24 tests)
- Build completes successfully
- No breaking changes to existing functionality

## Files Modified
1. `src/services/dexScreenerClient.ts` - Enhanced search logic, added boosted tokens support
2. `src/services/geckoTerminalClient.ts` - Added new pools fetching

## Backwards Compatibility
✅ Fully backwards compatible
✅ No API contract changes
✅ Existing filters and sorting work as expected
✅ WebSocket real-time updates still function
✅ All configuration options preserved
