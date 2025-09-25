import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export default function AdminInvitationSettings() {
    const [limits, setLimits] = useState({
        admin: 100,
        editor: 10,
        user: 3,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
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
            }
            else {
                const errorData = await response.json();
                if (response.status === 401) {
                    setError('Please log in to access this feature');
                }
                else if (response.status === 403) {
                    setError('Admin access required');
                }
                else {
                    setError(errorData.error || 'Failed to load invitation limits');
                }
            }
        }
        catch (err) {
            setError('Network error');
        }
        finally {
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
            }
            else {
                if (response.status === 401) {
                    setError('Please log in to access this feature');
                }
                else if (response.status === 403) {
                    setError('Admin access required');
                }
                else {
                    setError(data.error || 'Failed to update invitation limits');
                }
            }
        }
        catch (err) {
            setError('Network error');
        }
        finally {
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
            }
            else {
                setError('Limits saved but failed to apply to existing users');
            }
        }
        catch (err) {
            setError('Limits saved but failed to apply to existing users');
        }
    };
    const handleLimitChange = (role, value) => {
        const numValue = parseInt(value) || 0;
        setLimits(prev => ({
            ...prev,
            [role]: Math.max(0, numValue)
        }));
    };
    const testEmailConfiguration = async () => {
        try {
            setTestingEmail(true);
            setError(null);
            setSuccess(null);
            const response = await fetch('/api/admin/test-email', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.ok) {
                setSuccess('✅ Email configuration is working correctly!');
            }
            else {
                setError(`❌ Email configuration error: ${data.error}`);
            }
        }
        catch (err) {
            setError('Network error while testing email configuration');
        }
        finally {
            setTestingEmail(false);
        }
    };
    if (loading) {
        return (_jsx("div", { style: {
                background: 'rgba(71, 85, 105, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
            }, children: _jsx("span", { style: { color: '#94a3b8' }, children: "Loading invitation settings..." }) }));
    }
    return (_jsxs("div", { style: {
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #334155'
        }, children: [_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("h3", { style: {
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#f8fafc',
                            margin: '0 0 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }, children: "\u2699\uFE0F Invitation Limits" }), _jsx("p", { style: {
                            fontSize: '14px',
                            color: '#94a3b8',
                            margin: 0
                        }, children: "Set maximum invitations each role can send" })] }), _jsx("div", { style: { marginBottom: '20px' }, children: ['admin', 'editor', 'user'].map((role) => (_jsxs("div", { style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px',
                        padding: '12px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: '8px',
                        border: '1px solid #334155'
                    }, children: [_jsx("div", { style: {
                                minWidth: '80px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#e2e8f0',
                                textTransform: 'capitalize'
                            }, children: role }), _jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flex: 1
                            }, children: [_jsx("input", { type: "number", value: limits[role], onChange: (e) => handleLimitChange(role, e.target.value), min: "0", style: {
                                        width: '100px',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #475569',
                                        backgroundColor: '#0f172a',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }, onFocus: (e) => e.target.style.borderColor = '#3b82f6', onBlur: (e) => e.target.style.borderColor = '#475569' }), _jsx("span", { style: {
                                        fontSize: '12px',
                                        color: '#94a3b8'
                                    }, children: "invitations" })] }), _jsxs("div", { style: {
                                fontSize: '12px',
                                color: '#64748b',
                                minWidth: '60px',
                                textAlign: 'right'
                            }, children: [role === 'admin' && 'Unlimited access', role === 'editor' && 'Moderate access', role === 'user' && 'Basic access'] })] }, role))) }), error && (_jsx("div", { style: {
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
                }, children: [_jsx("button", { onClick: loadLimits, disabled: loading, style: {
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
                        }, onMouseOver: (e) => {
                            if (!loading) {
                                e.target.style.background = 'rgba(71, 85, 105, 0.2)';
                                e.target.style.borderColor = '#64748b';
                            }
                        }, onMouseOut: (e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.borderColor = '#475569';
                        }, children: "Reset" }), _jsx("button", { onClick: testEmailConfiguration, disabled: testingEmail, style: {
                            background: testingEmail ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: testingEmail ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: testingEmail ? 0.6 : 1
                        }, onMouseOver: (e) => {
                            if (!testingEmail) {
                                e.target.style.transform = 'translateY(-1px)';
                            }
                        }, onMouseOut: (e) => {
                            e.target.style.transform = 'translateY(0)';
                        }, children: testingEmail ? 'Testing...' : '📧 Test Email' }), _jsx("button", { onClick: handleSaveLimits, disabled: saving, style: {
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
                        }, onMouseOver: (e) => {
                            if (!saving) {
                                e.target.style.transform = 'translateY(-1px)';
                            }
                        }, onMouseOut: (e) => {
                            e.target.style.transform = 'translateY(0)';
                        }, children: saving ? 'Saving...' : 'Save Limits' })] }), _jsxs("div", { style: {
                    marginTop: '20px',
                    padding: '16px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }, children: [_jsx("h4", { style: {
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#93c5fd',
                            margin: '0 0 8px'
                        }, children: "\uD83D\uDCA1 How it works" }), _jsxs("ul", { style: {
                            fontSize: '12px',
                            color: '#cbd5e1',
                            margin: 0,
                            paddingLeft: '16px',
                            lineHeight: '1.5'
                        }, children: [_jsx("li", { children: "Changes apply to all existing users with the respective role" }), _jsx("li", { children: "New users get these limits automatically" }), _jsx("li", { children: "Suspended users cannot send invitations regardless of limits" }), _jsx("li", { children: "Limits are enforced in real-time" })] })] })] }));
}
