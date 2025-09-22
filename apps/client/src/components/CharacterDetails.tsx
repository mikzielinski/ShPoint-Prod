import React, { useState, useEffect } from "react";
import { Ability } from "../lib/shpoint/abilities/types";
import { AbilityCard } from "./AbilityCard";

type Props = {
  characterId: string;
};

type CharacterData = {
  id: string;
  name: string;
  stamina: number;
  durability: number;
  force: number;
  abilities?: Ability[];
  legacyAbilities?: any[];
  tags?: string[];
  skills?: { name: string; text: string }[];
};

export default function CharacterDetails({ characterId }: Props) {
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCharacter = async () => {
      try {
        const response = await fetch(`/api/characters/${characterId}`);
        if (response.ok) {
          const data = await response.json();
          setCharacter(data.character);
        }
      } catch (error) {
        console.error('Error loading character:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCharacter();
  }, [characterId]);

  if (loading) {
    return (
      <div style={{
        background: '#374151',
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center',
        color: '#9ca3af'
      }}>
        Loading character details...
      </div>
    );
  }

  if (!character) {
    return (
      <div style={{
        background: '#374151',
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center',
        color: '#ef4444'
      }}>
        Failed to load character details
      </div>
    );
  }
  return (
    <div>
      {/* Character Name */}
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#f9fafb',
        margin: '0 0 16px 0',
        textAlign: 'center'
      }}>
        {character.name}
      </h3>


      {/* Statystyki */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          background: '#374151',
          borderRadius: '6px',
          padding: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Stamina</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#f9fafb' }}>{character.stamina}</div>
        </div>
        <div style={{
          background: '#374151',
          borderRadius: '6px',
          padding: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Durability</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#f9fafb' }}>{character.durability}</div>
        </div>
        <div style={{
          background: '#374151',
          borderRadius: '6px',
          padding: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Force</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#f9fafb' }}>{character.force}</div>
        </div>
      </div>

      {/* Umiejętności */}
      <h4 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#f9fafb',
        margin: '0 0 12px 0'
      }}>
        Abilities
      </h4>
      <div>
        {/* Structured abilities with icons */}
        {character.abilities && character.abilities.length > 0 ? (
          character.abilities.map((ability, i) => (
            <AbilityCard 
              key={`ability-${i}`}
              ability={ability} 
              size="sm"
              showForceCost={true}
              showTrigger={false}
              className="mb-3"
            />
          ))
        ) : character.skills && character.skills.length > 0 ? (
          /* Legacy abilities fallback */
          character.skills.map((skill, i) => (
            <div key={`legacy-${i}`} style={{
              marginBottom: '12px',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              padding: '12px',
              background: '#374151'
            }}>
              <div style={{ color: '#f9fafb', fontWeight: '600', marginBottom: '4px' }}>{skill.name}</div>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>{skill.text}</div>
            </div>
          ))
        ) : (
          <div style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>
            No abilities available
          </div>
        )}
      </div>

      {/* Tagi */}
      {character.tags && character.tags.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {character.tags.map((t, i) => (
            <span
              key={i}
              style={{
                background: '#4b5563',
                color: '#f9fafb',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}