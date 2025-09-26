import React, { useState, useEffect } from 'react';
import { missionsData, Mission } from '../data/missions';
import { Modal } from '../components/Modal';
import { MissionModal } from '../components/MissionModal';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';

interface MissionCollection {
  id: string;
  userId: string;
  missionId: string;
  isOwned: boolean;
  isCompleted: boolean;
  isWishlist: boolean;
  isLocked: boolean;
  isFavorite: boolean;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const MissionsPage: React.FC = () => {
  const { auth } = useAuth();
  const user = auth.status === 'authenticated' ? auth.user : null;
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [missionCollections, setMissionCollections] = useState<MissionCollection[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMission(null);
  };

  // Load mission collections
  const loadMissionCollections = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🚀 Fetching from URL: /api/shatterpoint/missions');
      const response = await fetch(api('/api/shatterpoint/missions'), {
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      console.log('📡 Response status:', response.status);
      console.log('📡 Response URL:', response.url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Mission collections data:', data);
        console.log('Keys in data:', Object.keys(data));
        // Backend returns 'collections' not 'missionCollections'
        const collections = data.collections || data.missionCollections || [];
        console.log('Collections array:', collections);
        console.log('First collection structure:', collections[0]);
        // Filter out any null/undefined entries
        const filteredCollections = collections.filter(c => c && c.missionId);
        console.log('Filtered collections:', filteredCollections);
        console.log('Setting mission collections to:', filteredCollections);
        setMissionCollections(filteredCollections);
        console.log('Mission collections state updated');
      }
    } catch (error) {
      console.error('Error loading mission collections:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update mission status
  const handleUpdateMissionStatus = async (missionId: string, updates: Partial<MissionCollection>) => {
    if (!user) return;

    try {
      // Always use POST with upsert logic
      const response = await fetch(api('/api/shatterpoint/missions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ missionId, ...updates })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Update response data:', data);
        const existingCollection = missionCollections.find(c => c && c.missionId === missionId);
        console.log('Existing collection:', existingCollection);
        console.log('New collection data:', data.missionCollection);
        
        if (existingCollection) {
          console.log('Updating existing collection');
          setMissionCollections(prev => 
            prev.filter(c => c && c.missionId).map(c => c.missionId === missionId ? data.missionCollection : c)
          );
        } else {
          console.log('Adding new collection');
          setMissionCollections(prev => [...prev.filter(c => c && c.missionId), data.missionCollection]);
        }
        
        // Reload collections to ensure consistency
        console.log('Reloading collections...');
        await loadMissionCollections();
        console.log('Collections reloaded');
      }
    } catch (error) {
      console.error('Error updating mission status:', error);
    }
  };

  // Load collections on mount
  useEffect(() => {
    loadMissionCollections();
  }, [user]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', marginBottom: '30px', textAlign: 'center' }}>
        Star Wars: Shatterpoint Missions
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px',
        marginTop: '20px'
      }}>
        {missionsData.map((mission) => (
          <div
            key={mission.id}
            onClick={() => handleMissionClick(mission)}
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '2px solid #444',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ffd700';
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#444';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              {mission.thumbnail && (
                <img
                  src={mission.thumbnail}
                  alt={mission.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    marginRight: '15px',
                    objectFit: 'cover',
                    border: '2px solid #444'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ 
                    color: '#ffd700', 
                    margin: '0',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    {mission.name}
                  </h3>
                  {(() => {
                    const collection = missionCollections.find(c => c && c.missionId === mission.id);
                    const isOwned = collection?.isOwned || false;
                    console.log(`Mission ${mission.id} - isOwned: ${isOwned}, collection:`, collection);
                    return isOwned && (
                      <span style={{
                        background: '#10b981',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        OWN
                      </span>
                    );
                  })()}
                </div>
                <p style={{ 
                  color: '#ccc', 
                  margin: '0',
                  fontSize: '14px',
                  textTransform: 'capitalize'
                }}>
                  {mission.source}
                </p>
              </div>
            </div>
            
            {mission.description && (
              <p style={{ 
                color: '#aaa', 
                fontSize: '14px',
                lineHeight: '1.4',
                margin: '0 0 15px 0'
              }}>
                {mission.description}
              </p>
            )}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#888',
              marginBottom: '15px'
            }}>
              <span>Struggles: {mission.struggles.length}</span>
              <span>Objectives: {mission.objectives.length}</span>
            </div>

            {/* Collection Buttons */}
            {user ? (
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'nowrap',
                justifyContent: 'center'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentCollection = missionCollections.find(c => c && c.missionId === mission.id);
                    const isOwned = currentCollection?.isOwned || false;
                    handleUpdateMissionStatus(mission.id, { isOwned: !isOwned });
                  }}
                  style={{
                    backgroundColor: missionCollections.find(c => c && c.missionId === mission.id)?.isOwned ? '#10b981' : '#374151',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {missionCollections.find(c => c && c.missionId === mission.id)?.isOwned ? 'OWNED' : 'OWN'}
                </button>


                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentCollection = missionCollections.find(c => c && c.missionId === mission.id);
                    const isWishlist = currentCollection?.isWishlist || false;
                    handleUpdateMissionStatus(mission.id, { isWishlist: !isWishlist });
                  }}
                  style={{
                    backgroundColor: missionCollections.find(c => c && c.missionId === mission.id)?.isWishlist ? '#8b5cf6' : '#374151',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  ⭐
                </button>

                {missionCollections.find(c => c && c.missionId === mission.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetch(api(`/api/shatterpoint/missions/${mission.id}`), {
                        method: 'DELETE',
                        credentials: 'include'
                      }).then(() => {
                        setMissionCollections(prev => 
                          prev.filter(c => c && c.missionId && c.missionId !== mission.id)
                        );
                      });
                    }}
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center',
                padding: '10px',
                backgroundColor: '#374151',
                borderRadius: '6px',
                color: '#9ca3af',
                fontSize: '12px'
              }}>
                Sign in to add missions to your collection
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && selectedMission && (
        <MissionModal
          mission={selectedMission}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default MissionsPage;