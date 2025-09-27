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
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">System Health</h3>
        <button
          onClick={refreshAll}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-3">
        {healthStatuses.map((service) => (
          <div key={service.service} className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getStatusIcon(service.status)}</span>
                <div>
                  <h4 className="font-medium text-white">{service.service}</h4>
                  <p className="text-sm text-gray-400">{service.url}</p>
                  {service.version && (
                    <p className="text-xs text-gray-500">Version: {service.version}</p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className={`text-sm font-medium ${getStatusColor(service.status)}`}>
                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </p>
                {service.responseTime && (
                  <p className="text-xs text-gray-400">
                    {service.responseTime}ms
                  </p>
                )}
                {service.error && (
                  <p className="text-xs text-red-400 mt-1 max-w-xs truncate" title={service.error}>
                    {service.error}
                  </p>
                )}
              </div>
            </div>
            
            {service.status === 'unhealthy' && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  🔗 Open in new tab
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex flex-wrap gap-2">
          <a
            href="https://shpoint-prod.onrender.com/health"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            🔗 Backend Health API
          </a>
          <a
            href="https://shpoint-prod.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            🔗 Backend Root
          </a>
          <a
            href={window.location.origin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            🔗 Frontend Root
          </a>
        </div>
      </div>
    </div>
  );
}
