import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface DDoSStats {
  suspiciousIPs: Array<{
    ip: string;
    count: number;
    firstSeen: string;
    lastSeen: string;
    requestsPerMinute: number;
  }>;
  totalTrackedIPs: number;
  bannedIPs: number;
}

interface SecuritySettings {
  rateLimits: {
    general: number;
    auth: number;
    api: number;
  };
  ddosThreshold: number;
  banDuration: number;
  trustedIPs: string[];
}

export default function SecurityManager() {
  const [ddosStats, setDdosStats] = useState<DDoSStats | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newIP, setNewIP] = useState('');
  const [showAddIP, setShowAddIP] = useState(false);

  // Load DDoS stats
  const loadDdosStats = async () => {
    try {
      const response = await apiFetch(api('/api/admin/security/ddos'));
      if (response.ok) {
        setDdosStats({
          suspiciousIPs: response.threats || [],
          totalTrackedIPs: response.stats?.totalTrackedIPs || 0,
          bannedIPs: response.stats?.activeThreats || 0
        });
      } else {
        setError(response.error || 'Failed to load DDoS stats');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load DDoS stats');
    }
  };

  // Load security settings
  const loadSecuritySettings = async () => {
    try {
      const response = await apiFetch(api('/api/admin/security/settings'));
      if (response.ok) {
        setSecuritySettings(response.data);
      } else {
        setError(response.error || 'Failed to load security settings');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load security settings');
    }
  };

  // Clear DDoS stats
  const clearDdosStats = async () => {
    try {
      const response = await apiFetch(api('/api/admin/security/ddos/clear'), {
        method: 'DELETE'
      });
      if (response.ok) {
        setSuccess('DDoS stats cleared successfully');
        loadDdosStats();
      } else {
        setError(response.error || 'Failed to clear DDoS stats');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to clear DDoS stats');
    }
  };

  // Add IP to whitelist
  const addToWhitelist = async (ip: string) => {
    try {
      const response = await apiFetch(api('/api/admin/security/whitelist'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      if (response.ok) {
        setSuccess(`IP ${ip} added to whitelist`);
        setNewIP('');
        setShowAddIP(false);
        loadSecuritySettings();
      } else {
        setError(response.error || 'Failed to add IP to whitelist');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add IP to whitelist');
    }
  };

  // Remove IP from whitelist
  const removeFromWhitelist = async (ip: string) => {
    try {
      const response = await apiFetch(api('/api/admin/security/whitelist'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      if (response.ok) {
        setSuccess(`IP ${ip} removed from whitelist`);
        loadSecuritySettings();
      } else {
        setError(response.error || 'Failed to remove IP from whitelist');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to remove IP from whitelist');
    }
  };

  // Update security settings
  const updateSecuritySettings = async (settings: Partial<SecuritySettings>) => {
    try {
      const response = await apiFetch(api('/api/admin/security/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        setSuccess('Security settings updated successfully');
        loadSecuritySettings();
      } else {
        setError(response.error || 'Failed to update security settings');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update security settings');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadDdosStats(), loadSecuritySettings()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="card__content">
          <p>Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="security-manager">
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

      {/* DDoS Protection Stats */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card__header">
          <h3 className="card__title">🛡️ DDoS Protection Stats</h3>
          <p className="card__subtitle">Monitor suspicious activity and blocked IPs</p>
        </div>
        <div className="card__content">
          {ddosStats && (
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{ddosStats.totalTrackedIPs}</div>
                <div className="stat-label">Tracked IPs</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{ddosStats.bannedIPs}</div>
                <div className="stat-label">Banned IPs</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <button
              className="btn btn--danger"
              onClick={clearDdosStats}
              style={{ marginRight: '8px' }}
            >
              Clear DDoS Stats
            </button>
            <button
              className="btn btn--secondary"
              onClick={loadDdosStats}
            >
              Refresh Stats
            </button>
          </div>

          {ddosStats?.suspiciousIPs && ddosStats.suspiciousIPs.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4>Suspicious IPs</h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>IP Address</th>
                      <th>Requests</th>
                      <th>Req/Min</th>
                      <th>First Seen</th>
                      <th>Last Seen</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ddosStats.suspiciousIPs.map((ipData, index) => (
                      <tr key={index}>
                        <td>
                          <code>{ipData.ip}</code>
                        </td>
                        <td>{ipData.count}</td>
                        <td>{ipData.requestsPerMinute.toFixed(2)}</td>
                        <td>{new Date(ipData.firstSeen).toLocaleString()}</td>
                        <td>{new Date(ipData.lastSeen).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn btn--small btn--success"
                            onClick={() => addToWhitelist(ipData.ip)}
                          >
                            Whitelist
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Settings */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card__header">
          <h3 className="card__title">⚙️ Security Settings</h3>
          <p className="card__subtitle">Configure rate limits and protection thresholds</p>
        </div>
        <div className="card__content">
          {securitySettings && (
            <div className="settings-grid">
              <div className="setting-group">
                <label className="form-label">General Rate Limit (req/15min)</label>
                <input
                  type="number"
                  className="form-input"
                  value={securitySettings.rateLimits.general}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    rateLimits: {
                      ...securitySettings.rateLimits,
                      general: parseInt(e.target.value)
                    }
                  })}
                />
              </div>

              <div className="setting-group">
                <label className="form-label">Auth Rate Limit (req/15min)</label>
                <input
                  type="number"
                  className="form-input"
                  value={securitySettings.rateLimits.auth}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    rateLimits: {
                      ...securitySettings.rateLimits,
                      auth: parseInt(e.target.value)
                    }
                  })}
                />
              </div>

              <div className="setting-group">
                <label className="form-label">API Rate Limit (req/15min)</label>
                <input
                  type="number"
                  className="form-input"
                  value={securitySettings.rateLimits.api}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    rateLimits: {
                      ...securitySettings.rateLimits,
                      api: parseInt(e.target.value)
                    }
                  })}
                />
              </div>

              <div className="setting-group">
                <label className="form-label">DDoS Threshold (req/min)</label>
                <input
                  type="number"
                  className="form-input"
                  value={securitySettings.ddosThreshold}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    ddosThreshold: parseInt(e.target.value)
                  })}
                />
              </div>

              <div className="setting-group">
                <label className="form-label">Ban Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  value={securitySettings.banDuration}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    banDuration: parseInt(e.target.value)
                  })}
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <button
              className="btn btn--primary"
              onClick={() => updateSecuritySettings(securitySettings!)}
            >
              Update Settings
            </button>
          </div>
        </div>
      </div>

      {/* IP Whitelist */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">🔒 IP Whitelist</h3>
          <p className="card__subtitle">Manage trusted IP addresses</p>
        </div>
        <div className="card__content">
          <div style={{ marginBottom: '16px' }}>
            <button
              className="btn btn--secondary"
              onClick={() => setShowAddIP(!showAddIP)}
            >
              {showAddIP ? 'Cancel' : 'Add IP to Whitelist'}
            </button>
          </div>

          {showAddIP && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">IP Address</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="192.168.1.100"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                />
                <button
                  className="btn btn--success"
                  onClick={() => addToWhitelist(newIP)}
                  disabled={!newIP.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {securitySettings?.trustedIPs && securitySettings.trustedIPs.length > 0 && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {securitySettings.trustedIPs.map((ip, index) => (
                    <tr key={index}>
                      <td>
                        <code>{ip}</code>
                      </td>
                      <td>
                        <button
                          className="btn btn--small btn--danger"
                          onClick={() => removeFromWhitelist(ip)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .security-manager {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .stat-item {
          text-align: center;
          padding: 16px;
          background: #1f2937;
          border-radius: 8px;
          border: 1px solid #374151;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #10b981;
          margin-bottom: 4px;
        }

        .stat-label {
          color: #9ca3af;
          font-size: 0.875rem;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .setting-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          color: #f9fafb;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .form-input {
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 4px;
          color: #f9fafb;
          padding: 8px 12px;
          font-size: 0.875rem;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .table-container {
          overflow-x: auto;
          margin-top: 16px;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          background: #1f2937;
          border-radius: 8px;
          overflow: hidden;
        }

        .table th,
        .table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #374151;
        }

        .table th {
          background: #111827;
          color: #f9fafb;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .table td {
          color: #d1d5db;
          font-size: 0.875rem;
        }

        .table tr:hover {
          background: #111827;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn--small {
          padding: 4px 8px;
          font-size: 0.75rem;
        }

        .btn--primary {
          background: #3b82f6;
          color: white;
        }

        .btn--primary:hover {
          background: #2563eb;
        }

        .btn--secondary {
          background: #6b7280;
          color: white;
        }

        .btn--secondary:hover {
          background: #4b5563;
        }

        .btn--success {
          background: #10b981;
          color: white;
        }

        .btn--success:hover {
          background: #059669;
        }

        .btn--danger {
          background: #ef4444;
          color: white;
        }

        .btn--danger:hover {
          background: #dc2626;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        code {
          background: #374151;
          color: #f9fafb;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
