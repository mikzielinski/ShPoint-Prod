import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';
import ApiTokenManager from './ApiTokenManager';

interface UserProfileProps {
  onClose?: () => void;
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const { user } = useAuth();
  const [showApiTokens, setShowApiTokens] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div className="user-profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#f9fafb', margin: 0 }}>User Profile</h2>
        {onClose && (
          <button 
            className="btn btn-sm btn-outline"
            onClick={onClose}
          >
            ✕
          </button>
        )}
      </div>

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
