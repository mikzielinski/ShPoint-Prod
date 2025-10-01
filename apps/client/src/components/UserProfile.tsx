import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';
import ApiTokenManager from './ApiTokenManager';
import MyGames from './MyGames';
import Inbox from './Inbox';
import { ShPointLogo } from './ShPointLogo';

interface UserProfileProps {
  onClose?: () => void;
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const { auth } = useAuth();
  const user = auth.status === 'authenticated' ? auth.user : null;
  const [showApiTokens, setShowApiTokens] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'games' | 'inbox' | 'stats' | 'modified' | 'api-tokens'>('profile');

  // Update username when user changes
  useEffect(() => {
    setUsername(user?.username || '');
  }, [user]);

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(api('/api/user/username'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim() })
      });

      const data = await response.json();
      
      if (data.ok) {
        setSuccess('Username updated successfully');
        // Update user context if needed
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update username');
      }
    } catch (err) {
      setError('Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="user-profile">
        <div className="alert alert-error">Not logged in</div>
      </div>
    );
  }

  return (
    <div className="user-profile" style={{ 
      background: '#1f2937', 
      border: '1px solid #374151', 
      borderRadius: '8px', 
      padding: '20px',
      maxWidth: '1200px',
      width: '100%',
      margin: '20px auto',
      boxSizing: 'border-box'
    }}>
      <div className="user-profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShPointLogo size={32} showText={false} />
          <h2 style={{ color: '#f9fafb', margin: 0 }}>User Profile</h2>
        </div>
        {onClose && (
          <button 
            className="btn btn-sm btn-outline"
            onClick={onClose}
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #374151'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'profile' ? '#3b82f6' : 'transparent',
            color: activeTab === 'profile' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('games')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'games' ? '#3b82f6' : 'transparent',
            color: activeTab === 'games' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          My Games
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'inbox' ? '#3b82f6' : 'transparent',
            color: activeTab === 'inbox' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Inbox
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'stats' ? '#3b82f6' : 'transparent',
            color: activeTab === 'stats' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          My Stats
        </button>
        {(user.role === 'EDITOR' || user.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('modified')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'modified' ? '#3b82f6' : 'transparent',
              color: activeTab === 'modified' ? 'white' : '#94a3b8',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            My Modified Cards
          </button>
        )}
        <button
          onClick={() => setActiveTab('api-tokens')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'api-tokens' ? '#3b82f6' : 'transparent',
            color: activeTab === 'api-tokens' ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          API Tokens
        </button>
      </div>

      {activeTab === 'profile' && (
        <>
          <div className="user-info" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ color: '#f9fafb' }}>Email:</strong>
              <span style={{ color: '#d1d5db' }}>{user.email}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ color: '#f9fafb' }}>Name:</strong>
              <span style={{ color: '#d1d5db' }}>{user.name || 'Not set'}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ color: '#f9fafb' }}>Role:</strong>
              <span className={`chip chip--role-${user.role.toLowerCase()}`} style={{ 
                background: user.role === 'ADMIN' ? '#dc2626' : 
                           user.role === 'EDITOR' ? '#d97706' : 
                           user.role === 'API_USER' ? '#7c3aed' : '#374151',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {user.role}
              </span>
            </div>
          </div>

      <div className="username-section" style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#f9fafb', margin: '0 0 12px 0', fontSize: '16px' }}>Username</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #374151',
              background: '#374151',
              color: '#f9fafb',
              fontSize: '14px'
            }}
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={handleUpdateUsername}
            disabled={loading || username === user.username}
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
        {error && (
          <div className="alert alert-error" style={{ marginTop: '8px', fontSize: '12px' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-ok" style={{ marginTop: '8px', fontSize: '12px' }}>
            {success}
          </div>
        )}
      </div>

      {user.role === 'API_USER' && (
        <div className="api-tokens-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: '#f9fafb', margin: 0, fontSize: '16px' }}>API Tokens</h3>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setShowApiTokens(!showApiTokens)}
            >
              {showApiTokens ? 'Hide' : 'Show'} Tokens
            </button>
          </div>
          
          {showApiTokens && (
            <ApiTokenManager />
          )}
        </div>
      )}
        </>
      )}

      {activeTab === 'games' && (
        <MyGames playerId={user.id} />
      )}

      {activeTab === 'inbox' && (
        <Inbox onClose={() => setActiveTab('profile')} />
      )}

      {activeTab === 'stats' && (
        <div style={{ padding: '20px' }}>
          <h3 style={{ color: '#f9fafb', margin: '0 0 16px 0' }}>My Statistics</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <div style={{
              background: '#374151',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #4b5563'
            }}>
              <h4 style={{ color: '#f9fafb', margin: '0 0 8px 0' }}>Games Played</h4>
              <p style={{ color: '#d1d5db', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>0</p>
            </div>
            <div style={{
              background: '#374151',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #4b5563'
            }}>
              <h4 style={{ color: '#f9fafb', margin: '0 0 8px 0' }}>Win Rate</h4>
              <p style={{ color: '#d1d5db', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>0%</p>
            </div>
            <div style={{
              background: '#374151',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #4b5563'
            }}>
              <h4 style={{ color: '#f9fafb', margin: '0 0 8px 0' }}>Favorite Faction</h4>
              <p style={{ color: '#d1d5db', margin: 0, fontSize: '16px' }}>None</p>
            </div>
            <div style={{
              background: '#374151',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #4b5563'
            }}>
              <h4 style={{ color: '#f9fafb', margin: '0 0 8px 0' }}>Total Play Time</h4>
              <p style={{ color: '#d1d5db', margin: 0, fontSize: '16px' }}>0 hours</p>
            </div>
          </div>
          <p style={{ color: '#9ca3af', margin: '16px 0 0 0', fontSize: '14px' }}>
            Statistics will be updated as you play more games and log results.
          </p>
        </div>
      )}

      {activeTab === 'modified' && (user.role === 'EDITOR' || user.role === 'ADMIN') && (
        <div style={{ padding: '20px' }}>
          <h3 style={{ color: '#f9fafb', margin: '0 0 16px 0' }}>My Modified Cards</h3>
          <div style={{
            background: '#374151',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #4b5563',
            textAlign: 'center'
          }}>
            <p style={{ color: '#9ca3af', margin: 0 }}>
              This feature will show cards you've created or modified as an editor.
            </p>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: '14px' }}>
              Coming soon...
            </p>
          </div>
        </div>
      )}

      {activeTab === 'api-tokens' && (
        <ApiTokenManager />
      )}

      <div className="profile-actions" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #374151' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => window.location.href = api('/auth/logout')}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
