import React, { useState, useEffect } from 'react';
import { Set as SetType } from '../../data/sets';
import charactersData from '../../data/characters.json';

interface SetEditorProps {
  set?: SetType | null;
  onSave: (set: SetType) => void;
  onCancel: () => void;
  onPreview?: (set: SetType) => void;
}

const SetEditor: React.FC<SetEditorProps> = ({ set, onSave, onCancel, onPreview }) => {
  const [formData, setFormData] = useState<SetType>({
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
    } else {
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

  const handleInputChange = (field: keyof SetType, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCharacter = () => {
    if (newCharacterName.trim()) {
      // Find character in data to get their role
      const characterData = (charactersData as any[]).find(char => 
        char.name.toLowerCase().trim() === newCharacterName.toLowerCase().trim()
      );
      
      const role = characterData ? 
        (characterData.unit_type === 'Primary' ? 'Primary' as const :
         characterData.unit_type === 'Secondary' ? 'Secondary' as const : 'Supporting' as const) :
        'Primary' as const; // Default fallback
      
      setFormData(prev => ({
        ...prev,
        characters: [...(prev.characters || []), { name: newCharacterName.trim(), role }]
      }));
      setNewCharacterName('');
    }
  };

  const handleRemoveCharacter = (index: number) => {
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
    const matchingCharacters = (charactersData as any[]).filter((char: any) => 
      char.set_code === formData.code
    );

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
        role: char.unit_type === 'Primary' ? 'Primary' as const :
              char.unit_type === 'Secondary' ? 'Secondary' as const : 'Supporting' as const
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
    } else {
      alert(`Added ${newCharacters.length} characters from set ${formData.code}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate ID if not provided
    const finalSet = {
      ...formData,
      id: formData.id || formData.code.toLowerCase()
    };
    
    onSave(finalSet);
  };

  const setTypes = ['Core Set', 'Squad Pack', 'Terrain Pack', 'Duel Pack', 'Mission Pack'];

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '20px',
      background: '#1f2937',
      borderRadius: '12px',
      border: '1px solid #374151'
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Basic Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '600', color: '#f3f4f6' }}>Set Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f3f4f6',
              fontSize: '14px'
            }}
            placeholder="e.g., Star Wars: Shatterpoint Core Set"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label style={{ fontWeight: '600', color: '#f3f4f6' }}>Set Code *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                required
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  background: '#1f2937',
                  color: '#f3f4f6',
                  fontSize: '14px',
                  flex: 1
                }}
                placeholder="e.g., SWP01"
              />
              <button
                type="button"
                onClick={handleFindCharacters}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Find Characters
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label style={{ fontWeight: '600', color: '#f3f4f6' }}>Type *</label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              required
              style={{
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
              }}
            >
              {setTypes.map(type => (
                <option key={type} value={type} style={{ background: '#1f2937', color: '#f3f4f6' }}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '600', color: '#f3f4f6' }}>Image URL</label>
          <input
            type="url"
            value={formData.image || ''}
            onChange={(e) => handleInputChange('image', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f3f4f6',
              fontSize: '14px'
            }}
            placeholder="https://example.com/set-image.jpg"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '600', color: '#f3f4f6' }}>Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f3f4f6',
              fontSize: '14px',
              resize: 'vertical'
            }}
            placeholder="Brief description of the set..."
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '600', color: '#f3f4f6' }}>Product URL</label>
          <input
            type="url"
            value={formData.product_url || ''}
            onChange={(e) => handleInputChange('product_url', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f3f4f6',
              fontSize: '14px'
            }}
            placeholder="https://www.atomicmassgames.com/..."
          />
        </div>

        {/* Characters Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontWeight: '600', color: '#f3f4f6' }}>Characters in Set</label>
          
          {/* Add Character Form */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#9ca3af' }}>Character Name</label>
              <input
                type="text"
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #374151',
                  background: '#1f2937',
                  color: '#f3f4f6',
                  fontSize: '12px'
                }}
                placeholder="Character name (role will be auto-detected)"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCharacter}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                background: '#10b981',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>

          {/* Characters List */}
          {formData.characters && formData.characters.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {formData.characters.map((char, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#374151',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '2px 6px', 
                      borderRadius: '3px', 
                      background: char.role === 'Primary' ? '#dc2626' : char.role === 'Secondary' ? '#d97706' : '#059669',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {char.role}
                    </span>
                    <span style={{ color: '#f3f4f6' }}>{char.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCharacter(index)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: 'none',
                      background: '#dc2626',
                      color: 'white',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #374151',
              background: 'transparent',
              color: '#9ca3af',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          {onPreview && formData.name && formData.code && (
            <button
              type="button"
              onClick={() => onPreview(formData)}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid #10b981',
                background: 'transparent',
                color: '#10b981',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Preview
            </button>
          )}
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {set ? 'Update Set' : 'Create Set'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetEditor;
