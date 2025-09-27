import React from 'react';
import { api } from "../lib/env";

export default function UnauthorizedPage() {
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
        {/* Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px'
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

        {/* Contact Info */}
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
            margin: '0',
            lineHeight: '1.5'
          }}>
            Contact your administrator to request an invitation to this application.
          </p>
        </div>

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
