import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import './Header.css';

interface HeaderProps {
  wsConnected: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ wsConnected, onRefresh }) => {
  const [health, setHealth] = useState<{ status: string; uptime: number; wsConnections: number } | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await api.getHealth();
        setHealth(data);
      } catch (error) {
        console.error('Failed to fetch health', error);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">🚀 Eterna</h1>
          <p className="app-subtitle">Real-time Meme Coin Data Aggregation</p>
        </div>
        
        <div className="header-right">
          <div className="status-indicators">
            <div className={`status-badge ${wsConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                {wsConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            
            {health && (
              <div className="health-info">
                <span className="health-item">
                  <strong>Uptime:</strong> {formatUptime(health.uptime)}
                </span>
                <span className="health-item">
                  <strong>Connections:</strong> {health.wsConnections}
                </span>
              </div>
            )}
          </div>
          
          <button className="refresh-button" onClick={onRefresh}>
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
};
