import React, { useState } from 'react';
import { api } from '../lib/env';

interface AccessRequestFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  compact?: boolean;
}

const AccessRequestForm: React.FC<AccessRequestFormProps> = ({ 
  onSuccess, 
  onError, 
  compact = false 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.email.toLowerCase().endsWith('@gmail.com')) {
      onError?.('Only Gmail addresses are accepted');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch(api('/api/v2/access-requests'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.ok) {
        setIsSubmitted(true);
        setFormData({ email: '', name: '', message: '' });
        onSuccess?.();
      } else {
        onError?.(result.error || 'Failed to submit access request');
      }
    } catch (error) {
      onError?.('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isSubmitted) {
    return (
      <div style={{
        padding: compact ? '16px' : '24px',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '8px',
        color: '#e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: compact ? '16px' : '18px', color: '#10b981' }}>
          ✅ Request Submitted Successfully!
        </h3>
        <p style={{ margin: 0, fontSize: compact ? '14px' : '16px' }}>
          We've received your access request. You'll be notified via email when it's reviewed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      padding: compact ? '16px' : '24px',
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: compact ? '16px' : '18px',
        color: '#e2e8f0'
      }}>
        Request Access to ShPoint
      </h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: 'bold',
          fontSize: compact ? '14px' : '16px',
          color: '#e2e8f0'
        }}>
          Gmail Address *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="your.email@gmail.com"
          required
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #475569',
            borderRadius: '4px',
            fontSize: compact ? '14px' : '16px',
            boxSizing: 'border-box',
            backgroundColor: '#334155',
            color: '#e2e8f0'
          }}
        />
        <small style={{ 
          color: '#cbd5e1', 
          fontSize: compact ? '12px' : '14px',
          display: 'block',
          marginTop: '4px'
        }}>
          Only Gmail addresses are accepted
        </small>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: 'bold',
          fontSize: compact ? '14px' : '16px',
          color: '#e2e8f0'
        }}>
          Name (Optional)
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Your name"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #475569',
            backgroundColor: '#334155',
            color: '#e2e8f0',
            borderRadius: '4px',
            fontSize: compact ? '14px' : '16px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: 'bold',
          fontSize: compact ? '14px' : '16px',
          color: '#e2e8f0'
        }}>
          Message (Optional)
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          placeholder="Tell us why you'd like access to ShPoint..."
          rows={compact ? 3 : 4}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #475569',
            backgroundColor: '#334155',
            color: '#e2e8f0',
            borderRadius: '4px',
            fontSize: compact ? '14px' : '16px',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <p style={{ 
          margin: 0, 
          fontSize: compact ? '12px' : '14px',
          color: '#e2e8f0'
        }}>
          <strong>Note:</strong> We don't know when your request will be approved. 
          You'll receive an email notification once it's reviewed. Make sure to use a Gmail address.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !formData.email}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isSubmitting || !formData.email ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: compact ? '14px' : '16px',
          fontWeight: 'bold',
          cursor: isSubmitting || !formData.email ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s ease'
        }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Access Request'}
      </button>
    </form>
  );
};

export default AccessRequestForm;
