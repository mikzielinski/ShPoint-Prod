import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export default function UserInvitationModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const role = 'USER'; // Users can only invite as USER role
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    // Load invitation stats when modal opens
    useEffect(() => {
        if (isOpen) {
            loadStats();
        }
    }, [isOpen]);
    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/user/invitations', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
            else {
                setError('Failed to load invitation stats');
            }
        }
        catch (err) {
            setError('Network error');
        }
        finally {
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
            const response = await fetch('/api/user/invitations', {
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
            }
            else {
                setError(data.error || 'Failed to send invitation');
            }
        }
        catch (err) {
            setError('Network error');
        }
        finally {
            setSending(false);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { style: {
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
        }, onClick: onClose, children: _jsxs("div", { style: {
                backgroundColor: '#1e293b',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '500px',
                width: '100%',
                border: '1px solid #334155',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h2", { style: {
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#f8fafc',
                                margin: '0 0 8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }, children: "\uD83D\uDCE7 Send Invitation" }), _jsx("p", { style: {
                                fontSize: '14px',
                                color: '#94a3b8',
                                margin: 0
                            }, children: "Invite someone to join ShPoint" })] }), loading ? (_jsx("div", { style: {
                        background: 'rgba(71, 85, 105, 0.2)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                        textAlign: 'center'
                    }, children: _jsx("span", { style: { color: '#94a3b8' }, children: "Loading stats..." }) })) : stats ? (_jsxs("div", { style: {
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                    }, children: [_jsxs("div", { style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                            }, children: [_jsx("span", { style: { fontSize: '14px', color: '#93c5fd', fontWeight: '600' }, children: "Invitations" }), _jsxs("span", { style: { fontSize: '14px', color: '#cbd5e1' }, children: [stats.invitationsSent, " / ", stats.invitationsLimit] })] }), _jsx("div", { style: {
                                background: 'rgba(30, 41, 59, 0.5)',
                                borderRadius: '8px',
                                height: '8px',
                                overflow: 'hidden'
                            }, children: _jsx("div", { style: {
                                    background: stats.remainingInvitations > 0 ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : '#ef4444',
                                    height: '100%',
                                    width: `${(stats.invitationsSent / stats.invitationsLimit) * 100}%`,
                                    transition: 'width 0.3s ease'
                                } }) }), _jsxs("div", { style: {
                                fontSize: '12px',
                                color: '#94a3b8',
                                marginTop: '8px',
                                textAlign: 'center'
                            }, children: [stats.remainingInvitations, " remaining"] })] })) : null, _jsx("div", { style: { marginBottom: '24px' }, children: _jsxs("div", { style: { marginBottom: '16px' }, children: [_jsx("label", { style: {
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#e2e8f0',
                                    marginBottom: '8px'
                                }, children: "Email Address" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "user@example.com", style: {
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #475569',
                                    backgroundColor: '#0f172a',
                                    color: '#f8fafc',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }, onFocus: (e) => e.target.style.borderColor = '#3b82f6', onBlur: (e) => e.target.style.borderColor = '#475569' })] }) }), error && (_jsx("div", { style: {
                        background: 'rgba(220, 38, 38, 0.1)',
                        border: '1px solid rgba(220, 38, 38, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '16px'
                    }, children: _jsxs("span", { style: { color: '#fca5a5', fontSize: '14px' }, children: ["\u274C ", error] }) })), success && (_jsx("div", { style: {
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '16px'
                    }, children: _jsxs("span", { style: { color: '#86efac', fontSize: '14px' }, children: ["\u2705 ", success] }) })), _jsxs("div", { style: {
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end'
                    }, children: [_jsx("button", { onClick: onClose, style: {
                                background: 'transparent',
                                color: '#cbd5e1',
                                border: '1px solid #475569',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }, onMouseOver: (e) => {
                                e.target.style.background = 'rgba(71, 85, 105, 0.2)';
                                e.target.style.borderColor = '#64748b';
                            }, onMouseOut: (e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.borderColor = '#475569';
                            }, children: "Cancel" }), _jsx("button", { onClick: handleSendInvitation, disabled: sending || !email.trim() || (stats && stats.remainingInvitations <= 0), style: {
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
                            }, onMouseOver: (e) => {
                                if (stats && stats.remainingInvitations > 0) {
                                    e.target.style.transform = 'translateY(-1px)';
                                }
                            }, onMouseOut: (e) => {
                                e.target.style.transform = 'translateY(0)';
                            }, children: sending ? 'Sending...' : 'Send Invitation' })] }), _jsx("div", { style: {
                        marginTop: '24px',
                        paddingTop: '16px',
                        borderTop: '1px solid #334155',
                        textAlign: 'center'
                    }, children: _jsx("p", { style: {
                            fontSize: '12px',
                            color: '#64748b',
                            margin: 0
                        }, children: "The invited user will receive access to sign in with their Google account." }) })] }) }));
}
