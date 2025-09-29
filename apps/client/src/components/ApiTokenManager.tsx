import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';

interface ApiToken {
  id: string;
  token: string;
  scopes: string[];
  expiresAt: string;
  createdAt: string;
}

interface ApiTokenManagerProps {
  userId?: string;
  isAdmin?: boolean;
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  'cards:read': 'Read character data',
  'missions:read': 'Read mission data',
  'sets:read': 'Read set data',
  'content:write': 'Edit content (characters, missions, sets)',
  'users:read': 'Read user data',
  'users:write': 'Manage users',
  'admin:all': 'Full admin access'
};

const DEFAULT_SCOPES: Record<string, string[]> = {
  'USER': ['cards:read', 'missions:read', 'sets:read'],
  'EDITOR': ['cards:read', 'missions:read', 'sets:read', 'content:write'],
  'ADMIN': ['cards:read', 'missions:read', 'sets:read', 'content:write', 'users:read', 'users:write', 'admin:all'],
  'API_USER': ['cards:read', 'missions:read', 'sets:read']
};

export default function ApiTokenManager({ userId, isAdmin = false }: ApiTokenManagerProps) {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [customScopes, setCustomScopes] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState(365);

  useEffect(() => {
    loadTokens();
  }, [userId]);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin && userId ? `/api/admin/users/${userId}/tokens` : '/api/me/tokens';
      const response = await fetch(api(endpoint), { credentials: 'include' });
      const data = await response.json();
      
      if (data.ok) {
        setTokens(data.tokens || []);
      } else {
        setError(data.error || 'Failed to load tokens');
      }
    } catch (err) {
      setError('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    try {
      if (!isAdmin || !userId) {
        setError('Admin access required to generate tokens');
        return;
      }

      const response = await fetch(api(`/api/admin/users/${userId}/generate-token`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scopes: customScopes.length > 0 ? customScopes : undefined,
          expiresInDays
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        setTokens(prev => [data.token, ...prev]);
        setShowGenerateForm(false);
        setCustomScopes([]);
        setExpiresInDays(365);
      } else {
        setError(data.error || 'Failed to generate token');
      }
    } catch (err) {
      setError('Failed to generate token');
    }
  };

  const revokeToken = async (tokenId: string) => {
    if (!isAdmin) {
      setError('Admin access required to revoke tokens');
      return;
    }

    if (!confirm('Are you sure you want to revoke this token?')) {
      return;
    }

    try {
      const response = await fetch(api(`/api/admin/tokens/${tokenId}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.ok) {
        setTokens(prev => prev.filter(t => t.id !== tokenId));
      } else {
        setError(data.error || 'Failed to revoke token');
      }
    } catch (err) {
      setError('Failed to revoke token');
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    // You could add a toast notification here
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return <div className="api-token-manager">Loading API tokens...</div>;
  }

  return (
    <div className="api-token-manager">
      <div className="api-token-header">
        <h3>API Tokens</h3>
        {isAdmin && (
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => setShowGenerateForm(!showGenerateForm)}
          >
            {showGenerateForm ? 'Cancel' : 'Generate Token'}
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {showGenerateForm && isAdmin && (
        <div className="api-token-form" style={{ 
          background: '#1f2937', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #374151'
        }}>
          <h4>Generate New Token</h4>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', color: '#f9fafb' }}>
              Custom Scopes (optional):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(SCOPE_DESCRIPTIONS).map(([scope, description]) => (
                <label key={scope} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="checkbox"
                    checked={customScopes.includes(scope)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCustomScopes(prev => [...prev, scope]);
                      } else {
                        setCustomScopes(prev => prev.filter(s => s !== scope));
                      }
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#d1d5db' }}>
                    {scope}
                  </span>
                </label>
              ))}
            </div>
            <small style={{ color: '#9ca3af', fontSize: '12px' }}>
              Leave empty to use default scopes for user role
            </small>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', color: '#f9fafb' }}>
              Expires in (days):
            </label>
            <input
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              min="1"
              max="3650"
              style={{
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #374151',
                background: '#374151',
                color: '#f9fafb',
                width: '100px'
              }}
            />
          </div>

          <button 
            className="btn btn-sm btn-primary"
            onClick={generateToken}
          >
            Generate Token
          </button>
        </div>
      )}

      {tokens.length === 0 ? (
        <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
          No API tokens found
        </div>
      ) : (
        <div className="api-token-list">
          {tokens.map((token) => (
            <div 
              key={token.id} 
              className="api-token-item"
              style={{
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px'
              }}
            >
              <div className="api-token-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ color: '#f9fafb' }}>Token</strong>
                    {isExpired(token.expiresAt) && (
                      <span style={{ 
                        background: '#dc2626', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontSize: '10px' 
                      }}>
                        EXPIRED
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    background: '#111827', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    fontFamily: 'monospace', 
                    fontSize: '12px',
                    color: '#f9fafb',
                    wordBreak: 'break-all',
                    marginBottom: '8px'
                  }}>
                    {token.token}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => copyToken(token.token)}
                    title="Copy token"
                  >
                    📋
                  </button>
                  {isAdmin && (
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => revokeToken(token.id)}
                      style={{ color: '#dc2626' }}
                      title="Revoke token"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#f9fafb', fontSize: '12px' }}>Scopes:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {token.scopes.map((scope) => (
                    <span 
                      key={scope}
                      style={{
                        background: '#374151',
                        color: '#f9fafb',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px'
                      }}
                      title={SCOPE_DESCRIPTIONS[scope] || scope}
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#9ca3af' }}>
                <div>
                  <strong>Created:</strong> {formatDate(token.createdAt)}
                </div>
                <div>
                  <strong>Expires:</strong> {formatDate(token.expiresAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        background: '#1f2937', 
        padding: '12px', 
        borderRadius: '6px', 
        marginTop: '16px',
        border: '1px solid #374151'
      }}>
        <h4 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '14px' }}>API Documentation</h4>
        <p style={{ color: '#d1d5db', fontSize: '12px', margin: '0 0 8px 0' }}>
          Use your Bearer token to access the API:
        </p>
        <code style={{ 
          background: '#111827', 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '11px',
          color: '#f9fafb',
          display: 'block'
        }}>
          Authorization: Bearer YOUR_TOKEN_HERE
        </code>
        <p style={{ color: '#9ca3af', fontSize: '11px', margin: '8px 0 0 0' }}>
          Base URL: <code style={{ background: '#111827', padding: '2px 4px', borderRadius: '2px' }}>https://shpoint-prod.onrender.com/api/v1/</code>
        </p>
      </div>
    </div>
  );
}
