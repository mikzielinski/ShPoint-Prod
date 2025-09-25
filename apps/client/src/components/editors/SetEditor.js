import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import charactersData from '../../data/characters.json';
const SetEditor = ({ set, onSave, onCancel, onPreview }) => {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        code: '',
        type: 'Core Set',
        image: '',
        description: '',
        product_url: '',
        characters: []
    });
    const [newCharacterName, setNewCharacterName] = useState('');
    useEffect(() => {
        if (set) {
            setFormData(set);
        }
        else {
            // Reset form for new set
            setFormData({
                id: '',
                name: '',
                code: '',
                type: 'Core Set',
                image: '',
                description: '',
                product_url: '',
                characters: []
            });
        }
    }, [set]);
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const handleAddCharacter = () => {
        if (newCharacterName.trim()) {
            // Find character in data to get their role
            const characterData = charactersData.find(char => char.name.toLowerCase().trim() === newCharacterName.toLowerCase().trim());
            const role = characterData ?
                (characterData.unit_type === 'Primary' ? 'Primary' :
                    characterData.unit_type === 'Secondary' ? 'Secondary' : 'Supporting') :
                'Primary'; // Default fallback
            setFormData(prev => ({
                ...prev,
                characters: [...(prev.characters || []), { name: newCharacterName.trim(), role }]
            }));
            setNewCharacterName('');
        }
    };
    const handleRemoveCharacter = (index) => {
        setFormData(prev => ({
            ...prev,
            characters: prev.characters?.filter((_, i) => i !== index) || []
        }));
    };
    const handleFindCharacters = () => {
        if (!formData.code) {
            alert('Please enter a Set Code first');
            return;
        }
        // Find characters that share this set code
        const matchingCharacters = charactersData.filter((char) => char.set_code === formData.code);
        if (matchingCharacters.length === 0) {
            alert(`No characters found with set code: ${formData.code}`);
            return;
        }
        // Add found characters to the set (avoid duplicates)
        const existingCharacterNames = new Set((formData.characters || []).map(char => char.name.toLowerCase().trim()));
        console.log('🔍 Existing characters:', Array.from(existingCharacterNames));
        console.log('🔍 Found characters:', matchingCharacters.map(char => char.name));
        const newCharacters = matchingCharacters
            .filter(char => {
            const charName = char.name.toLowerCase().trim();
            const exists = existingCharacterNames.has(charName);
            console.log(`🔍 Character "${char.name}" (normalized: "${charName}") - exists: ${exists}`);
            return !exists;
        })
            .map(char => ({
            name: char.name,
            role: char.unit_type === 'Primary' ? 'Primary' :
                char.unit_type === 'Secondary' ? 'Secondary' : 'Supporting'
        }));
        if (newCharacters.length === 0) {
            alert(`All characters from set ${formData.code} are already in this set.`);
            return;
        }
        setFormData(prev => ({
            ...prev,
            characters: [...(prev.characters || []), ...newCharacters]
        }));
        const skippedCount = matchingCharacters.length - newCharacters.length;
        if (skippedCount > 0) {
            alert(`Added ${newCharacters.length} new characters from set ${formData.code}. ${skippedCount} characters were already in the set.`);
        }
        else {
            alert(`Added ${newCharacters.length} characters from set ${formData.code}`);
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // Generate ID if not provided
        const finalSet = {
            ...formData,
            id: formData.id || formData.code.toLowerCase()
        };
        onSave(finalSet);
    };
    const setTypes = ['Core Set', 'Squad Pack', 'Terrain Pack', 'Duel Pack', 'Mission Pack'];
    return (_jsx("div", { style: {
            maxWidth: '600px',
            margin: '0 auto',
            padding: '20px',
            background: '#1f2937',
            borderRadius: '12px',
            border: '1px solid #374151'
        }, children: _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: [_jsx("label", { style: { fontWeight: '600', color: '#f3f4f6' }, children: "Set Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), required: true, style: {
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #374151',
                                background: '#1f2937',
                                color: '#f3f4f6',
                                fontSize: '14px'
                            }, placeholder: "e.g., Star Wars: Shatterpoint Core Set" })] }), _jsxs("div", { style: { display: 'flex', gap: '12px' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }, children: [_jsx("label", { style: { fontWeight: '600', color: '#f3f4f6' }, children: "Set Code *" }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("input", { type: "text", value: formData.code, onChange: (e) => handleInputChange('code', e.target.value.toUpperCase()), required: true, style: {
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #374151',
                                                background: '#1f2937',
                                                color: '#f3f4f6',
                                                fontSize: '14px',
                                                flex: 1
                                            }, placeholder: "e.g., SWP01" }), _jsx("button", { type: "button", onClick: handleFindCharacters, style: {
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #3b82f6',
                                                background: '#3b82f6',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }, children: "Find Characters" })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }, children: [_jsx("label", { style: { fontWeight: '600', color: '#f3f4f6' }, children: "Type *" }), _jsx("select", { value: formData.type, onChange: (e) => handleInputChange('type', e.target.value), required: true, style: {
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #374151',
                                        background: '#1f2937',
                                        color: '#f3f4f6',
                                        fontSize: '14px',
                                        appearance: 'none',
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 8px center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '16px',
                                        paddingRight: '32px'
                                    }, children: setTypes.map(type => (_jsx("option", { value: type, style: { background: '#1f2937', color: '#f3f4f6' }, children: type }, type))) })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: [_jsx("label", { style: { fontWeight: '600', color: '#f3f4f6' }, children: "Image URL" }), _jsx("input", { type: "url", value: formData.image || '', onChange: (e) => handleInputChange('image', e.target.value), style: {
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #374151',
                                background: '#1f2937',
                                color: '#f3f4f6',
                                fontSize: '14px'
                            }, placeholder: "https://example.com/set-image.jpg" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: [_jsx("label", { style: { fontWeight: '600', color: '#f3f4f6' }, children: "Description" }), _jsx("textarea", { value: formData.description || '', onChange: (e) => handleInputChange('description', e.target.value), rows: 3, style: {
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #374151',
                                background: '#1f2937',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                resize: 'vertical'
                            }, placeholder: "Brief description of the set..." })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: [_jsx("label", { style: { fontWeight: '600', color: '#f3f4f6' }, children: "Product URL" }), _jsx("input", { type: "url", value: formData.product_url || '', onChange: (e) => handleInputChange('product_url', e.target.value), style: {
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #374151',
                                background: '#1f2937',
                                color: '#f3f4f6',
                                fontSize: '14px'
                            }, placeholder: "https://www.atomicmassgames.com/..." })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: [_jsx("label", { style: { fontWeight: '600', color: '#f3f4f6' }, children: "Characters in Set" }), _jsxs("div", { style: { display: 'flex', gap: '8px', alignItems: 'end' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }, children: [_jsx("label", { style: { fontSize: '12px', color: '#9ca3af' }, children: "Character Name" }), _jsx("input", { type: "text", value: newCharacterName, onChange: (e) => setNewCharacterName(e.target.value), style: {
                                                padding: '6px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid #374151',
                                                background: '#1f2937',
                                                color: '#f3f4f6',
                                                fontSize: '12px'
                                            }, placeholder: "Character name (role will be auto-detected)" })] }), _jsx("button", { type: "button", onClick: handleAddCharacter, style: {
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: '#10b981',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }, children: "Add" })] }), formData.characters && formData.characters.length > 0 && (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '6px' }, children: formData.characters.map((char, index) => (_jsxs("div", { style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    background: '#374151',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                }, children: [_jsxs("div", { style: { display: 'flex', gap: '8px', alignItems: 'center' }, children: [_jsx("span", { style: {
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    background: char.role === 'Primary' ? '#dc2626' : char.role === 'Secondary' ? '#d97706' : '#059669',
                                                    color: 'white',
                                                    fontSize: '10px',
                                                    fontWeight: '600'
                                                }, children: char.role }), _jsx("span", { style: { color: '#f3f4f6' }, children: char.name })] }), _jsx("button", { type: "button", onClick: () => handleRemoveCharacter(index), style: {
                                            padding: '2px 6px',
                                            borderRadius: '3px',
                                            border: 'none',
                                            background: '#dc2626',
                                            color: 'white',
                                            fontSize: '10px',
                                            cursor: 'pointer'
                                        }, children: "Remove" })] }, index))) }))] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }, children: [_jsx("button", { type: "button", onClick: onCancel, style: {
                                padding: '10px 20px',
                                borderRadius: '6px',
                                border: '1px solid #374151',
                                background: 'transparent',
                                color: '#9ca3af',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }, children: "Cancel" }), onPreview && formData.name && formData.code && (_jsx("button", { type: "button", onClick: () => onPreview(formData), style: {
                                padding: '10px 20px',
                                borderRadius: '6px',
                                border: '1px solid #10b981',
                                background: 'transparent',
                                color: '#10b981',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }, children: "Preview" })), _jsx("button", { type: "submit", style: {
                                padding: '10px 20px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#3b82f6',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }, children: set ? 'Update Set' : 'Create Set' })] })] }) }));
};
export default SetEditor;
