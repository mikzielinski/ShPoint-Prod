import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/env';

interface Player {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

interface PlayersContextType {
  players: Player[];
  loading: boolean;
  error: string | null;
  refreshPlayers: () => Promise<void>;
}

const PlayersContext = createContext<PlayersContextType | undefined>(undefined);

export const usePlayers = () => {
  const context = useContext(PlayersContext);
  if (context === undefined) {
    throw new Error('usePlayers must be used within a PlayersProvider');
  }
  return context;
};

interface PlayersProviderProps {
  children: ReactNode;
}

export const PlayersProvider: React.FC<PlayersProviderProps> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  console.log('🔄 PlayersProvider: Component mounted');

  const loadPlayers = async () => {
    console.log('🔄 PlayersContext: Loading available players...');
    console.log('🔄 PlayersContext: Provider mounted, starting API call...');
    setLoading(true);
    setError(null);
    
    try {
      const url = api('/api/v2/players/available');
      console.log('🔄 PlayersContext: API URL:', url);
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      console.log('🔄 PlayersContext: Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 PlayersContext: Response data:', data);
        if (data.ok) {
          setPlayers(data.players || []);
          console.log('✅ PlayersContext: Loaded players:', data.players);
        } else {
          console.error('❌ PlayersContext: Failed to load players:', data);
          setError('Failed to load players');
        }
      } else {
        console.error('❌ PlayersContext: Players API error:', response.status, response.statusText);
        setError(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ PlayersContext: Error loading players:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const refreshPlayers = async () => {
    await loadPlayers();
  };

  useEffect(() => {
    // Load players once when provider mounts
    console.log('🔄 PlayersContext: useEffect triggered, calling loadPlayers...');
    loadPlayers();
  }, []);

  const value: PlayersContextType = {
    players,
    loading,
    error,
    refreshPlayers
  };

  return (
    <PlayersContext.Provider value={value}>
      {children}
    </PlayersContext.Provider>
  );
};
