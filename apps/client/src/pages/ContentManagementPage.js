import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import CharacterEditor from '../components/editors/CharacterEditor';
const ContentManagementPage = () => {
    const { auth } = useAuth();
    const me = auth.status === 'authenticated' ? auth.user : null;
    const [activeMode, setActiveMode] = useState('characters');
    const [showEditor, setShowEditor] = useState(false);
    const [editingCharacter, setEditingCharacter] = useState(null);
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadCharacters = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/characters', { credentials: 'include' });
            const data = await response.json();
            setCharacters(data.items || []);
        }
        catch (error) {
            console.error('Błąd ładowania postaci:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadCharacters();
    }, []);
    // Kontrola dostępu
    if (!me || (me.role !== 'ADMIN' && me.role !== 'EDITOR')) {
        return (_jsx("div", { className: "min-h-screen bg-gray-900 text-white flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Brak dost\u0119pu" }), _jsx("p", { className: "text-gray-400", children: "Nie masz uprawnie\u0144 do zarz\u0105dzania tre\u015Bci\u0105" })] }) }));
    }
    const handleSaveCharacter = async (character) => {
        try {
            // TODO: Implement API call to save character
            console.log('Zapisywanie postaci:', character);
            // Tymczasowo dodaj do lokalnej listy
            if (editingCharacter) {
                setCharacters(prev => prev.map(c => c.id === character.id ? character : c));
            }
            else {
                setCharacters(prev => [...prev, character]);
            }
            setShowEditor(false);
            setEditingCharacter(null);
        }
        catch (error) {
            console.error('Błąd zapisywania postaci:', error);
            alert('Błąd podczas zapisywania postaci');
        }
    };
    const handleDeleteCharacter = async (characterId) => {
        try {
            // TODO: Implement API call to delete character
            console.log('Usuwanie postaci:', characterId);
            setCharacters(prev => prev.filter(c => c.id !== characterId));
            setShowEditor(false);
            setEditingCharacter(null);
        }
        catch (error) {
            console.error('Błąd usuwania postaci:', error);
            alert('Błąd podczas usuwania postaci');
        }
    };
    const handleEditCharacter = (character) => {
        setEditingCharacter(character);
        setShowEditor(true);
    };
    const handleNewCharacter = () => {
        setEditingCharacter(null);
        setShowEditor(true);
    };
    const handleCancelEditor = () => {
        setShowEditor(false);
        setEditingCharacter(null);
    };
    const renderModeSelector = () => (_jsxs("div", { className: "bg-gray-800 p-4 rounded-lg mb-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "Content Management" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { onClick: () => setActiveMode('characters'), className: `px-4 py-2 rounded ${activeMode === 'characters'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: "Characters" }), _jsx("button", { onClick: () => setActiveMode('stances'), className: `px-4 py-2 rounded ${activeMode === 'stances'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: "Stance" }), _jsx("button", { onClick: () => setActiveMode('missions'), className: `px-4 py-2 rounded ${activeMode === 'missions'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: "Missions" }), _jsx("button", { onClick: () => setActiveMode('mission-sets'), className: `px-4 py-2 rounded ${activeMode === 'mission-sets'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: "Mission Sets" }), _jsx("button", { onClick: () => setActiveMode('sets'), className: `px-4 py-2 rounded ${activeMode === 'sets'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: "Sets/Boxes" })] })] }));
    const renderCharactersList = () => (_jsxs("div", { children: [_jsx("div", { style: { maxWidth: 1100, margin: "18px auto 0", padding: "0 16px" }, children: _jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("h1", { children: ["Characters (", characters.length, ")"] }), _jsx("button", { onClick: handleNewCharacter, className: "px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium", children: "Add New Character" })] }) }), loading ? (_jsx("p", { style: { maxWidth: 1100, margin: "0 auto", padding: "0 16px" }, children: "Loading characters..." })) : null, !loading && characters.length === 0 ? (_jsx("p", { style: { maxWidth: 1100, margin: "0 auto", padding: "0 16px" }, children: "No characters found." })) : null, _jsx("div", { className: "grid", children: characters.map((character) => (_jsxs("div", { className: "card relative group", role: "article", children: [_jsx("img", { src: character.portrait ?? "https://picsum.photos/seed/placeholder/400/520", alt: character.name, style: { objectFit: 'contain' } }), _jsx("div", { className: "title", children: character.name }), _jsx("div", { className: "meta", children: character.unit_type }), _jsx("div", { className: "px-3 pb-2 pt-1", children: _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            handleEditCharacter(character);
                                        }, className: "w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium", title: "Edit character", children: "Edit" }), _jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            handleDeleteCharacter(character.id);
                                        }, className: "w-full px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium", title: "Delete character", children: "Delete" })] }) })] }, character.id))) })] }));
    const renderContent = () => {
        switch (activeMode) {
            case 'characters':
                return renderCharactersList();
            case 'stances':
                return (_jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-gray-400", children: "Stance Editor - Coming Soon" }) }));
            case 'missions':
                return (_jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-gray-400", children: "Mission Editor - Coming Soon" }) }));
            case 'mission-sets':
                return (_jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-gray-400", children: "Mission Sets Editor - Coming Soon" }) }));
            case 'sets':
                return (_jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-gray-400", children: "Sets/Boxes Editor - Coming Soon" }) }));
            default:
                return null;
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-900 text-white", children: _jsxs("div", { className: "max-w-7xl mx-auto p-6", children: [renderModeSelector(), showEditor ? (_jsx(CharacterEditor, { character: editingCharacter, onSave: handleSaveCharacter, onCancel: handleCancelEditor, onDelete: handleDeleteCharacter })) : (renderContent())] }) }));
};
export default ContentManagementPage;
