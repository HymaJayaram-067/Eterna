import React from 'react';
import { TokenQueryParams } from '../types';
import './Filters.css';

interface FiltersProps {
  params: TokenQueryParams;
  onParamsChange: (params: TokenQueryParams) => void;
}

export const Filters: React.FC<FiltersProps> = ({ params, onParamsChange }) => {
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onParamsChange({
      ...params,
      sortBy: e.target.value as any,
    });
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onParamsChange({
      ...params,
      sortOrder: e.target.value as any,
    });
  };

  const handleTimePeriodChange = (timePeriod: '1h' | '24h' | '7d') => {
    onParamsChange({
      ...params,
      timePeriod,
    });
  };

  const handleMinVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onParamsChange({
      ...params,
      minVolume: value ? parseFloat(value) : undefined,
    });
  };

  const handleMinMarketCapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onParamsChange({
      ...params,
      minMarketCap: value ? parseFloat(value) : undefined,
    });
  };

  return (
    <div className="filters">
      <div className="filter-group">
        <label>Sort By:</label>
        <select value={params.sortBy || 'volume'} onChange={handleSortByChange}>
          <option value="volume">Volume</option>
          <option value="price_change">Price Change</option>
          <option value="market_cap">Market Cap</option>
          <option value="liquidity">Liquidity</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Order:</label>
        <select value={params.sortOrder || 'desc'} onChange={handleSortOrderChange}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Time Period:</label>
        <div className="time-period-buttons">
          <button
            className={params.timePeriod === '1h' ? 'active' : ''}
            onClick={() => handleTimePeriodChange('1h')}
          >
            1h
          </button>
          <button
            className={params.timePeriod === '24h' ? 'active' : ''}
            onClick={() => handleTimePeriodChange('24h')}
          >
            24h
          </button>
          <button
            className={params.timePeriod === '7d' ? 'active' : ''}
            onClick={() => handleTimePeriodChange('7d')}
          >
            7d
          </button>
        </div>
      </div>

      <div className="filter-group">
        <label>Min Volume (SOL):</label>
        <input
          type="number"
          placeholder="e.g. 1000"
          value={params.minVolume || ''}
          onChange={handleMinVolumeChange}
        />
      </div>

      <div className="filter-group">
        <label>Min Market Cap (SOL):</label>
        <input
          type="number"
          placeholder="e.g. 5000"
          value={params.minMarketCap || ''}
          onChange={handleMinMarketCapChange}
        />
      </div>
    </div>
  );
};
