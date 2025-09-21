import React, { useState, useEffect } from 'react';
import { AbilityIcon } from '../AbilityIcon';
import GlyphPicker from '../GlyphPicker';

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

interface NewsEditorProps {
  newsItem?: NewsItem;
  onSave: (news: NewsItem) => void;
  onCancel: () => void;
  onDelete?: (newsId: string) => void;
}

const NewsEditor: React.FC<NewsEditorProps> = ({ newsItem, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = useState({
    id: '',
    date: '',
    title: '',
    description: '',
    features: [] as string[],
    status: 'completed' as 'completed' | 'in-progress' | 'planned',
    images: [] as string[],
    content: ''
  });

  const [newFeature, setNewFeature] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showGlyphPicker, setShowGlyphPicker] = useState(false);

  useEffect(() => {
    if (newsItem) {
      setFormData({
        id: newsItem.id || '',
        date: newsItem.date || '',
        title: newsItem.title || '',
        description: newsItem.description || '',
        features: newsItem.features?.map(f => typeof f === 'string' ? f : '') || [],
        status: newsItem.status || 'completed',
        images: newsItem.images || [],
        content: newsItem.content || ''
      });
    } else {
      // New news item - set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        id: '',
        date: today,
        title: '',
        description: '',
        features: [],
        status: 'completed',
        images: [],
        content: ''
      });
    }
  }, [newsItem]);

  const handleSave = () => {
    const newsToSave: NewsItem = {
      ...formData,
      features: formData.features.map(f => f.trim()).filter(f => f.length > 0)
    };
    onSave(newsToSave);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleGlyphSelect = (glyph: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + `<span style="font-family: ShatterpointIcons">${glyph}</span>`
    }));
  };

  return (
    <div style={{
      background: '#1f2937',
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h2 style={{ color: '#f9fafb', marginBottom: '24px', fontSize: '24px' }}>
        {newsItem ? 'Edit News Item' : 'Create New News Item'}
      </h2>

      {/* Basic Information */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#f9fafb', marginBottom: '16px', fontSize: '18px' }}>
          Basic Information
        </h3>
        
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px', fontSize: '14px' }}>
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#374151',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px', fontSize: '14px' }}>
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., 🎨 New Feature Release"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#374151',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px', fontSize: '14px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the update..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#374151',
                color: '#f9fafb',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px', fontSize: '14px' }}>
              Status
            </label>
            <div className="role-select-wrap">
              <select
                className="role-select"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                style={{ fontSize: '14px' }}
              >
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="planned">Planned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#f9fafb', marginBottom: '16px', fontSize: '18px' }}>
          Features
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add a new feature..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#374151',
                color: '#f9fafb',
                fontSize: '14px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
            />
            <button
              onClick={handleAddFeature}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#10b981',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {formData.features.map((feature, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#374151',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#f9fafb'
              }}
            >
              <span>{feature}</span>
              <button
                onClick={() => handleRemoveFeature(index)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#dc2626',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Images */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#f9fafb', marginBottom: '16px', fontSize: '18px' }}>
          Images
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Image URL..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#374151',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleAddImage}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {formData.images.map((imageUrl, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                background: '#374151',
                borderRadius: '6px',
                overflow: 'hidden'
              }}
            >
              <img
                src={imageUrl}
                alt={`News image ${index + 1}`}
                style={{
                  width: '100%',
                  height: '120px',
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
                height: '120px',
                background: '#374151',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '12px'
              }}>
                Failed to load
              </div>
              <button
                onClick={() => handleRemoveImage(index)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#dc2626',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rich Content */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: '#f9fafb', fontSize: '18px', margin: '0' }}>
            Rich Content (Optional)
          </h3>
          <button
            type="button"
            onClick={() => setShowGlyphPicker(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #4b5563',
              background: '#374151',
              color: '#f9fafb',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4b5563';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#374151';
              e.currentTarget.style.borderColor = '#4b5563';
            }}
          >
            <span style={{ fontFamily: 'ShatterpointIcons', fontSize: '16px' }}>j</span>
            Add Glyph
          </button>
        </div>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Additional rich content with HTML support..."
          rows={8}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #4b5563',
            background: '#374151',
            color: '#f9fafb',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            resize: 'vertical'
          }}
        />
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
          Supports HTML formatting. Use the "Add Glyph" button or <code style={{ background: '#1f2937', padding: '2px 4px', borderRadius: '3px' }}>&lt;span style="font-family: ShatterpointIcons"&gt;</code> for special game symbols.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        {newsItem && onDelete && (
          <button
            onClick={() => onDelete(newsItem.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#dc2626',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
        )}
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid #4b5563',
            background: 'transparent',
            color: '#9ca3af',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: '#10b981',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {newsItem ? 'Update' : 'Create'}
        </button>
      </div>

      {/* Glyph Picker Modal */}
      {showGlyphPicker && (
        <GlyphPicker
          onSelect={handleGlyphSelect}
          onClose={() => setShowGlyphPicker(false)}
        />
      )}
    </div>
  );
};

export default NewsEditor;
