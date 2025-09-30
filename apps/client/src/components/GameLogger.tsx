import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';
import { useAuth } from '../auth/AuthContext';

interface Character {
  id: string;
  name: string;
  portraitUrl?: string;
}

interface GameLoggerProps {
  gameSessionId: string;
  onClose?: () => void;
}

export default function GameLogger({ gameSessionId, onClose }: GameLoggerProps) {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  
  const [activeTab, setActiveTab] = useState<'dice' | 'nodes'>('dice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dice roll form
  const [diceForm, setDiceForm] = useState({
    characterId: '',
    diceType: 'ATTACK',
    diceCount: 1,
    diceResults: [] as string[],
    action: '',
    targetCharacterId: '',
    finalResult: ''
  });
  
  // Node activation form
  const [nodeForm, setNodeForm] = useState({
    characterId: '',
    nodePath: '',
    nodeName: '',
    nodeEffects: '',
    activationType: 'MANUAL',
    triggerAction: '',
    targetCharacterId: '',
    damageDealt: '',
    conditionsApplied: [] as string[]
  });
  
  // Available characters
  const [characters, setCharacters] = useState<Character[]>([]);

  const loadCharacters = async () => {
    if (!me) return;

    try {
      // This would need to be implemented to get characters from the game session
      // For now, we'll use a placeholder
      setCharacters([]);
    } catch (err) {
      console.error('Failed to load characters:', err);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, [me, gameSessionId]);

  const handleDiceRollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!me) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${api}/api/v2/dice-rolls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${me.token}`
        },
        body: JSON.stringify({
          gameSessionId,
          ...diceForm,
          diceResults: diceForm.diceResults.filter(result => result.trim() !== '')
        })
      });

      const data = await response.json();

      if (data.ok) {
        setSuccess('Dice roll logged successfully!');
        setDiceForm({
          characterId: '',
          diceType: 'ATTACK',
          diceCount: 1,
          diceResults: [],
          action: '',
          targetCharacterId: '',
          finalResult: ''
        });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to log dice roll');
      }
    } catch (err) {
      setError('Failed to log dice roll');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!me) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${api}/api/v2/node-activations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${me.token}`
        },
        body: JSON.stringify({
          gameSessionId,
          ...nodeForm,
          nodeEffects: JSON.parse(nodeForm.nodeEffects || '{}'),
          damageDealt: nodeForm.damageDealt ? parseInt(nodeForm.damageDealt) : null
        })
      });

      const data = await response.json();

      if (data.ok) {
        setSuccess('Node activation logged successfully!');
        setNodeForm({
          characterId: '',
          nodePath: '',
          nodeName: '',
          nodeEffects: '',
          activationType: 'MANUAL',
          triggerAction: '',
          targetCharacterId: '',
          damageDealt: '',
          conditionsApplied: []
        });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to log node activation');
      }
    } catch (err) {
      setError('Failed to log node activation');
    } finally {
      setLoading(false);
    }
  };

  const addDiceResult = () => {
    setDiceForm(prev => ({
      ...prev,
      diceResults: [...prev.diceResults, '']
    }));
  };

  const updateDiceResult = (index: number, value: string) => {
    setDiceForm(prev => ({
      ...prev,
      diceResults: prev.diceResults.map((result, i) => i === index ? value : result)
    }));
  };

  const removeDiceResult = (index: number) => {
    setDiceForm(prev => ({
      ...prev,
      diceResults: prev.diceResults.filter((_, i) => i !== index)
    }));
  };

  const addCondition = () => {
    setNodeForm(prev => ({
      ...prev,
      conditionsApplied: [...prev.conditionsApplied, '']
    }));
  };

  const updateCondition = (index: number, value: string) => {
    setNodeForm(prev => ({
      ...prev,
      conditionsApplied: prev.conditionsApplied.map((condition, i) => i === index ? value : condition)
    }));
  };

  const removeCondition = (index: number) => {
    setNodeForm(prev => ({
      ...prev,
      conditionsApplied: prev.conditionsApplied.filter((_, i) => i !== index)
    }));
  };

  if (!me) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Please log in to use the game logger.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Game Logger</h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('dice')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'dice' ? '#007bff' : '#e9ecef',
            color: activeTab === 'dice' ? 'white' : '#495057',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🎲 Dice Rolls
        </button>
        <button
          onClick={() => setActiveTab('nodes')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'nodes' ? '#007bff' : '#e9ecef',
            color: activeTab === 'nodes' ? 'white' : '#495057',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🎯 Node Activations
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {success}
        </div>
      )}

      {/* Dice Roll Form */}
      {activeTab === 'dice' && (
        <form onSubmit={handleDiceRollSubmit}>
          <h3 style={{ marginBottom: '16px' }}>Log Dice Roll</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Character *
              </label>
              <select
                value={diceForm.characterId}
                onChange={(e) => setDiceForm(prev => ({ ...prev, characterId: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select Character</option>
                {characters.map(char => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Dice Type *
              </label>
              <select
                value={diceForm.diceType}
                onChange={(e) => setDiceForm(prev => ({ ...prev, diceType: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="ATTACK">Attack</option>
                <option value="DEFENSE">Defense</option>
                <option value="EXPERTISE">Expertise</option>
                <option value="FORCE">Force</option>
                <option value="DAMAGE">Damage</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Number of Dice *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={diceForm.diceCount}
                onChange={(e) => setDiceForm(prev => ({ ...prev, diceCount: parseInt(e.target.value) || 1 }))}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Action
              </label>
              <input
                type="text"
                value={diceForm.action}
                onChange={(e) => setDiceForm(prev => ({ ...prev, action: e.target.value }))}
                placeholder="e.g., Melee Attack, Force Push"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Dice Results *
            </label>
            {diceForm.diceResults.map((result, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select
                  value={result}
                  onChange={(e) => updateDiceResult(index, e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Select Result</option>
                  <option value="HIT">Hit</option>
                  <option value="CRIT">Critical</option>
                  <option value="BLOCK">Block</option>
                  <option value="EVADE">Evade</option>
                  <option value="EXPERTISE_SUCCESS">Expertise Success</option>
                  <option value="EXPERTISE_FAIL">Expertise Fail</option>
                  <option value="FORCE_SUCCESS">Force Success</option>
                  <option value="FORCE_FAIL">Force Fail</option>
                  <option value="DAMAGE_SUCCESS">Damage Success</option>
                  <option value="DAMAGE_FAIL">Damage Fail</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeDiceResult(index)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addDiceResult}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Dice Result
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Target Character
              </label>
              <select
                value={diceForm.targetCharacterId}
                onChange={(e) => setDiceForm(prev => ({ ...prev, targetCharacterId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select Target (Optional)</option>
                {characters.map(char => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Final Result
              </label>
              <input
                type="text"
                value={diceForm.finalResult}
                onChange={(e) => setDiceForm(prev => ({ ...prev, finalResult: e.target.value }))}
                placeholder="e.g., 3 Hits, 1 Critical"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Logging...' : 'Log Dice Roll'}
          </button>
        </form>
      )}

      {/* Node Activation Form */}
      {activeTab === 'nodes' && (
        <form onSubmit={handleNodeActivationSubmit}>
          <h3 style={{ marginBottom: '16px' }}>Log Node Activation</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Character *
              </label>
              <select
                value={nodeForm.characterId}
                onChange={(e) => setNodeForm(prev => ({ ...prev, characterId: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select Character</option>
                {characters.map(char => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Activation Type *
              </label>
              <select
                value={nodeForm.activationType}
                onChange={(e) => setNodeForm(prev => ({ ...prev, activationType: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATIC">Automatic</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Node Path *
              </label>
              <input
                type="text"
                value={nodeForm.nodePath}
                onChange={(e) => setNodeForm(prev => ({ ...prev, nodePath: e.target.value }))}
                placeholder="e.g., 0.1.2"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Node Name *
              </label>
              <input
                type="text"
                value={nodeForm.nodeName}
                onChange={(e) => setNodeForm(prev => ({ ...prev, nodeName: e.target.value }))}
                placeholder="e.g., Melee Attack"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Node Effects (JSON) *
            </label>
            <textarea
              value={nodeForm.nodeEffects}
              onChange={(e) => setNodeForm(prev => ({ ...prev, nodeEffects: e.target.value }))}
              placeholder='{"damage": 2, "range": "melee"}'
              required
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Trigger Action
              </label>
              <input
                type="text"
                value={nodeForm.triggerAction}
                onChange={(e) => setNodeForm(prev => ({ ...prev, triggerAction: e.target.value }))}
                placeholder="e.g., Attack Action"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Target Character
              </label>
              <select
                value={nodeForm.targetCharacterId}
                onChange={(e) => setNodeForm(prev => ({ ...prev, targetCharacterId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select Target (Optional)</option>
                {characters.map(char => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Damage Dealt
            </label>
            <input
              type="number"
              min="0"
              value={nodeForm.damageDealt}
              onChange={(e) => setNodeForm(prev => ({ ...prev, damageDealt: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Conditions Applied
            </label>
            {nodeForm.conditionsApplied.map((condition, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select
                  value={condition}
                  onChange={(e) => updateCondition(index, e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Select Condition</option>
                  <option value="STRAIN">Strain</option>
                  <option value="PINNED">Pinned</option>
                  <option value="EXPOSE">Expose</option>
                  <option value="DISARM">Disarm</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCondition}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Condition
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Logging...' : 'Log Node Activation'}
          </button>
        </form>
      )}
    </div>
  );
}
