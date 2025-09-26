import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';

type InvitationStats = {
  invitationsSent: number;
  invitationsLimit: number;
  remainingInvitations: number;
};

type UserInvitationModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function UserInvitationModal({ isOpen, onClose }: UserInvitationModalProps) {
  const [email, setEmail] = useState('');
  const role = 'USER'; // Users can only invite as USER role
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load invitation stats when modal opens
  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(api('/api/user/invitations'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to load invitation stats');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(api('/api/user/invitations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Invitation sent to ${email}!`);
        setEmail('');
        loadStats(); // Refresh stats
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#f8fafc',
            margin: '0 0 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📧 Send Invitation
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: 0
          }}>
            Invite someone to join ShPoint
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div style={{
            background: 'rgba(71, 85, 105, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <span style={{ color: '#94a3b8' }}>Loading stats...</span>
          </div>
        ) : stats ? (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#93c5fd', fontWeight: '600' }}>
                Invitations
              </span>
              <span style={{ fontSize: '14px', color: '#cbd5e1' }}>
                {stats.invitationsSent} / {stats.invitationsLimit}
              </span>
            </div>
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '8px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: stats.remainingInvitations > 0 ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : '#ef4444',
                height: '100%',
                width: `${(stats.invitationsSent / stats.invitationsLimit) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              {stats.remainingInvitations} remaining
            </div>
          </div>
        ) : null}

        {/* Form */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#e2e8f0',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#475569'}
            />
          </div>

        </div>

        {/* Messages */}
        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ color: '#fca5a5', fontSize: '14px' }}>❌ {error}</span>
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ color: '#86efac', fontSize: '14px' }}>✅ {success}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#cbd5e1',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(71, 85, 105, 0.2)';
              e.target.style.borderColor = '#64748b';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = '#475569';
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSendInvitation}
            disabled={sending || !email.trim() || (stats && stats.remainingInvitations <= 0)}
            style={{
              background: (stats && stats.remainingInvitations <= 0) ? '#6b7280' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (stats && stats.remainingInvitations <= 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: (stats && stats.remainingInvitations <= 0) ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (stats && stats.remainingInvitations > 0) {
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #334155',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#64748b',
            margin: 0
          }}>
            The invited user will receive access to sign in with their Google account.
          </p>
        </div>
      </div>
    </div>
  );
}
