import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';
import { useAuth } from '../auth/AuthContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  category: 'COLLECTION' | 'GAME_PLAY' | 'CHALLENGES' | 'STRIKE_TEAMS' | 'DICE_ROLLS' | 'SOCIAL' | 'SPECIAL';
  isActive: boolean;
  conditions: any;
  createdAt: string;
  updatedAt: string;
}

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [seeding, setSeeding] = useState(false);
  const { auth } = useAuth();
  const user = auth.status === 'authenticated' ? auth.user : null;

  const [newAchievement, setNewAchievement] = useState({
    name: '',
    description: '',
    icon: '🏆',
    rarity: 'COMMON' as const,
    category: 'COLLECTION' as const,
    conditions: {}
  });

  const categories = [
    { value: 'COLLECTION', label: 'Collection' },
    { value: 'GAME_PLAY', label: 'Game Play' },
    { value: 'CHALLENGES', label: 'Challenges' },
    { value: 'STRIKE_TEAMS', label: 'Strike Teams' },
    { value: 'DICE_ROLLS', label: 'Dice Rolls' },
    { value: 'SOCIAL', label: 'Social' },
    { value: 'SPECIAL', label: 'Special' }
  ];

  const rarities = [
    { value: 'COMMON', label: 'Common', color: '#6b7280' },
    { value: 'RARE', label: 'Rare', color: '#3b82f6' },
    { value: 'EPIC', label: 'Epic', color: '#8b5cf6' },
    { value: 'LEGENDARY', label: 'Legendary', color: '#fbbf24' }
  ];

  const commonIcons = ['🏆', '⭐', '🎯', '🔥', '💯', '🎮', '⚔️', '🥊', '📚', '🎨', '😅', '👍', '⚡', '🎭', '👥', '🎲'];

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch(api('/api/v2/achievements'), {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.ok) {
        setAchievements(data.achievements);
      } else {
        setError(data.error || 'Failed to load achievements');
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(api('/api/v2/achievements'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newAchievement)
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setShowCreateModal(false);
        setNewAchievement({
          name: '',
          description: '',
          icon: '🏆',
          rarity: 'COMMON',
          category: 'COLLECTION',
          conditions: {}
        });
        loadAchievements();
      } else {
        setError(data.error || 'Failed to create achievement');
      }
    } catch (err) {
      console.error('Failed to create achievement:', err);
      setError('Failed to create achievement');
    }
  };

  const handleUpdateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAchievement) return;
    
    try {
      const response = await fetch(api(`/api/v2/achievements/${editingAchievement.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editingAchievement)
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setEditingAchievement(null);
        loadAchievements();
      } else {
        setError(data.error || 'Failed to update achievement');
      }
    } catch (err) {
      console.error('Failed to update achievement:', err);
      setError('Failed to update achievement');
    }
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;
    
    try {
      const response = await fetch(api(`/api/v2/achievements/${achievementId}`), {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.ok) {
        loadAchievements();
      } else {
        setError(data.error || 'Failed to delete achievement');
      }
    } catch (err) {
      console.error('Failed to delete achievement:', err);
      setError('Failed to delete achievement');
    }
  };

  const handleSeedDefaultAchievements = async () => {
    try {
      setSeeding(true);
      const response = await fetch(api('/api/v2/achievements/seed'), {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.ok) {
        loadAchievements();
        alert('Default achievements seeded successfully!');
      } else {
        setError(data.error || 'Failed to seed achievements');
      }
    } catch (err) {
      console.error('Failed to seed achievements:', err);
      setError('Failed to seed achievements');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
        Loading achievements...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
          🏆 Admin - Achievements Management
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '16px', margin: '0 0 24px 0' }}>
          Create, edit, and manage achievements for the community.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ Create New Achievement
          </button>
          
          <button
            onClick={handleSeedDefaultAchievements}
            disabled={seeding}
            style={{
              background: seeding ? '#6b7280' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: seeding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {seeding ? '⏳' : '🌱'} {seeding ? 'Seeding...' : 'Seed Default Achievements'}
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Achievements List */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {achievements.map((achievement) => (
          <div 
            key={achievement.id} 
            style={{
              background: '#374151',
              padding: '20px',
              borderRadius: '12px',
              border: `2px solid ${rarities.find(r => r.value === achievement.rarity)?.color || '#6b7280'}`,
              position: 'relative'
            }}
          >
            {/* Status Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: achievement.isActive ? '#10b981' : '#ef4444',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              {achievement.isActive ? 'ACTIVE' : 'INACTIVE'}
            </div>

            {/* Achievement Icon */}
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {achievement.icon}
            </div>

            {/* Achievement Info */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h3 style={{ 
                color: '#f9fafb', 
                margin: '0 0 8px 0', 
                fontSize: '18px', 
                fontWeight: '600' 
              }}>
                {achievement.name}
              </h3>
              <p style={{ 
                color: '#9ca3af', 
                fontSize: '14px', 
                margin: '0 0 8px 0',
                lineHeight: '1.4'
              }}>
                {achievement.description}
              </p>
              <div style={{ 
                color: rarities.find(r => r.value === achievement.rarity)?.color || '#6b7280',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {achievement.rarity} • {categories.find(c => c.value === achievement.category)?.label}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEditingAchievement(achievement)}
                style={{
                  flex: 1,
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDeleteAchievement(achievement.id)}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Achievement Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1f2937',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #374151',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ color: '#f9fafb', margin: '0 0 24px 0', fontSize: '24px', fontWeight: '600' }}>
              Create New Achievement
            </h2>
            
            <form onSubmit={handleCreateAchievement}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#d1d5db', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '8px' 
                }}>
                  Name
                </label>
                <input
                  type="text"
                  value={newAchievement.name}
                  onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    background: '#374151',
                    color: '#f9fafb',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#d1d5db', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '8px' 
                }}>
                  Description
                </label>
                <textarea
                  value={newAchievement.description}
                  onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#374151',
                    color: '#f9fafb',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#d1d5db', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '8px' 
                }}>
                  Icon
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {commonIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewAchievement({ ...newAchievement, icon })}
                      style={{
                        background: newAchievement.icon === icon ? '#3b82f6' : '#374151',
                        color: 'white',
                        border: '1px solid #4b5563',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '20px',
                        cursor: 'pointer',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newAchievement.icon}
                  onChange={(e) => setNewAchievement({ ...newAchievement, icon: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#374151',
                    color: '#f9fafb',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#d1d5db', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '8px' 
                  }}>
                    Rarity
                  </label>
                  <select
                    value={newAchievement.rarity}
                    onChange={(e) => setNewAchievement({ ...newAchievement, rarity: e.target.value as any })}
                    style={{
                      width: '100%',
                      background: '#374151',
                      color: '#f9fafb',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      padding: '12px',
                      fontSize: '14px'
                    }}
                  >
                    {rarities.map(rarity => (
                      <option key={rarity.value} value={rarity.value}>
                        {rarity.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#d1d5db', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '8px' 
                  }}>
                    Category
                  </label>
                  <select
                    value={newAchievement.category}
                    onChange={(e) => setNewAchievement({ ...newAchievement, category: e.target.value as any })}
                    style={{
                      width: '100%',
                      background: '#374151',
                      color: '#f9fafb',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      padding: '12px',
                      fontSize: '14px'
                    }}
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Create Achievement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Achievement Modal */}
      {editingAchievement && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1f2937',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #374151',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ color: '#f9fafb', margin: '0 0 24px 0', fontSize: '24px', fontWeight: '600' }}>
              Edit Achievement
            </h2>
            
            <form onSubmit={handleUpdateAchievement}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#d1d5db', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '8px' 
                }}>
                  Name
                </label>
                <input
                  type="text"
                  value={editingAchievement.name}
                  onChange={(e) => setEditingAchievement({ ...editingAchievement, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    background: '#374151',
                    color: '#f9fafb',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#d1d5db', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '8px' 
                }}>
                  Description
                </label>
                <textarea
                  value={editingAchievement.description}
                  onChange={(e) => setEditingAchievement({ ...editingAchievement, description: e.target.value })}
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#374151',
                    color: '#f9fafb',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#d1d5db', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '8px' 
                  }}>
                    Rarity
                  </label>
                  <select
                    value={editingAchievement.rarity}
                    onChange={(e) => setEditingAchievement({ ...editingAchievement, rarity: e.target.value as any })}
                    style={{
                      width: '100%',
                      background: '#374151',
                      color: '#f9fafb',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      padding: '12px',
                      fontSize: '14px'
                    }}
                  >
                    {rarities.map(rarity => (
                      <option key={rarity.value} value={rarity.value}>
                        {rarity.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#d1d5db', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '8px' 
                  }}>
                    Category
                  </label>
                  <select
                    value={editingAchievement.category}
                    onChange={(e) => setEditingAchievement({ ...editingAchievement, category: e.target.value as any })}
                    style={{
                      width: '100%',
                      background: '#374151',
                      color: '#f9fafb',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      padding: '12px',
                      fontSize: '14px'
                    }}
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingAchievement(null)}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Update Achievement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
