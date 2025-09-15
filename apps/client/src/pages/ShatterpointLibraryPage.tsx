import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const ShatterpointLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { me } = useAuth();

  const categories = [
    {
      id: 'characters',
      title: 'Characters',
      description: 'Browse and manage your character collection',
      icon: '👥',
      color: '#3b82f6',
      path: '/characters',
      stats: '200+ characters available'
    },
    {
      id: 'sets',
      title: 'Sets & Boxes',
      description: 'Track your expansion sets and core boxes',
      icon: '📦',
      color: '#16a34a',
      path: '/sets',
      stats: '50+ sets available'
    },
    {
      id: 'missions',
      title: 'Missions',
      description: 'Complete missions and track campaign progress',
      icon: '🎯',
      color: '#dc2626',
      path: '/missions',
      stats: 'Campaign mode coming soon'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            color: '#f9fafb',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Shatterpoint Library
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#9ca3af',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Your central command for Star Wars: Shatterpoint collections, teams, and campaigns
          </p>
        </div>

        {/* Categories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => navigate(category.path)}
              style={{
                background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid #374151',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.borderColor = category.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#374151';
              }}
            >
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: `radial-gradient(circle, ${category.color}20 0%, transparent 70%)`,
                opacity: 0.1
              }} />
              
              {/* Content */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>
                  {category.icon}
                </div>
                
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#f9fafb',
                  marginBottom: '12px'
                }}>
                  {category.title}
                </h2>
                
                <p style={{
                  fontSize: '16px',
                  color: '#9ca3af',
                  marginBottom: '20px',
                  lineHeight: '1.5'
                }}>
                  {category.description}
                </p>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: category.color,
                    fontWeight: '600'
                  }}>
                    {category.stats}
                  </span>
                  
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: category.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        {me && (
          <div style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #374151'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#f9fafb',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Your Collection Overview
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '16px',
                background: '#0f172a',
                borderRadius: '8px',
                border: '1px solid #374151'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#3b82f6',
                  marginBottom: '4px'
                }}>
                  0
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#9ca3af'
                }}>
                  Characters Owned
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '16px',
                background: '#0f172a',
                borderRadius: '8px',
                border: '1px solid #374151'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#16a34a',
                  marginBottom: '4px'
                }}>
                  0
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#9ca3af'
                }}>
                  Sets Owned
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '16px',
                background: '#0f172a',
                borderRadius: '8px',
                border: '1px solid #374151'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#dc2626',
                  marginBottom: '4px'
                }}>
                  0
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#9ca3af'
                }}>
                  Missions Completed
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShatterpointLibraryPage;
