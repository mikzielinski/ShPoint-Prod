import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { missionsData } from '../data/missions';
import { MissionModal } from '../components/MissionModal';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';
const MissionsPage = () => {
    const { auth } = useAuth();
    const user = auth.status === 'authenticated' ? auth.user : null;
    const [selectedMission, setSelectedMission] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [missionCollections, setMissionCollections] = useState([]);
    const [loading, setLoading] = useState(false);
    const handleMissionClick = (mission) => {
        setSelectedMission(mission);
        setShowModal(true);
    };
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedMission(null);
    };
    // Load mission collections
    const loadMissionCollections = async () => {
        if (!user)
            return;
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
        }
        catch (error) {
            console.error('Error loading mission collections:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Update mission status
    const handleUpdateMissionStatus = async (missionId, updates) => {
        if (!user)
            return;
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
                    setMissionCollections(prev => prev.filter(c => c && c.missionId).map(c => c.missionId === missionId ? data.missionCollection : c));
                }
                else {
                    console.log('Adding new collection');
                    setMissionCollections(prev => [...prev.filter(c => c && c.missionId), data.missionCollection]);
                }
                // Reload collections to ensure consistency
                console.log('Reloading collections...');
                await loadMissionCollections();
                console.log('Collections reloaded');
            }
        }
        catch (error) {
            console.error('Error updating mission status:', error);
        }
    };
    // Load collections on mount
    useEffect(() => {
        loadMissionCollections();
    }, [user]);
    return (_jsxs("div", { style: { padding: '20px', maxWidth: '1200px', margin: '0 auto' }, children: [_jsx("h1", { style: { color: '#fff', marginBottom: '30px', textAlign: 'center' }, children: "Star Wars: Shatterpoint Missions" }), _jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px',
                    marginTop: '20px'
                }, children: missionsData.map((mission) => (_jsxs("div", { onClick: () => handleMissionClick(mission), style: {
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        border: '2px solid #444',
                        borderRadius: '12px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                    }, onMouseEnter: (e) => {
                        e.currentTarget.style.borderColor = '#ffd700';
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.3)';
                    }, onMouseLeave: (e) => {
                        e.currentTarget.style.borderColor = '#444';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', marginBottom: '15px' }, children: [mission.thumbnail && (_jsx("img", { src: mission.thumbnail, alt: mission.name, style: {
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '8px',
                                        marginRight: '15px',
                                        objectFit: 'cover',
                                        border: '2px solid #444'
                                    }, onError: (e) => {
                                        const target = e.target;
                                        target.style.display = 'none';
                                    } })), _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("h3", { style: {
                                                        color: '#ffd700',
                                                        margin: '0',
                                                        fontSize: '18px',
                                                        fontWeight: 'bold'
                                                    }, children: mission.name }), (() => {
                                                    const collection = missionCollections.find(c => c && c.missionId === mission.id);
                                                    const isOwned = collection?.isOwned || false;
                                                    console.log(`Mission ${mission.id} - isOwned: ${isOwned}, collection:`, collection);
                                                    return isOwned && (_jsx("span", { style: {
                                                            background: '#10b981',
                                                            color: '#fff',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '10px',
                                                            fontWeight: '600'
                                                        }, children: "OWN" }));
                                                })()] }), _jsx("p", { style: {
                                                color: '#ccc',
                                                margin: '0',
                                                fontSize: '14px',
                                                textTransform: 'capitalize'
                                            }, children: mission.source })] })] }), mission.description && (_jsx("p", { style: {
                                color: '#aaa',
                                fontSize: '14px',
                                lineHeight: '1.4',
                                margin: '0 0 15px 0'
                            }, children: mission.description })), _jsxs("div", { style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px',
                                color: '#888',
                                marginBottom: '15px'
                            }, children: [_jsxs("span", { children: ["Struggles: ", mission.struggles.length] }), _jsxs("span", { children: ["Objectives: ", mission.objectives.length] })] }), user ? (_jsxs("div", { style: {
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'nowrap',
                                justifyContent: 'center'
                            }, children: [_jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        const currentCollection = missionCollections.find(c => c && c.missionId === mission.id);
                                        const isOwned = currentCollection?.isOwned || false;
                                        handleUpdateMissionStatus(mission.id, { isOwned: !isOwned });
                                    }, style: {
                                        backgroundColor: missionCollections.find(c => c && c.missionId === mission.id)?.isOwned ? '#10b981' : '#374151',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }, children: missionCollections.find(c => c && c.missionId === mission.id)?.isOwned ? 'OWNED' : 'OWN' }), _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        const currentCollection = missionCollections.find(c => c && c.missionId === mission.id);
                                        const isWishlist = currentCollection?.isWishlist || false;
                                        handleUpdateMissionStatus(mission.id, { isWishlist: !isWishlist });
                                    }, style: {
                                        backgroundColor: missionCollections.find(c => c && c.missionId === mission.id)?.isWishlist ? '#8b5cf6' : '#374151',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }, children: "\u2B50" }), missionCollections.find(c => c && c.missionId === mission.id) && (_jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        fetch(api(`/api/shatterpoint/missions/${mission.id}`), {
                                            method: 'DELETE',
                                            credentials: 'include'
                                        }).then(() => {
                                            setMissionCollections(prev => prev.filter(c => c && c.missionId && c.missionId !== mission.id));
                                        });
                                    }, style: {
                                        backgroundColor: '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }, children: "Remove" }))] })) : (_jsx("div", { style: {
                                textAlign: 'center',
                                padding: '10px',
                                backgroundColor: '#374151',
                                borderRadius: '6px',
                                color: '#9ca3af',
                                fontSize: '12px'
                            }, children: "Sign in to add missions to your collection" }))] }, mission.id))) }), showModal && selectedMission && (_jsx(MissionModal, { mission: selectedMission, onClose: handleCloseModal }))] }));
};
export default MissionsPage;
