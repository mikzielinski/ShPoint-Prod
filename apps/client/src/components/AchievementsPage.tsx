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
  isUnlocked: boolean;
  progress: number;
  communityCompletion: number;
  usersWithAchievement: number;
  totalUsers: number;
}

interface UserAchievement {
  id: string;
  achievementId: string;
  unlockedAt: string;
  progress: number;
  isCompleted: boolean;
  achievement: Achievement;
}

export default function AchievementsPage() {
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const { auth } = useAuth();
  const user = auth.status === 'authenticated' ? auth.user : null;

  const categories = [
    { value: 'all', label: 'All Categories', icon: '🏆' },
    { value: 'COLLECTION', label: 'Collection', icon: '📚' },
    { value: 'GAME_PLAY', label: 'Game Play', icon: '🎮' },
    { value: 'CHALLENGES', label: 'Challenges', icon: '🥊' },
    { value: 'STRIKE_TEAMS', label: 'Strike Teams', icon: '⚔️' },
    { value: 'DICE_ROLLS', label: 'Dice Rolls', icon: '🎲' },
    { value: 'SOCIAL', label: 'Social', icon: '👥' },
    { value: 'SPECIAL', label: 'Special', icon: '⭐' }
  ];

  const rarities = [
    { value: 'all', label: 'All Rarities', color: '#6b7280' },
    { value: 'COMMON', label: 'Common', color: '#6b7280' },
    { value: 'RARE', label: 'Rare', color: '#3b82f6' },
    { value: 'EPIC', label: 'Epic', color: '#8b5cf6' },
    { value: 'LEGENDARY', label: 'Legendary', color: '#fbbf24' }
  ];

  useEffect(() => {
    const loadAchievements = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Load all achievements with community stats
        const allResponse = await fetch(api('/api/v2/achievements'), {
          credentials: 'include'
        });
        const allData = await allResponse.json();
        
        if (allData.ok) {
          setAllAchievements(allData.achievements);
        } else {
          setError(allData.error || 'Failed to load achievements');
        }

        // Load user's achievements
        const userResponse = await fetch(api('/api/v2/achievements/my'), {
          credentials: 'include'
        });
        const userData = await userResponse.json();
        
        if (userData.ok) {
          setUserAchievements(userData.achievements);
        }
        
      } catch (err) {
        console.error('Failed to load achievements:', err);
        setError('Failed to load achievements');
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [user]);

  const filteredAchievements = allAchievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    const rarityMatch = selectedRarity === 'all' || achievement.rarity === selectedRarity;
    return categoryMatch && rarityMatch;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return '#fbbf24';
      case 'EPIC': return '#8b5cf6';
      case 'RARE': return '#3b82f6';
      case 'COMMON': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
      case 'EPIC': return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
      case 'RARE': return 'linear-gradient(135deg, #3b82f6, #2563eb)';
      case 'COMMON': return 'linear-gradient(135deg, #6b7280, #4b5563)';
      default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
        Loading achievements...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        Error: {error}
      </div>
    );
  }

  const unlockedCount = allAchievements.filter(a => a.isUnlocked).length;
  const totalCount = allAchievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#f9fafb', margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
          🏆 Achievements
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '16px', margin: '0 0 24px 0' }}>
          Track your progress and unlock new achievements!
        </p>
        
        {/* Progress Overview */}
        <div style={{
          background: 'linear-gradient(135deg, #374151, #1f2937)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #4b5563',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#f9fafb', margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Your Progress
            </h3>
            <div style={{ 
              background: '#10b981', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '14px', 
              fontWeight: 'bold' 
            }}>
              {unlockedCount}/{totalCount}
            </div>
          </div>
          <div style={{ 
            background: '#1f2937', 
            height: '12px', 
            borderRadius: '6px', 
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{ 
              background: 'linear-gradient(90deg, #10b981, #059669)', 
              height: '100%', 
              width: `${completionPercentage}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#9ca3af',
            textAlign: 'center'
          }}>
            {completionPercentage}% Complete
          </div>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Category Filter */}
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                background: '#374151',
                color: '#f9fafb',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                minWidth: '150px'
              }}
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rarity Filter */}
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
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              style={{
                background: '#374151',
                color: '#f9fafb',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                minWidth: '150px'
              }}
            >
              {rarities.map(rarity => (
                <option key={rarity.value} value={rarity.value}>
                  {rarity.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '20px' 
      }}>
        {filteredAchievements.map((achievement) => (
          <div 
            key={achievement.id} 
            style={{
              background: achievement.isUnlocked 
                ? getRarityGradient(achievement.rarity)
                : '#374151',
              padding: '20px',
              borderRadius: '12px',
              border: `2px solid ${getRarityColor(achievement.rarity)}`,
              position: 'relative',
              opacity: achievement.isUnlocked ? 1 : 0.6,
              transition: 'all 0.3s ease'
            }}
          >
            {/* Rarity Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: achievement.isUnlocked ? 'rgba(255, 255, 255, 0.2)' : '#1f2937',
              color: achievement.isUnlocked ? 'white' : '#9ca3af',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {achievement.rarity}
            </div>

            {/* Achievement Icon */}
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
              textAlign: 'center',
              filter: achievement.isUnlocked ? 'none' : 'grayscale(100%)'
            }}>
              {achievement.icon}
            </div>

            {/* Achievement Info */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h3 style={{ 
                color: achievement.isUnlocked ? 'white' : '#f9fafb', 
                margin: '0 0 8px 0', 
                fontSize: '18px', 
                fontWeight: '600' 
              }}>
                {achievement.name}
              </h3>
              <p style={{ 
                color: achievement.isUnlocked ? 'rgba(255, 255, 255, 0.8)' : '#9ca3af', 
                fontSize: '14px', 
                margin: 0,
                lineHeight: '1.4'
              }}>
                {achievement.description}
              </p>
            </div>

            {/* Progress Bar (for locked achievements) */}
            {!achievement.isUnlocked && achievement.progress > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '8px' 
                }}>
                  <span style={{ color: '#d1d5db', fontSize: '12px' }}>Progress</span>
                  <span style={{ color: '#d1d5db', fontSize: '12px' }}>{achievement.progress}%</span>
                </div>
                <div style={{ 
                  background: '#1f2937', 
                  height: '6px', 
                  borderRadius: '3px', 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    background: getRarityColor(achievement.rarity), 
                    height: '100%', 
                    width: `${achievement.progress}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Community Stats */}
            <div style={{
              background: achievement.isUnlocked ? 'rgba(255, 255, 255, 0.1)' : '#1f2937',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ 
                color: achievement.isUnlocked ? 'white' : '#d1d5db', 
                fontSize: '12px', 
                marginBottom: '4px' 
              }}>
                Community Completion
              </div>
              <div style={{ 
                color: achievement.isUnlocked ? 'white' : '#f9fafb', 
                fontSize: '16px', 
                fontWeight: 'bold' 
              }}>
                {achievement.communityCompletion}%
              </div>
              <div style={{ 
                color: achievement.isUnlocked ? 'rgba(255, 255, 255, 0.7)' : '#9ca3af', 
                fontSize: '10px' 
              }}>
                {achievement.usersWithAchievement} of {achievement.totalUsers} players
              </div>
            </div>

            {/* Unlocked Badge */}
            {achievement.isUnlocked && (
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: '#10b981',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                ✓ UNLOCKED
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#9ca3af' 
        }}>
          No achievements found for the selected filters.
        </div>
      )}
    </div>
  );
}
