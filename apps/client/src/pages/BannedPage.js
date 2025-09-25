import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
export default function BannedPage() {
    const { auth } = useAuth();
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);
    useEffect(() => {
        if (auth.user?.suspendedUntil) {
            const updateTimeLeft = () => {
                const now = new Date();
                const suspendedUntil = new Date(auth.user.suspendedUntil);
                if (now >= suspendedUntil) {
                    setTimeLeft('Your suspension has ended!');
                    setIsExpired(true);
                    return;
                }
                const diff = suspendedUntil.getTime() - now.getTime();
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                if (days > 0) {
                    setTimeLeft(`${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} min`);
                }
                else if (hours > 0) {
                    setTimeLeft(`${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} min, ${seconds}s`);
                }
                else if (minutes > 0) {
                    setTimeLeft(`${minutes} min, ${seconds}s`);
                }
                else {
                    setTimeLeft(`${seconds} seconds`);
                }
            };
            updateTimeLeft();
            const interval = setInterval(updateTimeLeft, 1000); // Update every second for better UX
            return () => clearInterval(interval);
        }
    }, [auth.user?.suspendedUntil]);
    const handleViewLibrary = () => {
        window.location.href = '/library';
    };
    return (_jsx("div", { style: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }, children: _jsxs("div", { style: {
                maxWidth: '600px',
                width: '100%',
                textAlign: 'center',
                background: 'rgba(30, 41, 59, 0.8)',
                borderRadius: '24px',
                padding: '48px 32px',
                border: '1px solid rgba(71, 85, 105, 0.3)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)'
            }, children: [_jsx("div", { style: {
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 24px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px'
                    }, children: "\u23F0" }), _jsx("h1", { style: {
                        fontSize: '32px',
                        fontWeight: '800',
                        color: '#f8fafc',
                        margin: '0 0 16px',
                        letterSpacing: '-0.02em'
                    }, children: "Account Suspended" }), _jsx("p", { style: {
                        fontSize: '18px',
                        color: '#cbd5e1',
                        margin: '0 0 32px',
                        lineHeight: '1.6'
                    }, children: "Your account has been temporarily suspended." }), timeLeft && (_jsxs("div", { style: {
                        background: isExpired ? 'rgba(34, 197, 94, 0.1)' : 'rgba(15, 23, 42, 0.5)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '32px',
                        border: isExpired ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(71, 85, 105, 0.2)'
                    }, children: [_jsx("h3", { style: {
                                fontSize: '16px',
                                fontWeight: '600',
                                color: isExpired ? '#86efac' : '#f1f5f9',
                                margin: '0 0 12px'
                            }, children: isExpired ? 'Suspension Status' : 'Time Remaining' }), _jsx("p", { style: {
                                fontSize: '20px',
                                color: isExpired ? '#22c55e' : '#fbbf24',
                                margin: '0',
                                fontWeight: '700'
                            }, children: timeLeft }), isExpired && (_jsx("p", { style: {
                                fontSize: '14px',
                                color: '#86efac',
                                margin: '12px 0 0',
                                opacity: '0.8'
                            }, children: "Please refresh the page to regain full access." }))] })), auth.user?.suspendedReason && (_jsxs("div", { style: {
                        background: 'rgba(220, 38, 38, 0.1)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(220, 38, 38, 0.2)',
                        marginBottom: '24px'
                    }, children: [_jsx("h3", { style: {
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#fca5a5',
                                margin: '0 0 8px'
                            }, children: "Reason for Suspension" }), _jsx("p", { style: {
                                fontSize: '14px',
                                color: '#fecaca',
                                margin: '0',
                                lineHeight: '1.5'
                            }, children: auth.user.suspendedReason })] })), _jsxs("div", { style: {
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        marginBottom: '24px'
                    }, children: [_jsx("h3", { style: {
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#93c5fd',
                                margin: '0 0 8px'
                            }, children: "Limited Access Available" }), _jsx("p", { style: {
                                fontSize: '14px',
                                color: '#cbd5e1',
                                margin: '0 0 16px',
                                lineHeight: '1.5'
                            }, children: "While suspended, you can still browse the character library for reference purposes." })] }), _jsxs("div", { style: {
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        marginBottom: '24px'
                    }, children: [_jsx("button", { onClick: handleViewLibrary, style: {
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
                            }, onMouseOver: (e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                            }, onMouseOut: (e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                            }, children: "Browse Library" }), isExpired && (_jsx("button", { onClick: () => window.location.reload(), style: {
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '14px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                            }, onMouseOver: (e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.4)';
                            }, onMouseOut: (e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                            }, children: "Refresh Page" })), _jsx("button", { onClick: () => window.location.href = '/', style: {
                                background: 'transparent',
                                color: '#cbd5e1',
                                border: '1px solid rgba(71, 85, 105, 0.5)',
                                borderRadius: '12px',
                                padding: '14px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }, onMouseOver: (e) => {
                                e.target.style.background = 'rgba(71, 85, 105, 0.2)';
                                e.target.style.borderColor = 'rgba(71, 85, 105, 0.8)';
                            }, onMouseOut: (e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.borderColor = 'rgba(71, 85, 105, 0.5)';
                            }, children: "Go Home" })] }), _jsxs("div", { style: {
                        background: 'rgba(71, 85, 105, 0.1)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(71, 85, 105, 0.2)'
                    }, children: [_jsx("h3", { style: {
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#cbd5e1',
                                margin: '0 0 8px'
                            }, children: "Questions?" }), _jsx("p", { style: {
                                fontSize: '14px',
                                color: '#94a3b8',
                                margin: '0',
                                lineHeight: '1.5'
                            }, children: "If you believe this suspension is in error, please contact an administrator." })] }), _jsx("p", { style: {
                        fontSize: '12px',
                        color: '#64748b',
                        margin: '24px 0 0',
                        opacity: '0.8'
                    }, children: "ShPoint \u2022 Suspended Account" })] }) }));
}
