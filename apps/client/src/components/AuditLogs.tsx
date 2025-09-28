import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface AuditLogsProps {
  className?: string;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ className = "" }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    limit: 50
  });

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.action) params.append('action', filters.action);
      params.append('limit', filters.limit.toString());
      
      const response = await fetch(api(`/api/admin/audit-logs?${params}`), {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return '#10b981'; // green
      case 'UPDATE': return '#3b82f6'; // blue
      case 'DELETE': return '#ef4444'; // red
      case 'LOGIN': return '#8b5cf6'; // purple
      case 'LOGOUT': return '#6b7280'; // gray
      case 'ROLE_CHANGE': return '#f59e0b'; // yellow
      case 'STATUS_CHANGE': return '#f97316'; // orange
      default: return '#6b7280'; // gray
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'USER': return '#3b82f6'; // blue
      case 'CHARACTER': return '#10b981'; // green
      case 'STRIKE_TEAM': return '#8b5cf6'; // purple
      case 'COLLECTION': return '#f59e0b'; // yellow
      case 'CUSTOM_CARD': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading audit logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', color: '#ef4444' }}>Error: {error}</div>
        <button
          onClick={loadLogs}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={className} style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#f9fafb', 
          marginBottom: '10px' 
        }}>
          Audit Logs
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '16px' }}>
          System activity logs and user actions
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <select
          value={filters.entityType}
          onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px'
          }}
        >
          <option value="">All Entity Types</option>
          <option value="USER">User</option>
          <option value="CHARACTER">Character</option>
          <option value="STRIKE_TEAM">Strike Team</option>
          <option value="COLLECTION">Collection</option>
          <option value="CUSTOM_CARD">Custom Card</option>
          <option value="SYSTEM_SETTINGS">System Settings</option>
        </select>

        <select
          value={filters.action}
          onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px'
          }}
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="ROLE_CHANGE">Role Change</option>
          <option value="STATUS_CHANGE">Status Change</option>
        </select>

        <select
          value={filters.limit}
          onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px'
          }}
        >
          <option value={25}>25 logs</option>
          <option value={50}>50 logs</option>
          <option value={100}>100 logs</option>
          <option value={200}>200 logs</option>
        </select>

        <button
          onClick={loadLogs}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Refresh
        </button>
      </div>

      {/* Logs Table */}
      <div style={{
        background: '#1f2937',
        borderRadius: '8px',
        border: '1px solid #374151',
        overflow: 'hidden'
      }}>
        <div style={{
          background: '#111827',
          padding: '15px 20px',
          borderBottom: '1px solid #374151'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#f9fafb',
            margin: 0
          }}>
            Recent Activity ({logs.length} logs)
          </h3>
        </div>

        {logs.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            No audit logs found
          </div>
        ) : (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {logs.map((log, index) => (
              <div
                key={log.id}
                style={{
                  padding: '15px 20px',
                  borderBottom: index < logs.length - 1 ? '1px solid #374151' : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px'
                }}
              >
                <div style={{ minWidth: '120px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '5px'
                  }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#f9fafb',
                      background: getEntityTypeColor(log.entityType)
                    }}>
                      {log.entityType}
                    </span>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#f9fafb',
                      background: getActionColor(log.action)
                    }}>
                      {log.action}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    {formatDate(log.createdAt)}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#f9fafb',
                    marginBottom: '5px'
                  }}>
                    {log.description || `${log.action} ${log.entityType}`}
                  </div>
                  
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginBottom: '5px'
                  }}>
                    Entity ID: {log.entityId}
                  </div>

                  {log.user && (
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      User: {log.user.name || log.user.email}
                    </div>
                  )}

                  {log.changes && (
                    <details style={{ marginTop: '8px' }}>
                      <summary style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        cursor: 'pointer'
                      }}>
                        View Changes
                      </summary>
                      <pre style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        background: '#111827',
                        padding: '8px',
                        borderRadius: '4px',
                        marginTop: '5px',
                        overflow: 'auto',
                        maxHeight: '150px'
                      }}>
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
