import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';

interface Ability {
  id: string;
  type: 'Active' | 'Reactive' | 'Innate' | 'Tactic' | 'Identity';
  symbol: string;
  name: string;
  description: string;
  forceCost: number;
  trigger: string;
  isAction: boolean;
  tags: string[];
}

interface Character {
  id: string;
  name: string;
  portrait?: string;
  squad_points: number;
  force: number;
  unit_type: 'Primary' | 'Secondary' | 'Support';
  stamina: number;
  durability: number;
  factions: string[];
  period: string[];
  abilities: any[];
  structuredAbilities: Ability[];
}

interface CharacterEditorProps {
  character?: Character | null;
  onSave: (character: Character) => void;
  onCancel: () => void;
  onDelete?: (characterId: string) => void;
}

export const CharacterEditor: React.FC<CharacterEditorProps> = ({
  character,
  onSave,
  onCancel,
  onDelete
}) => {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  const [formData, setFormData] = useState<Character>({
    id: '',
    name: '',
    portrait: '',
    squad_points: 0,
    force: 0,
    unit_type: 'Primary',
    stamina: 0,
    durability: 0,
    factions: [],
    period: [],
    abilities: [],
    structuredAbilities: []
  });

  const [newAbility, setNewAbility] = useState<Ability>({
    id: '',
    type: 'Active',
    symbol: 'j',
    name: '',
    description: '',
    forceCost: 0,
    trigger: 'on_activation',
    isAction: false,
    tags: []
  });

  const [newFaction, setNewFaction] = useState('');
  const [newPeriod, setNewPeriod] = useState('');

  useEffect(() => {
    if (character) {
      setFormData(character);
    }
  }, [character]);

  const handleInputChange = (field: keyof Character, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAbilityChange = (field: keyof Ability, value: any) => {
    setNewAbility(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addAbility = () => {
    if (newAbility.name.trim()) {
      const ability: Ability = {
        ...newAbility,
        id: newAbility.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()
      };
      
      setFormData(prev => ({
        ...prev,
        structuredAbilities: [...prev.structuredAbilities, ability]
      }));
      
      setNewAbility({
        id: '',
        type: 'Active',
        symbol: 'j',
        name: '',
        description: '',
        forceCost: 0,
        trigger: 'on_activation',
        isAction: false,
        tags: []
      });
    }
  };

  const removeAbility = (abilityId: string) => {
    setFormData(prev => ({
      ...prev,
      structuredAbilities: prev.structuredAbilities.filter(a => a.id !== abilityId)
    }));
  };

  const addFaction = () => {
    if (newFaction.trim() && !formData.factions.includes(newFaction.trim())) {
      setFormData(prev => ({
        ...prev,
        factions: [...prev.factions, newFaction.trim()]
      }));
      setNewFaction('');
    }
  };

  const removeFaction = (faction: string) => {
    setFormData(prev => ({
      ...prev,
      factions: prev.factions.filter(f => f !== faction)
    }));
  };

  const addPeriod = () => {
    if (newPeriod.trim() && !formData.period.includes(newPeriod.trim())) {
      setFormData(prev => ({
        ...prev,
        period: [...prev.period, newPeriod.trim()]
      }));
      setNewPeriod('');
    }
  };

  const removePeriod = (period: string) => {
    setFormData(prev => ({
      ...prev,
      period: prev.period.filter(p => p !== period)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Nazwa postaci jest wymagana');
      return;
    }
    onSave(formData);
  };

  const handleDelete = () => {
    if (character && onDelete && window.confirm('Czy na pewno chcesz usunąć tę postać?')) {
      onDelete(character.id);
    }
  };

  // Kontrola dostępu
  if (!me || (me.role !== 'ADMIN' && me.role !== 'EDITOR')) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Nie masz uprawnień do edycji postaci</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white">
      <h2 className="text-2xl font-bold mb-6">
        {character ? 'Edytuj postać' : 'Dodaj nową postać'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Podstawowe informacje */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Podstawowe informacje</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">ID</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
              placeholder="np. ahsoka-tano-fulcrum"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nazwa</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
              placeholder="np. Ahsoka Tano Fulcrum"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">URL portretu</label>
            <input
              type="url"
              value={formData.portrait || ''}
              onChange={(e) => handleInputChange('portrait', e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Typ jednostki</label>
            <select
              value={formData.unit_type}
              onChange={(e) => handleInputChange('unit_type', e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
            >
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
              <option value="Support">Support</option>
            </select>
          </div>
        </div>

        {/* Statystyki */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Statystyki</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">Punkty drużyny</label>
            <input
              type="number"
              value={formData.squad_points}
              onChange={(e) => handleInputChange('squad_points', parseInt(e.target.value) || 0)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Force</label>
            <input
              type="number"
              value={formData.force}
              onChange={(e) => handleInputChange('force', parseInt(e.target.value) || 0)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stamina</label>
            <input
              type="number"
              value={formData.stamina}
              onChange={(e) => handleInputChange('stamina', parseInt(e.target.value) || 0)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Durability</label>
            <input
              type="number"
              value={formData.durability}
              onChange={(e) => handleInputChange('durability', parseInt(e.target.value) || 0)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Frakcje */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Frakcje</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newFaction}
            onChange={(e) => setNewFaction(e.target.value)}
            className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded"
            placeholder="Dodaj frakcję"
            onKeyPress={(e) => e.key === 'Enter' && addFaction()}
          />
          <button
            onClick={addFaction}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Dodaj
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.factions.map((faction, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-600 rounded-full text-sm flex items-center gap-2"
            >
              {faction}
              <button
                onClick={() => removeFaction(faction)}
                className="text-blue-200 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Okresy */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Okresy</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPeriod}
            onChange={(e) => setNewPeriod(e.target.value)}
            className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded"
            placeholder="Dodaj okres"
            onKeyPress={(e) => e.key === 'Enter' && addPeriod()}
          />
          <button
            onClick={addPeriod}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            Dodaj
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.period.map((period, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-green-600 rounded-full text-sm flex items-center gap-2"
            >
              {period}
              <button
                onClick={() => removePeriod(period)}
                className="text-green-200 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Umiejętności */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Umiejętności</h3>
        
        {/* Dodawanie nowej umiejętności */}
        <div className="bg-gray-800 p-4 rounded mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Typ</label>
              <select
                value={newAbility.type}
                onChange={(e) => handleAbilityChange('type', e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
              >
                <option value="Active">Active</option>
                <option value="Reactive">Reactive</option>
                <option value="Innate">Innate</option>
                <option value="Tactic">Tactic</option>
                <option value="Identity">Identity</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nazwa</label>
              <input
                type="text"
                value={newAbility.name}
                onChange={(e) => handleAbilityChange('name', e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                placeholder="Nazwa umiejętności"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Koszt Force</label>
              <input
                type="number"
                value={newAbility.forceCost}
                onChange={(e) => handleAbilityChange('forceCost', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Trigger</label>
              <input
                type="text"
                value={newAbility.trigger}
                onChange={(e) => handleAbilityChange('trigger', e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                placeholder="np. on_activation"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Opis</label>
            <textarea
              value={newAbility.description}
              onChange={(e) => handleAbilityChange('description', e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
              rows={3}
              placeholder="Opis umiejętności"
            />
          </div>

          <button
            onClick={addAbility}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Dodaj umiejętność
          </button>
        </div>

        {/* Lista umiejętności */}
        <div className="space-y-2">
          {formData.structuredAbilities.map((ability) => (
            <div key={ability.id} className="bg-gray-800 p-3 rounded flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">[{ability.type}]</span>
                  <span className="font-semibold">{ability.name}</span>
                  {ability.forceCost > 0 && (
                    <span className="text-yellow-400">Force: {ability.forceCost}</span>
                  )}
                </div>
                <p className="text-gray-300 text-sm mt-1">{ability.description}</p>
              </div>
              <button
                onClick={() => removeAbility(ability.id)}
                className="text-red-400 hover:text-red-300 px-2"
              >
                Usuń
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Przyciski akcji */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded"
        >
          {character ? 'Zapisz zmiany' : 'Dodaj postać'}
        </button>
        
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded"
        >
          Anuluj
        </button>

        {character && onDelete && (
          <button
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Usuń postać
          </button>
        )}
      </div>
    </div>
  );
};

export default CharacterEditor;
