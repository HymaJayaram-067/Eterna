import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Token } from '../types';
import './TokenChart.css';

interface TokenChartProps {
  tokens: Token[];
  dataKey: 'price_sol' | 'volume_sol' | 'market_cap_sol';
  title: string;
  color?: string;
}

export const TokenChart: React.FC<TokenChartProps> = ({ 
  tokens, 
  dataKey, 
  title,
  color = '#3498db'
}) => {
  const chartData = tokens.slice(0, 10).map((token, index) => ({
    name: token.token_ticker,
    value: token[dataKey],
    index,
  }));

  const formatValue = (value: number): string => {
    if (value === 0) return '0';
    if (value < 0.000001) return value.toExponential(2);
    if (value > 1000000) return (value / 1000000).toFixed(2) + 'M';
    if (value > 1000) return (value / 1000).toFixed(2) + 'K';
    return value.toFixed(2);
  };

  return (
    <div className="token-chart">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#7f8c8d', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fill: '#7f8c8d', fontSize: 12 }}
            tickFormatter={formatValue}
          />
          <Tooltip 
            formatter={(value: number) => formatValue(value)}
            contentStyle={{
              background: 'white',
              border: '1px solid #ecf0f1',
              borderRadius: '8px',
              padding: '10px',
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
            name={title}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
