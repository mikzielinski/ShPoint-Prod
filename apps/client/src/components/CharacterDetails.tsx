import React from "react";
import { Ability } from "../lib/shpoint/abilities/types";
import { AbilityCard } from "./AbilityCard";

type Props = {
  unit: {
    stamina: number;
    durability: number;
    force: number;
    skills: { name: string; text: string }[];
    abilities?: Ability[]; // New structured abilities
    legacyAbilities?: any[]; // Legacy abilities for backward compatibility
    tags: string[];
  };
};

export default function CharacterDetails({ unit }: Props) {
  return (
    <div>
      {/* Statystyki */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="stat">
          <span className="stat-label">Stamina</span>
          <span className="stat-value">{unit.stamina}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Durability</span>
          <span className="stat-value">{unit.durability}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Force</span>
          <span className="stat-value">{unit.force}</span>
        </div>
      </div>

      {/* Umiejętności */}
      <h4 className="skills-title">Abilities</h4>
      <div className="skill-list">
        {/* Structured abilities with icons */}
        {unit.abilities && unit.abilities.length > 0 ? (
          unit.abilities.map((ability, i) => (
            <AbilityCard 
              key={`ability-${i}`}
              ability={ability} 
              size="sm"
              showForceCost={true}
              showTrigger={false}
              className="mb-3"
            />
          ))
        ) : (
          /* Legacy abilities fallback */
          unit.skills.map((skill, i) => (
            <div key={`legacy-${i}`} className="mb-3 border border-gray-600 rounded-lg p-3 bg-gray-800">
              <div className="skill-name text-white font-semibold mb-1">{skill.name}</div>
              <div className="skill-text text-gray-300 text-sm">{skill.text}</div>
            </div>
          ))
        )}
      </div>

      {/* Tagi */}
      <div className="mt-4 flex flex-wrap gap-2">
        {unit.tags.map((t, i) => (
          <span
            key={i}
            className="badge"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}