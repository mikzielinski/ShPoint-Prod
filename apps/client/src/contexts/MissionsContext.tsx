import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/env';

interface Mission {
  id: string;
  name: string;
  description: string;
}

interface MissionsContextType {
  missions: Mission[];
  loading: boolean;
  error: string | null;
  refreshMissions: () => Promise<void>;
}

const MissionsContext = createContext<MissionsContextType | undefined>(undefined);

export const useMissions = () => {
  const context = useContext(MissionsContext);
  if (context === undefined) {
    throw new Error('useMissions must be used within a MissionsProvider');
  }
  return context;
};

interface MissionsProviderProps {
  children: ReactNode;
}

export const MissionsProvider: React.FC<MissionsProviderProps> = ({ children }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMissions = async () => {
    console.log('🔄 MissionsContext: Loading missions...');
    setLoading(true);
    setError(null);
    
    try {
      const url = api('/api/missions');
      console.log('🔄 MissionsContext: API URL:', url);
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      console.log('🔄 MissionsContext: Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 MissionsContext: Response data:', data);
        if (data.ok) {
          setMissions(data.missions || []);
          console.log('✅ MissionsContext: Loaded missions:', data.missions);
        } else {
          console.error('❌ MissionsContext: Failed to load missions:', data);
          setError('Failed to load missions');
        }
      } else {
        console.error('❌ MissionsContext: Missions API error:', response.status, response.statusText);
        setError(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ MissionsContext: Error loading missions:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const refreshMissions = async () => {
    await loadMissions();
  };

  useEffect(() => {
    // Load missions once when provider mounts
    loadMissions();
  }, []);

  const value: MissionsContextType = {
    missions,
    loading,
    error,
    refreshMissions
  };

  return (
    <MissionsContext.Provider value={value}>
      {children}
    </MissionsContext.Provider>
  );
};
