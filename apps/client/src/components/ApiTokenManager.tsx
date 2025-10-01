import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';

interface ApiToken {
  id: string;
  name: string;
  token: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  scopes: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiTokenManagerProps {
  onClose?: () => void;
}

export default function ApiTokenManager({ onClose }: ApiTokenManagerProps) {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [availableScopes, setAvailableScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newToken, setNewToken] = useState({
    name: '',
    expiresInDays: '',
    scopes: [] as string[]
  });
  const [createdToken, setCreatedToken] = useState<ApiToken | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await fetch(api('/api/v2/api-tokens'), {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      
      const data = await response.json();
      if (data.ok) {
        setTokens(data.tokens);
        setAvailableScopes(data.availableScopes || []);
      } else {
        throw new Error(data.error || 'Failed to fetch tokens');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    try {
      if (!newToken.name.trim()) {
        setError('Token name is required');
        return;
      }

      const payload: any = {
        name: newToken.name.trim(),
        scopes: newToken.scopes || []
      };

      if (newToken.expiresInDays && newToken.expiresInDays.trim()) {
        const days = parseInt(newToken.expiresInDays);
        if (!isNaN(days) && days > 0) {
          payload.expiresInDays = days;
        }
      }

      console.log('Creating token with payload:', payload);

      const response = await fetch(api('/api/v2/api-tokens'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.ok) {
        setCreatedToken(data.token);
        setSuccess('Token created successfully! Copy it now - it will not be shown again.');
        setNewToken({ name: '', expiresInDays: '', scopes: [] });
        setShowCreateForm(false);
        fetchTokens();
      } else {
        throw new Error(data.error || 'Failed to create token');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token');
    }
  };

  const toggleToken = async (tokenId: string, isActive: boolean) => {
    try {
      const response = await fetch(api(`/api/v2/api-tokens/${tokenId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ isActive })
      });

      const data = await response.json();
      if (data.ok) {
        setSuccess(`Token ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchTokens();
      } else {
        throw new Error(data.error || 'Failed to update token');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update token');
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(api(`/api/v2/api-tokens/${tokenId}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.ok) {
        setSuccess('Token deleted successfully');
        fetchTokens();
      } else {
        throw new Error(data.error || 'Failed to delete token');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete token');
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setSuccess('Token copied to clipboard!');
  };

  const toggleScope = (scope: string) => {
    setNewToken(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope]
    }));
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#9ca3af' }}>Loading API tokens...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#f9fafb', margin: 0 }}>API Tokens</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Create New Token
        </button>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#16a34a',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          {success}
        </div>
      )}

      {createdToken && (
        <div style={{
          background: '#1f2937',
          border: '2px solid #3b82f6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#f9fafb', margin: '0 0 12px 0' }}>New Token Created!</h4>
          <p style={{ color: '#d1d5db', margin: '0 0 12px 0', fontSize: '14px' }}>
            Copy this token now - it will not be shown again:
          </p>
          <div style={{
            background: '#374151',
            padding: '12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#f9fafb',
            wordBreak: 'break-all',
            marginBottom: '12px'
          }}>
            {createdToken.token}
          </div>
          <button
            onClick={() => copyToken(createdToken.token)}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              marginRight: '8px'
            }}
          >
            Copy Token
          </button>
          <button
            onClick={() => setCreatedToken(null)}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>
      )}

      {showCreateForm && (
        <div style={{
          background: '#374151',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #4b5563'
        }}>
          <h4 style={{ color: '#f9fafb', margin: '0 0 16px 0' }}>Create New API Token</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#d1d5db', marginBottom: '8px', fontSize: '14px' }}>
              Token Name
            </label>
            <input
              type="text"
              value={newToken.name}
              onChange={(e) => setNewToken(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., My App Token"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#d1d5db', marginBottom: '8px', fontSize: '14px' }}>
              Expires In (days, optional)
            </label>
            <input
              type="number"
              value={newToken.expiresInDays}
              onChange={(e) => setNewToken(prev => ({ ...prev, expiresInDays: e.target.value }))}
              placeholder="Leave empty for no expiration"
              min="1"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#d1d5db', marginBottom: '8px', fontSize: '14px' }}>
              Scopes (permissions)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {availableScopes.map(scope => (
                <label key={scope} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newToken.scopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ color: '#d1d5db', fontSize: '14px' }}>{scope}</span>
                </label>
              ))}
            </div>
            {newToken.scopes.length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '8px 0 0 0' }}>
                No scopes selected - token will have all available permissions for your role
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={createToken}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Create Token
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewToken({ name: '', expiresInDays: '', scopes: [] });
              }}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
          API tokens allow you to authenticate with the ShPoint API. Use them in the Authorization header: 
          <code style={{ background: '#374151', padding: '2px 6px', borderRadius: '4px', margin: '0 4px' }}>
            Bearer YOUR_TOKEN_HERE
          </code>
        </p>
      </div>

      {tokens.length === 0 ? (
        <div style={{
          background: '#374151',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #4b5563'
        }}>
          <p style={{ color: '#9ca3af', margin: 0 }}>
            No API tokens created yet. Create your first token to start using the API.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tokens.map(token => (
            <div
              key={token.id}
              style={{
                background: '#374151',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #4b5563'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ color: '#f9fafb', margin: '0 0 4px 0', fontSize: '16px' }}>
                    {token.name}
                  </h4>
                  <p style={{ color: '#9ca3af', margin: 0, fontSize: '12px', fontFamily: 'monospace' }}>
                    {token.token}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => toggleToken(token.id, !token.isActive)}
                    style={{
                      background: token.isActive ? '#dc2626' : '#16a34a',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {token.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteToken(token.id)}
                    style={{
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#9ca3af' }}>Status:</span>
                  <span style={{ color: token.isActive ? '#16a34a' : '#dc2626', marginLeft: '4px' }}>
                    {token.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#9ca3af' }}>Created:</span>
                  <span style={{ color: '#d1d5db', marginLeft: '4px' }}>
                    {formatDate(token.createdAt)}
                  </span>
                </div>
                {token.lastUsedAt && (
                  <div>
                    <span style={{ color: '#9ca3af' }}>Last Used:</span>
                    <span style={{ color: '#d1d5db', marginLeft: '4px' }}>
                      {formatDate(token.lastUsedAt)}
                    </span>
                  </div>
                )}
                {token.expiresAt && (
                  <div>
                    <span style={{ color: '#9ca3af' }}>Expires:</span>
                    <span style={{ color: '#d1d5db', marginLeft: '4px' }}>
                      {formatDate(token.expiresAt)}
                    </span>
                  </div>
                )}
              </div>
              
              {token.scopes.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>Scopes:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {token.scopes.map(scope => (
                      <span
                        key={scope}
                        style={{
                          background: '#1f2937',
                          color: '#d1d5db',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}