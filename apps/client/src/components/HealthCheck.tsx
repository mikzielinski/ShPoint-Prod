import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'loading';
  responseTime?: number;
  version?: string;
  error?: string;
  url: string;
}

export default function HealthCheck() {
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([
    {
      service: 'Backend API',
      status: 'loading',
      url: 'https://shpoint-prod.onrender.com'
    },
    {
      service: 'Frontend',
      status: 'loading',
      url: window.location.origin
    }
  ]);

  const checkHealth = async (service: HealthStatus) => {
    const startTime = Date.now();
    
    try {
      let response: Response;
      
      if (service.service === 'Backend API') {
        response = await fetch(`${service.url}/health`, { 
          method: 'GET',
          credentials: 'include'
        });
      } else {
        // Frontend health check - just check if we can access the current page
        response = await fetch(window.location.href, { 
          method: 'HEAD',
          credentials: 'include'
        });
      }
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        let version;
        if (service.service === 'Backend API') {
          const data = await response.json();
          version = data.version;
        } else {
          version = 'Frontend';
        }
        
        setHealthStatuses(prev => prev.map(h => 
          h.service === service.service 
            ? { ...h, status: 'healthy', responseTime, version }
            : h
        ));
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setHealthStatuses(prev => prev.map(h => 
        h.service === service.service 
          ? { 
              ...h, 
              status: 'unhealthy', 
              responseTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : h
      ));
    }
  };

  useEffect(() => {
    // Check all services on mount
    healthStatuses.forEach(service => {
      checkHealth(service);
    });
    
    // Set up interval to check every 30 seconds
    const interval = setInterval(() => {
      healthStatuses.forEach(service => {
        checkHealth(service);
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'unhealthy': return '❌';
      case 'loading': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'unhealthy': return 'text-red-400';
      case 'loading': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const refreshAll = () => {
    setHealthStatuses(prev => prev.map(h => ({ ...h, status: 'loading', error: undefined })));
    healthStatuses.forEach(service => {
      checkHealth(service);
    });
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #475569',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#f8fafc',
            margin: 0,
            marginBottom: '4px'
          }}>
            System Health
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: 0
          }}>
            Monitorowanie statusu serwisów
          </p>
        </div>
        <button
          onClick={refreshAll}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
          }}
        >
          🔄 Refresh
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '16px' }}>
        {healthStatuses.map((service) => (
          <div key={service.service} style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #334155',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  fontSize: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: service.status === 'healthy' 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : service.status === 'unhealthy' 
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(245, 158, 11, 0.2)'
                }}>
                  {getStatusIcon(service.status)}
                </div>
                <div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#f8fafc',
                    margin: 0,
                    marginBottom: '2px'
                  }}>
                    {service.service}
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#64748b',
                    margin: 0,
                    wordBreak: 'break-all'
                  }}>
                    {service.url}
                  </p>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: service.status === 'healthy' 
                    ? '#22c55e' 
                    : service.status === 'unhealthy' 
                    ? '#ef4444'
                    : '#f59e0b',
                  marginBottom: '4px'
                }}>
                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </div>
                {service.responseTime && (
                  <div style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    marginBottom: '2px'
                  }}>
                    {service.responseTime}ms
                  </div>
                )}
                {service.version && (
                  <div style={{
                    fontSize: '11px',
                    color: '#64748b',
                    background: 'rgba(51, 65, 85, 0.5)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    {service.version}
                  </div>
                )}
              </div>
            </div>
            
            {service.error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '8px 12px',
                marginTop: '12px'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#fca5a5',
                  margin: 0,
                  wordBreak: 'break-word'
                }}>
                  {service.error}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid #334155'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <a
            href="https://shpoint-prod.onrender.com/health"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#60a5fa',
              textDecoration: 'none',
              fontSize: '12px',
              padding: '4px 8px',
              background: 'rgba(96, 165, 250, 0.1)',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)';
              e.currentTarget.style.color = '#93c5fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)';
              e.currentTarget.style.color = '#60a5fa';
            }}
          >
            🔗 Backend Health API
          </a>
          <a
            href="https://shpoint-prod.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#60a5fa',
              textDecoration: 'none',
              fontSize: '12px',
              padding: '4px 8px',
              background: 'rgba(96, 165, 250, 0.1)',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)';
              e.currentTarget.style.color = '#93c5fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)';
              e.currentTarget.style.color = '#60a5fa';
            }}
          >
            🔗 Backend Root
          </a>
          <a
            href={window.location.origin}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#60a5fa',
              textDecoration: 'none',
              fontSize: '12px',
              padding: '4px 8px',
              background: 'rgba(96, 165, 250, 0.1)',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)';
              e.currentTarget.style.color = '#93c5fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)';
              e.currentTarget.style.color = '#60a5fa';
            }}
          >
            🔗 Frontend Root
          </a>
        </div>
      </div>
    </div>
  );
}
