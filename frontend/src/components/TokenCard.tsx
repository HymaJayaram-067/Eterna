import React from 'react';
import { Token } from '../types';
import './TokenCard.css';

interface TokenCardProps {
  token: Token;
  highlighted?: boolean;
}

export const TokenCard: React.FC<TokenCardProps> = ({ token, highlighted = false }) => {
  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num === 0) return '0';
    if (num < 0.000001) return num.toExponential(2);
    return num.toFixed(decimals);
  };

  const getPriceChangeClass = (change: number): string => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return '';
  };

  return (
    <div className={`token-card ${highlighted ? 'highlighted' : ''}`}>
      <div className="token-header">
        <h3 className="token-ticker">{token.token_ticker}</h3>
        <span className="token-name">{token.token_name}</span>
      </div>
      
      <div className="token-info">
        <div className="info-row">
          <span className="label">Price:</span>
          <span className="value">{formatNumber(token.price_sol, 9)} SOL</span>
        </div>
        
        <div className="info-row">
          <span className="label">Volume (24h):</span>
          <span className="value">{formatNumber(token.volume_sol)} SOL</span>
        </div>
        
        <div className="info-row">
          <span className="label">Market Cap:</span>
          <span className="value">{formatNumber(token.market_cap_sol)} SOL</span>
        </div>
        
        <div className="info-row">
          <span className="label">Liquidity:</span>
          <span className="value">{formatNumber(token.liquidity_sol)} SOL</span>
        </div>
        
        <div className="info-row">
          <span className="label">1h Change:</span>
          <span className={`value ${getPriceChangeClass(token.price_1hr_change)}`}>
            {token.price_1hr_change >= 0 ? '+' : ''}{formatNumber(token.price_1hr_change)}%
          </span>
        </div>
        
        {token.price_24hr_change !== undefined && (
          <div className="info-row">
            <span className="label">24h Change:</span>
            <span className={`value ${getPriceChangeClass(token.price_24hr_change)}`}>
              {token.price_24hr_change >= 0 ? '+' : ''}{formatNumber(token.price_24hr_change)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="token-footer">
        <span className="protocol">{token.protocol}</span>
        <span className="tx-count">{token.transaction_count.toLocaleString()} tx</span>
      </div>
    </div>
  );
};
