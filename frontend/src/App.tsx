import React, { useEffect, useState, useCallback } from 'react';
import { Token, TokenQueryParams, WebSocketMessage } from './types';
import { api } from './services/api';
import { wsService } from './services/websocket';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { TokenCard } from './components/TokenCard';
import { TokenChart } from './components/TokenChart';
import './App.css';

function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [highlightedTokens, setHighlightedTokens] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [params, setParams] = useState<TokenQueryParams>({
    limit: 30,
    sortBy: 'volume',
    sortOrder: 'desc',
    timePeriod: '1h',
  });

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getTokens(params);
      setTokens(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      console.error('Error fetching tokens:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const handleRefresh = useCallback(async () => {
    try {
      await api.refreshCache();
      await fetchTokens();
    } catch (err) {
      console.error('Error refreshing:', err);
    }
  }, [fetchTokens]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    // Connect to WebSocket
    wsService.connect();

    const handleConnect = () => {
      setWsConnected(true);
    };

    const handleDisconnect = () => {
      setWsConnected(false);
    };

    const handleInitialData = (message: WebSocketMessage) => {
      if (Array.isArray(message.data)) {
        setTokens(message.data as Token[]);
      }
    };

    const handleUpdate = (message: WebSocketMessage) => {
      if (message.type === 'price_update' || message.type === 'volume_spike') {
        if (Array.isArray(message.data)) {
          const updatedTokens = message.data as Token[];
          
          // Update tokens in state
          setTokens(prevTokens => {
            const tokenMap = new Map(prevTokens.map(t => [t.token_address, t]));
            updatedTokens.forEach(token => {
              tokenMap.set(token.token_address, token);
            });
            return Array.from(tokenMap.values());
          });

          // Highlight updated tokens
          const highlightedAddresses = new Set(updatedTokens.map(t => t.token_address));
          setHighlightedTokens(highlightedAddresses);

          // Remove highlights after 3 seconds
          setTimeout(() => {
            setHighlightedTokens(new Set());
          }, 3000);
        }
      }
    };

    wsService.on('connect', handleConnect);
    wsService.on('disconnect', handleDisconnect);
    wsService.on('initial_data', handleInitialData);
    wsService.on('update', handleUpdate);

    return () => {
      wsService.off('connect', handleConnect);
      wsService.off('disconnect', handleDisconnect);
      wsService.off('initial_data', handleInitialData);
      wsService.off('update', handleUpdate);
      wsService.disconnect();
    };
  }, []);

  return (
    <div className="App">
      <Header wsConnected={wsConnected} onRefresh={handleRefresh} />
      
      <div className="container">
        <Filters params={params} onParamsChange={setParams} />

        {loading && tokens.length === 0 && (
          <div className="loading">Loading tokens...</div>
        )}

        {error && (
          <div className="error">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={fetchTokens}>Retry</button>
          </div>
        )}

        {!loading && tokens.length > 0 && (
          <>
            <div className="charts-section">
              <TokenChart
                tokens={tokens}
                dataKey="volume_sol"
                title="Top Tokens by Volume"
                color="#3498db"
              />
              <TokenChart
                tokens={tokens}
                dataKey="market_cap_sol"
                title="Top Tokens by Market Cap"
                color="#27ae60"
              />
            </div>

            <div className="tokens-section">
              <h2 className="section-title">
                Live Tokens ({tokens.length})
              </h2>
              <div className="token-grid">
                {tokens.map(token => (
                  <TokenCard
                    key={token.token_address}
                    token={token}
                    highlighted={highlightedTokens.has(token.token_address)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
