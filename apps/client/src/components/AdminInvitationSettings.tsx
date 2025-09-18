import React, { useState, useEffect } from 'react';

type InvitationLimits = {
  admin: number;
  editor: number;
  user: number;
};

export default function AdminInvitationSettings() {
  const [limits, setLimits] = useState<InvitationLimits>({
    admin: 100,
    editor: 10,
    user: 3,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/invitation-limits', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLimits(data.limits);
      } else {
        setError('Failed to load invitation limits');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLimits = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/invitation-limits', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ limits }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Invitation limits updated successfully!');
        // Apply changes to existing users
        await applyToUsers();
      } else {
        setError(data.error || 'Failed to update invitation limits');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const applyToUsers = async () => {
    try {
      const response = await fetch('/api/admin/update-user-limits', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('Invitation limits updated and applied to all users!');
      } else {
        setError('Limits saved but failed to apply to existing users');
      }
    } catch (err) {
      setError('Limits saved but failed to apply to existing users');
    }
  };

  const handleLimitChange = (role: keyof InvitationLimits, value: string) => {
    const numValue = parseInt(value) || 0;
    setLimits(prev => ({
      ...prev,
      [role]: Math.max(0, numValue)
    }));
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(71, 85, 105, 0.2)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <span style={{ color: '#94a3b8' }}>Loading invitation settings...</span>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.8)',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #334155'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#f8fafc',
          margin: '0 0 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚙️ Invitation Limits
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          margin: 0
        }}>
          Set maximum invitations each role can send
        </p>
      </div>

      {/* Limits Form */}
      <div style={{ marginBottom: '20px' }}>
        {(['admin', 'editor', 'user'] as const).map((role) => (
          <div key={role} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '8px',
            border: '1px solid #334155'
          }}>
            <div style={{
              minWidth: '80px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#e2e8f0',
              textTransform: 'capitalize'
            }}>
              {role}
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1
            }}>
              <input
                type="number"
                value={limits[role]}
                onChange={(e) => handleLimitChange(role, e.target.value)}
                min="0"
                style={{
                  width: '100px',
                  padding: '8px 12px',
                  borderRadius: '6px',
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
              
              <span style={{
                fontSize: '12px',
                color: '#94a3b8'
              }}>
                invitations
              </span>
            </div>

            <div style={{
              fontSize: '12px',
              color: '#64748b',
              minWidth: '60px',
              textAlign: 'right'
            }}>
              {role === 'admin' && 'Unlimited access'}
              {role === 'editor' && 'Moderate access'}
              {role === 'user' && 'Basic access'}
            </div>
          </div>
        ))}
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
          onClick={loadLimits}
          disabled={loading}
          style={{
            background: 'transparent',
            color: '#cbd5e1',
            border: '1px solid #475569',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: loading ? 0.6 : 1
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.background = 'rgba(71, 85, 105, 0.2)';
              e.target.style.borderColor = '#64748b';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = '#475569';
          }}
        >
          Reset
        </button>
        
        <button
          onClick={handleSaveLimits}
          disabled={saving}
          style={{
            background: saving ? '#6b7280' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: saving ? 0.6 : 1
          }}
          onMouseOver={(e) => {
            if (!saving) {
              e.target.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
          }}
        >
          {saving ? 'Saving...' : 'Save Limits'}
        </button>
      </div>

      {/* Info */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#93c5fd',
          margin: '0 0 8px'
        }}>
          💡 How it works
        </h4>
        <ul style={{
          fontSize: '12px',
          color: '#cbd5e1',
          margin: 0,
          paddingLeft: '16px',
          lineHeight: '1.5'
        }}>
          <li>Changes apply to all existing users with the respective role</li>
          <li>New users get these limits automatically</li>
          <li>Suspended users cannot send invitations regardless of limits</li>
          <li>Limits are enforced in real-time</li>
        </ul>
      </div>
    </div>
  );
}
