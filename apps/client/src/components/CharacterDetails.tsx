import React from "react";

type Props = {
  unit: {
    stamina: number;
    durability: number;
    force: number;
    skills: { name: string; text: string }[];
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

      {/* Skille */}
      <h4 className="skills-title">Skills</h4>
      <div className="skill-list">
        {unit.skills.map((skill, i) => (
          <div key={i} className="mb-3">
            <div className="skill-name">{skill.name}</div>
            <div className="skill-text">{skill.text}</div>
          </div>
        ))}
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