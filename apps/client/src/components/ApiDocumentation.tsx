import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';

interface ApiEndpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: any[];
  responses?: any;
}

interface ApiCategory {
  name: string;
  endpoints: ApiEndpoint[];
}

const ApiDocumentation: React.FC = () => {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    loadApiDocumentation();
  }, []);

  const loadApiDocumentation = async () => {
    try {
      setLoading(true);
      // For now, we'll create a static list of our main endpoints
      // In the future, this could fetch from /api-docs.json
      const endpoints: ApiEndpoint[] = [
        // System
        {
          path: '/health',
          method: 'GET',
          summary: 'Health check endpoint',
          description: 'Returns the health status of the API',
          tags: ['System']
        },
        
        // Authentication
        {
          path: '/api/me',
          method: 'GET',
          summary: 'Get current user information',
          description: 'Returns the authenticated user\'s profile information',
          tags: ['Authentication']
        },
        {
          path: '/auth/google',
          method: 'GET',
          summary: 'Google OAuth login',
          description: 'Initiates Google OAuth authentication flow',
          tags: ['Authentication']
        },
        {
          path: '/auth/logout',
          method: 'POST',
          summary: 'Logout user',
          description: 'Logs out the current user and clears session',
          tags: ['Authentication']
        },
        
        // Characters
        {
          path: '/api/characters',
          method: 'GET',
          summary: 'Get all characters',
          description: 'Returns a list of all available characters',
          tags: ['Characters']
        },
        {
          path: '/api/characters/:id',
          method: 'GET',
          summary: 'Get character details',
          description: 'Returns detailed information about a specific character',
          tags: ['Characters']
        },
        {
          path: '/characters/:id/data.json',
          method: 'GET',
          summary: 'Get character data',
          description: 'Returns character data JSON with corrected image URLs',
          tags: ['Characters']
        },
        {
          path: '/characters/:id/stance.json',
          method: 'GET',
          summary: 'Get character stance data',
          description: 'Returns character stance information',
          tags: ['Characters']
        },
        
        // Collections
        {
          path: '/api/collections',
          method: 'GET',
          summary: 'Get user collections',
          description: 'Returns all collections for the authenticated user',
          tags: ['Collections']
        },
        {
          path: '/api/collections',
          method: 'POST',
          summary: 'Create new collection',
          description: 'Creates a new collection for the authenticated user',
          tags: ['Collections']
        },
        {
          path: '/api/collections/:id',
          method: 'PUT',
          summary: 'Update collection',
          description: 'Updates an existing collection',
          tags: ['Collections']
        },
        {
          path: '/api/collections/:id',
          method: 'DELETE',
          summary: 'Delete collection',
          description: 'Deletes a collection',
          tags: ['Collections']
        },
        
        // Strike Teams
        {
          path: '/api/strike-teams',
          method: 'GET',
          summary: 'Get user strike teams',
          description: 'Returns all strike teams for the authenticated user',
          tags: ['Strike Teams']
        },
        {
          path: '/api/strike-teams',
          method: 'POST',
          summary: 'Create strike team',
          description: 'Creates a new strike team',
          tags: ['Strike Teams']
        },
        {
          path: '/api/strike-teams/:id',
          method: 'PUT',
          summary: 'Update strike team',
          description: 'Updates an existing strike team',
          tags: ['Strike Teams']
        },
        {
          path: '/api/strike-teams/:id',
          method: 'DELETE',
          summary: 'Delete strike team',
          description: 'Deletes a strike team',
          tags: ['Strike Teams']
        },
        
        // Admin
        {
          path: '/api/admin/users',
          method: 'GET',
          summary: 'Get all users (Admin only)',
          description: 'Returns a list of all users in the system',
          tags: ['Admin']
        },
        {
          path: '/api/admin/audit-logs',
          method: 'GET',
          summary: 'Get audit logs (Admin only)',
          description: 'Returns system audit logs with filtering options',
          tags: ['Admin']
        },
        {
          path: '/api/admin/invite',
          method: 'POST',
          summary: 'Send invitation (Admin only)',
          description: 'Sends an invitation email to a new user',
          tags: ['Admin']
        },
        {
          path: '/api/admin/users/:id/role',
          method: 'PATCH',
          summary: 'Update user role (Admin only)',
          description: 'Updates a user\'s role in the system',
          tags: ['Admin']
        }
      ];

      // Group endpoints by category
      const categoryMap = new Map<string, ApiEndpoint[]>();
      endpoints.forEach(endpoint => {
        endpoint.tags.forEach(tag => {
          if (!categoryMap.has(tag)) {
            categoryMap.set(tag, []);
          }
          categoryMap.get(tag)!.push(endpoint);
        });
      });

      const categoriesArray: ApiCategory[] = Array.from(categoryMap.entries()).map(([name, endpoints]) => ({
        name,
        endpoints
      }));

      setCategories(categoriesArray);
    } catch (err) {
      setError('Failed to load API documentation');
      console.error('Error loading API docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#10b981'; // green
      case 'POST': return '#3b82f6'; // blue
      case 'PUT': return '#f59e0b'; // yellow
      case 'PATCH': return '#8b5cf6'; // purple
      case 'DELETE': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const filteredCategories = selectedCategory === 'All' 
    ? categories 
    : categories.filter(cat => cat.name === selectedCategory);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading API documentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', color: '#ef4444' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#f9fafb', 
          marginBottom: '10px' 
        }}>
          API Documentation
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '16px' }}>
          Complete reference for ShPoint API endpoints
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setSelectedCategory('All')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #374151',
              background: selectedCategory === 'All' ? '#3b82f6' : '#1f2937',
              color: '#f9fafb',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #374151',
                background: selectedCategory === category.name ? '#3b82f6' : '#1f2937',
                color: '#f9fafb',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* API Endpoints */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredCategories.map(category => (
          <div key={category.name} style={{
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
                {category.name}
              </h3>
            </div>
            
            <div style={{ padding: '0' }}>
              {category.endpoints.map((endpoint, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '20px',
                    borderBottom: index < category.endpoints.length - 1 ? '1px solid #374151' : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '15px'
                  }}
                >
                  <div style={{
                    minWidth: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#f9fafb',
                      background: getMethodColor(endpoint.method)
                    }}>
                      {endpoint.method}
                    </span>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#f9fafb',
                      marginBottom: '5px',
                      fontFamily: 'monospace'
                    }}>
                      {endpoint.path}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#d1d5db',
                      marginBottom: '8px'
                    }}>
                      {endpoint.summary}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#9ca3af',
                      lineHeight: '1.5'
                    }}>
                      {endpoint.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* External Links */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#1f2937', 
        borderRadius: '8px',
        border: '1px solid #374151'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#f9fafb',
          marginBottom: '15px'
        }}>
          External Documentation
        </h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <a
            href="https://shpoint-prod.onrender.com/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: '#f9fafb',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📚 Interactive Swagger UI
          </a>
          <a
            href="https://shpoint-prod.onrender.com/api-docs.json"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: '#f9fafb',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📄 OpenAPI JSON
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentation;
