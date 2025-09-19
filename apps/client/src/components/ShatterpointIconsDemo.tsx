import React from 'react';
import { AbilityIcon } from './AbilityIcon';
import { AbilityType } from '../lib/shpoint/abilities/types';

export const ShatterpointIconsDemo: React.FC = () => {
  const abilityTypes: AbilityType[] = ['Active', 'Reactive', 'Innate', 'Tactic', 'Identity'];
  
  const gameIcons = [
    { name: 'Damage', class: 'sp-damage', description: 'q - Damage' },
    { name: 'Heal', class: 'sp-heal', description: 'r - Heal' },
    { name: 'Shove', class: 'sp-shove', description: 'p - Shove' },
    { name: 'Force', class: 'sp-force', description: 'v - Force' },
    { name: 'Critical', class: 'sp-critical', description: 'b - Critical' },
    { name: 'Block', class: 'sp-block', description: 'e - Block' },
    { name: 'Strike', class: 'sp-strike', description: 'a - Strike' },
    { name: 'Failure', class: 'sp-failure', description: 'd - Failure' },
    { name: 'Attack Expertise', class: 'sp-attack-expertise', description: 'c - Attack expertise' },
    { name: 'Defense Expertise', class: 'sp-defense-expertise', description: 'f - Defense expertise' },
    { name: 'Dash', class: 'sp-dash', description: 'h - Dash' },
    { name: 'Jump', class: 'sp-jump', description: 't - Jump' },
    { name: 'Climb', class: 'sp-climb', description: 'u - Climb' },
    { name: 'Reposition', class: 'sp-reposition', description: 's - Reposition' },
    { name: 'Melee', class: 'sp-melee', description: 'o - Melee' },
    { name: 'Ranged', class: 'sp-ranged', description: 'n - Ranged' },
    { name: 'Unit', class: 'sp-unit', description: '8 - Unit' },
    { name: 'Durability', class: 'sp-durability', description: 'w - Durability' },
    { name: 'Pinned', class: 'sp-pinned', description: '1 - Pinned' },
    { name: 'Hunker', class: 'sp-hunker', description: '3 - Hunker' },
    { name: 'Exposed', class: 'sp-exposed', description: '4 - Exposed' },
    { name: 'Strained', class: 'sp-strained', description: '5 - Strained' },
    { name: 'Disarm', class: 'sp-disarm', description: '9 - Disarm' }
  ];

  return (
    <div className="p-6 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6">Star Wars: Shatterpoint Icons</h1>
      
      {/* Ability Type Icons */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Ability Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {abilityTypes.map((type) => (
            <div key={type} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <AbilityIcon type={type} size="lg" />
              <div>
                <div className="font-medium">{type}</div>
                <div className="text-sm text-gray-400">
                  {type === 'Active' && 'j - Active'}
                  {type === 'Reactive' && 'i - Reactive'}
                  {type === 'Innate' && 'l - Innate'}
                  {type === 'Tactic' && 'k - Tactic'}
                  {type === 'Identity' && 'm - Identity'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Game Effect Icons */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Game Effects</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {gameIcons.map((icon) => (
            <div key={icon.class} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
              <span className={`sp-icon ${icon.class} sp-icon-md`}></span>
              <div className="text-sm">
                <div className="font-medium">{icon.name}</div>
                <div className="text-xs text-gray-400">{icon.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Size Examples */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Icon Sizes</h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="sp-icon sp-active sp-icon-sm"></span>
            <span className="text-sm">Small (sm)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="sp-icon sp-active sp-icon-md"></span>
            <span className="text-sm">Medium (md)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="sp-icon sp-active sp-icon-lg"></span>
            <span className="text-sm">Large (lg)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="sp-icon sp-active sp-icon-xl"></span>
            <span className="text-sm">Extra Large (xl)</span>
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <pre className="text-sm text-gray-300">
{`// React Component
<AbilityIcon type="Active" size="md" />

// CSS Classes
<span className="sp-icon sp-active sp-icon-lg"></span>
<span className="sp-icon sp-damage sp-icon-md"></span>
<span className="sp-icon sp-force sp-icon-sm"></span>`}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default ShatterpointIconsDemo;
