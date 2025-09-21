import React from 'react';
import { AbilityIcon } from './AbilityIcon';

interface NewsItem {
  id: string;
  date: string;
  title: string;
  description: string;
  features: (string | React.ReactElement)[];
  status: 'completed' | 'in-progress' | 'planned';
  images?: string[];
  content?: string; // Rich text content
}

interface NewsPreviewProps {
  newsItem: NewsItem;
}

const NewsPreview: React.FC<NewsPreviewProps> = ({ newsItem }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'in-progress': return '#f59e0b';
      case 'planned': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🚧';
      case 'planned': return '📋';
      default: return '📋';
    }
  };

  return (
    <div style={{
      background: '#0f172a',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #374151',
      borderLeft: `4px solid ${getStatusColor(newsItem.status)}`,
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#f9fafb',
            marginBottom: '8px',
            lineHeight: '1.3'
          }}>
            {newsItem.title}
          </h3>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            {new Date(newsItem.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: `${getStatusColor(newsItem.status)}20`,
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600',
          color: getStatusColor(newsItem.status)
        }}>
          {getStatusIcon(newsItem.status)}
          {newsItem.status?.toUpperCase() || 'UNKNOWN'}
        </div>
      </div>
      
      {/* Description */}
      <p style={{
        fontSize: '16px',
        color: '#9ca3af',
        lineHeight: '1.6',
        marginBottom: '20px'
      }}>
        {newsItem.description}
      </p>

      {/* Rich Content */}
      {newsItem.content && (
        <div style={{
          background: '#1f2937',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #374151'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#f9fafb',
            marginBottom: '12px'
          }}>
            Additional Content
          </h4>
          <div 
            style={{
              fontSize: '14px',
              color: '#e5e7eb',
              lineHeight: '1.6',
              fontFamily: 'ShatterpointIcons, monospace'
            }}
            dangerouslySetInnerHTML={{ __html: newsItem.content }}
          />
        </div>
      )}

      {/* Images */}
      {newsItem.images && newsItem.images.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#f9fafb',
            marginBottom: '12px'
          }}>
            Images
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px' 
          }}>
            {newsItem.images.map((imageUrl, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  background: '#374151',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #4b5563'
                }}
              >
                <img
                  src={imageUrl}
                  alt={`News image ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                  }}
                />
                <div style={{
                  display: 'none',
                  width: '100%',
                  height: '200px',
                  background: '#374151',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '14px'
                }}>
                  Failed to load image
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      <div>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#f9fafb',
          marginBottom: '12px'
        }}>
          Features
        </h4>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {newsItem.features.map((feature, featureIndex) => (
            <div
              key={featureIndex}
              style={{
                background: '#1f2937',
                color: '#e5e7eb',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                border: '1px solid #374151'
              }}
            >
              {typeof feature === 'string' ? feature : feature}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid #374151',
        fontSize: '12px',
        color: '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          ID: <code style={{ background: '#374151', padding: '2px 6px', borderRadius: '4px' }}>
            {newsItem.id}
          </code>
        </div>
        <div>
          {newsItem.features.length} features • {newsItem.images?.length || 0} images
        </div>
      </div>
    </div>
  );
};

export default NewsPreview;
