import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface ApiToken {
  id: string;
  token: string;
  scopes: string[];
  expiresAt: string;
  createdAt: string;
  isActive: boolean;
}

export default function ApiTokenManager() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load user's API tokens
  const loadTokens = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(api('/api/me/tokens'));
      if (response.ok) {
        setTokens(response.tokens || []);
      } else {
        setError(response.error || 'Failed to load API tokens');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load API tokens');
    } finally {
      setLoading(false);
    }
  };

  // Copy token to clipboard
  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setSuccess('Token copied to clipboard!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Failed to copy token to clipboard');
    }
  };

  // Delete token
  const deleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiFetch(api(`/api/admin/tokens/${tokenId}`), {
        method: 'DELETE'
      });
      if (response.ok) {
        setSuccess('Token deleted successfully');
        loadTokens();
      } else {
        setError(response.error || 'Failed to delete token');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete token');
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="card__content">
          <p>Loading API tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="api-token-manager">
      {error && (
        <div className="alert alert--error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert--success" style={{ marginBottom: '16px' }}>
          {success}
        </div>
      )}

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">🔑 API Tokens</h3>
          <p className="card__subtitle">Manage your API access tokens</p>
        </div>
        <div className="card__content">
          {tokens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
                No API tokens found. Contact an administrator to generate tokens for you.
              </p>
            </div>
          ) : (
            <div className="tokens-list">
              {tokens.map((token) => (
                <div key={token.id} className="token-item">
                  <div className="token-info">
                    <div className="token-header">
                      <h4>Token {token.id.slice(-8)}</h4>
                      <div className="token-status">
                        {token.isActive ? (
                          <span className="status-badge status-active">Active</span>
                        ) : (
                          <span className="status-badge status-inactive">Inactive</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="token-details">
                      <div className="detail-row">
                        <span className="detail-label">Scopes:</span>
                        <div className="scopes-list">
                          {token.scopes.map((scope, index) => (
                            <span key={index} className="scope-badge">
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Created:</span>
                        <span>{new Date(token.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Expires:</span>
                        <span>{new Date(token.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="token-actions">
                    <button
                      className="btn btn--secondary btn--small"
                      onClick={() => copyToken(token.token)}
                    >
                      Copy Token
                    </button>
                    <button
                      className="btn btn--danger btn--small"
                      onClick={() => deleteToken(token.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .api-token-manager {
          max-width: 800px;
          margin: 0 auto;
          padding: 16px;
        }

        .tokens-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .token-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 8px;
          gap: 16px;
        }

        .token-info {
          flex: 1;
        }

        .token-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .token-header h4 {
          margin: 0;
          color: #f9fafb;
          font-size: 16px;
          font-weight: 600;
        }

        .token-status {
          display: flex;
          align-items: center;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-active {
          background: #065f46;
          color: #a7f3d0;
        }

        .status-inactive {
          background: #7f1d1d;
          color: #fecaca;
        }

        .token-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-label {
          color: #9ca3af;
          font-size: 14px;
          font-weight: 500;
          min-width: 80px;
        }

        .scopes-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .scope-badge {
          padding: 2px 6px;
          background: #374151;
          color: #d1d5db;
          border-radius: 3px;
          font-size: 12px;
          font-family: monospace;
        }

        .token-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn--small {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn--secondary {
          background: #6b7280;
          color: white;
        }

        .btn--secondary:hover {
          background: #4b5563;
        }

        .btn--danger {
          background: #ef4444;
          color: white;
        }

        .btn--danger:hover {
          background: #dc2626;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .alert--error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert--success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        @media (max-width: 768px) {
          .token-item {
            flex-direction: column;
            align-items: stretch;
          }

          .token-actions {
            flex-direction: row;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}