import axios from 'axios';
import { Token, PaginatedResponse, TokenQueryParams, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const api = {
  /**
   * Get paginated list of tokens with filtering and sorting
   */
  async getTokens(params?: TokenQueryParams): Promise<PaginatedResponse<Token>> {
    const response = await axios.get<ApiResponse<PaginatedResponse<Token>>>(
      `${API_BASE_URL}/tokens`,
      { params }
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch tokens');
    }
    
    return response.data.data;
  },

  /**
   * Get specific token by address
   */
  async getTokenByAddress(address: string): Promise<Token> {
    const response = await axios.get<ApiResponse<Token>>(
      `${API_BASE_URL}/tokens/${address}`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch token');
    }
    
    return response.data.data;
  },

  /**
   * Manually trigger cache refresh
   */
  async refreshCache(): Promise<void> {
    const response = await axios.post<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/refresh`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to refresh cache');
    }
  },

  /**
   * Get health status
   */
  async getHealth(): Promise<{ status: string; uptime: number; wsConnections: number }> {
    const response = await axios.get<ApiResponse<{ status: string; uptime: number; wsConnections: number }>>(
      `${API_BASE_URL}/health`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get health status');
    }
    
    return response.data.data;
  },

  /**
   * Get current configuration
   */
  async getConfig(): Promise<{
    cacheTTL: number;
    refreshInterval: number;
    rateLimits: { dexScreener: number; jupiter: number; geckoTerminal: number };
  }> {
    const response = await axios.get<ApiResponse<any>>(`${API_BASE_URL}/config`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get configuration');
    }
    
    return response.data.data;
  },
};
