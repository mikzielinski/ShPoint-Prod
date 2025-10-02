import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/env';

interface StrikeTeam {
  id: string;
  name: string;
  description?: string;
}

interface StrikeTeamsContextType {
  strikeTeams: StrikeTeam[];
  loading: boolean;
  error: string | null;
  refreshStrikeTeams: () => Promise<void>;
}

const StrikeTeamsContext = createContext<StrikeTeamsContextType | undefined>(undefined);

export const useStrikeTeams = () => {
  const context = useContext(StrikeTeamsContext);
  if (context === undefined) {
    throw new Error('useStrikeTeams must be used within a StrikeTeamsProvider');
  }
  return context;
};

interface StrikeTeamsProviderProps {
  children: ReactNode;
}

export const StrikeTeamsProvider: React.FC<StrikeTeamsProviderProps> = ({ children }) => {
  const [strikeTeams, setStrikeTeams] = useState<StrikeTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStrikeTeams = async () => {
    console.log('🔄 StrikeTeamsContext: Loading strike teams...');
    setLoading(true);
    setError(null);
    
    try {
      const url = api('/api/shatterpoint/strike-teams');
      console.log('🔄 StrikeTeamsContext: API URL:', url);
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      console.log('🔄 StrikeTeamsContext: Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 StrikeTeamsContext: Response data:', data);
        if (data.ok) {
          setStrikeTeams(data.strikeTeams || []);
          console.log('✅ StrikeTeamsContext: Loaded strike teams:', data.strikeTeams);
        } else {
          console.error('❌ StrikeTeamsContext: Failed to load strike teams:', data);
          setError('Failed to load strike teams');
        }
      } else {
        console.error('❌ StrikeTeamsContext: Strike teams API error:', response.status, response.statusText);
        setError(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ StrikeTeamsContext: Error loading strike teams:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const refreshStrikeTeams = async () => {
    await loadStrikeTeams();
  };

  useEffect(() => {
    // Load strike teams once when provider mounts
    loadStrikeTeams();
  }, []);

  const value: StrikeTeamsContextType = {
    strikeTeams,
    loading,
    error,
    refreshStrikeTeams
  };

  return (
    <StrikeTeamsContext.Provider value={value}>
      {children}
    </StrikeTeamsContext.Provider>
  );
};
