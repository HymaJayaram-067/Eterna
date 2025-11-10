export interface Token {
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

export interface TokenQueryParams {
  limit?: number;
  cursor?: string;
  sortBy?: 'volume' | 'price_change' | 'market_cap' | 'liquidity';
  sortOrder?: 'asc' | 'desc';
  timePeriod?: '1h' | '24h' | '7d';
  minVolume?: number;
  minMarketCap?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface WebSocketMessage {
  type: 'price_update' | 'volume_spike' | 'new_token' | 'error';
  data: Token | Token[] | { message: string };
  timestamp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  errorDetails?: string;
  timestamp: number;
}

export interface ChartDataPoint {
  timestamp: number;
  price: number;
  volume: number;
}
