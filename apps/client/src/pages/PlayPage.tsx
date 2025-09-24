import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const PlayPage: React.FC = () => {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      color: '#f9fafb'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        border: '1px solid #4b5563'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#f9fafb',
          margin: '0 0 8px 0',
          textAlign: 'center'
        }}>
          🎮 Play Strike Teams
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#9ca3af',
          textAlign: 'center',
          margin: '0 0 32px 0'
        }}>
          Battle with your strike teams from My Collection
        </p>

        {/* Game Mode Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Hero vs Hero */}
          <NavLink
            to="/play/hero-vs-hero"
            style={{
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <div style={{
              background: '#1f2937',
              borderRadius: '12px',
              padding: '24px',
              border: '2px solid #374151',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.background = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.background = '#1f2937';
            }}
            >
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                <span className="sp sp-melee" style={{ fontSize: '48px', color: '#f97316' }}>o</span>
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#f9fafb',
                margin: '0 0 8px 0'
              }}>
                Hero vs Hero
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#9ca3af',
                margin: '0'
              }}>
                Battle between individual characters from your collection
              </p>
            </div>
          </NavLink>

          {/* Strike Team vs Strike Team */}
          <NavLink
            to="/play/strike-team-vs-strike-team"
            style={{
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <div style={{
              background: '#1f2937',
              borderRadius: '12px',
              padding: '24px',
              border: '2px solid #374151',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.background = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.background = '#1f2937';
            }}
            >
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                🎯
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#f9fafb',
                margin: '0 0 8px 0'
              }}>
                Strike Team vs Strike Team
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#9ca3af',
                margin: '0'
              }}>
                Full squad battles with your strike teams
              </p>
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default PlayPage;
