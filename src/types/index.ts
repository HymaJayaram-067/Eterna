export interface TokenData {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price_sol: number;
  market_cap_sol: number;
  volume_sol: number;
  liquidity_sol: number;
  transaction_count: number;
  price_1hr_change: number;
  price_24hr_change?: number;
  price_7d_change?: number;
  protocol: string;
  last_updated?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

export interface TokenFilter {
  timePeriod?: '1h' | '24h' | '7d';
  sortBy?: 'volume' | 'price_change' | 'market_cap' | 'liquidity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
  minVolume?: number;
  minMarketCap?: number;
}

export interface DexScreenerToken {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    h24: number;
  };
  priceChange: {
    h1: number;
    h24: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
}

export interface JupiterPriceData {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
}

export interface GeckoTerminalToken {
  id: string;
  type: string;
  attributes: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    price_usd: string;
    fdv_usd: string;
    market_cap_usd: string | null;
    total_supply: string;
    volume_usd: {
      h24: string;
    };
    price_change_percentage: {
      h1: string;
      h24: string;
    };
  };
}

export type TimePeriod = '1h' | '24h' | '7d';
export type SortField = 'volume' | 'price_change' | 'market_cap' | 'liquidity';
export type SortOrder = 'asc' | 'desc';
