import React, { useState } from 'react';
import { api } from "../lib/env";
import ShPointLogo from '../components/ShPointLogo';

export default function UnauthorizedPage() {
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmitAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.toLowerCase().endsWith('@gmail.com')) {
      setSubmitError('Only Gmail addresses are accepted');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(api('/api/v2/access-requests'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          name: name || null,
          message: message || null
        })
      });

      const data = await response.json();

      if (data.ok) {
        setSubmitSuccess(true);
        setEmail('');
        setName('');
        setMessage('');
        setTimeout(() => {
          setShowAccessForm(false);
          setSubmitSuccess(false);
        }, 3000);
      } else {
        setSubmitError(data.error || 'Failed to submit access request');
      }
    } catch (error) {
      console.error('Error submitting access request:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        background: 'rgba(30, 41, 59, 0.8)',
        borderRadius: '24px',
        padding: '48px 32px',
        border: '1px solid rgba(71, 85, 105, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Logo */}
        <div style={{
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShPointLogo size={60} showText={true} />
        </div>
        
        {/* Icon */}
        <div style={{
          width: '60px',
          height: '60px',
          margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          🚫
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#f8fafc',
          margin: '0 0 16px',
          letterSpacing: '-0.02em'
        }}>
          Access Restricted
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '18px',
          color: '#cbd5e1',
          margin: '0 0 32px',
          lineHeight: '1.6'
        }}>
          Your email address is not authorized to access this application.
        </p>

        {/* Description */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid rgba(71, 85, 105, 0.2)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#f1f5f9',
            margin: '0 0 12px'
          }}>
            What does this mean?
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: '0',
            lineHeight: '1.5'
          }}>
            This application requires an invitation to join. Only users with authorized email addresses can sign in.
          </p>
        </div>

        {/* Contact Info / Access Request Form */}
        {!showAccessForm ? (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#93c5fd',
              margin: '0 0 8px'
            }}>
              Need Access?
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#cbd5e1',
              margin: '0 0 16px',
              lineHeight: '1.5'
            }}>
              Submit an access request and we'll review it as soon as possible.
            </p>
            <button
              onClick={() => setShowAccessForm(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Submit Access Request
            </button>
          </div>
        ) : (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#93c5fd',
              margin: '0 0 16px'
            }}>
              Request Access
            </h3>
            
            {submitSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#6ee7b7',
                fontSize: '14px'
              }}>
                ✅ Access request submitted successfully! We'll review it soon.
              </div>
            )}
            
            {submitError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#fca5a5',
                fontSize: '14px'
              }}>
                ❌ {submitError}
              </div>
            )}
            
            <form onSubmit={handleSubmitAccessRequest} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#cbd5e1',
                  marginBottom: '6px'
                }}>
                  Email Address (Gmail only) *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(71, 85, 105, 0.5)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#cbd5e1',
                  marginBottom: '6px'
                }}>
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(71, 85, 105, 0.5)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#cbd5e1',
                  marginBottom: '6px'
                }}>
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us why you'd like access..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(71, 85, 105, 0.5)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    background: submitting ? 'rgba(71, 85, 105, 0.5)' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowAccessForm(false);
                    setSubmitError(null);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#cbd5e1',
                    border: '1px solid rgba(71, 85, 105, 0.5)',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => window.location.href = api("/auth/google")}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'transparent',
              color: '#cbd5e1',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              borderRadius: '12px',
              padding: '14px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(71, 85, 105, 0.2)';
              e.target.style.borderColor = 'rgba(71, 85, 105, 0.8)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = 'rgba(71, 85, 105, 0.5)';
            }}
          >
            Go Home
          </button>
          
          <button
            onClick={() => window.location.href = '/faq'}
            style={{
              background: 'transparent',
              color: '#cbd5e1',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              borderRadius: '12px',
              padding: '14px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(71, 85, 105, 0.2)';
              e.target.style.borderColor = 'rgba(71, 85, 105, 0.8)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = 'rgba(71, 85, 105, 0.5)';
            }}
          >
            FAQ & Help
          </button>
        </div>

        {/* Footer */}
        <p style={{
          fontSize: '12px',
          color: '#64748b',
          margin: '24px 0 0',
          opacity: '0.8'
        }}>
          ShPoint • Admin Panel Access Required
        </p>
      </div>
    </div>
  );
}
