// Star Wars: Shatterpoint Ability System
// Based on official icon reference sheet

export type AbilityType = "Active" | "Reactive" | "Innate" | "Tactic" | "Identity";

export type AbilityTrigger = 
  | "activation_start"      // Tactic abilities
  | "after_combat_action"   // After combat action
  | "after_attack_targeting_unit" // After attack targeting this unit
  | "when_wounds_enemy"     // When wounds enemy unit
  | "when_attacked"         // When attacked
  | "on_activation"         // During activation
  | "always"                // Always active (Innate)
  | "custom";               // Custom trigger described in text

export interface Ability {
  id: string;                    // Unique identifier (e.g., "force-jump", "deflect")
  type: AbilityType;             // Active, Reactive, Innate, Tactic, Identity
  symbol: string;                // Game icon (↻, ↺, ☰, ⊕, ╏)
  name: string;                  // Ability name
  description: string;           // Rules text
  forceCost?: number;            // Force cost (0 for Innate abilities)
  trigger?: AbilityTrigger;      // When this ability can be used
  isAction?: boolean;            // True if ability text begins with "Action:"
  tags?: string[];               // Tags for filtering (e.g., ["Force", "Combat"])
}

// Icon mapping based on official reference and Unicode symbols
export const ABILITY_ICONS: Record<AbilityType, string> = {
  Active: "j",      // j - Active (sp-active)
  Reactive: "i",    // i - Reactive (sp-reactive)
  Innate: "l",      // l - Innate (sp-innate)
  Tactic: "k",      // k - Tactic (sp-tactic)
  Identity: "m"     // m - Identity (sp-identity)
};

// Force cost mapping
export const DEFAULT_FORCE_COSTS: Record<AbilityType, number> = {
  Active: 1,        // Active abilities always have Force cost
  Reactive: 1,      // Reactive abilities always have Force cost
  Innate: 0,        // Innate abilities never have Force cost
  Tactic: 0,        // Tactic abilities never have Force cost (special Innate)
  Identity: 0       // Identity abilities never have Force cost (special Innate)
};

// Helper function to determine ability type from description
export function detectAbilityType(description: string): AbilityType {
  const desc = description.toLowerCase();
  
  // Check for Tactic keywords
  if (desc.includes('tactic') || desc.includes('allied') || desc.includes('allies')) {
    return 'Tactic';
  }
  
  // Check for Identity keywords (Primary Unit specific)
  if (desc.includes('identity') || desc.includes('unique to primary')) {
    return 'Identity';
  }
  
  // Check for Reactive keywords
  if (desc.includes('after') || desc.includes('when attacked') || desc.includes('in response to')) {
    return 'Reactive';
  }
  
  // Check for Action keywords (Active)
  if (desc.includes('action:') || desc.includes('may use this ability')) {
    return 'Active';
  }
  
  // Default to Innate for always-active abilities
  return 'Innate';
}

// Helper function to extract Force cost from description
export function extractForceCost(description: string): number {
  // Look for Force symbols (✨) or explicit Force mentions
  const forceMatches = description.match(/(\d+)\s*force|force\s*(\d+)|✨\s*(\d+)|(\d+)\s*✨/gi);
  if (forceMatches) {
    const match = forceMatches[0];
    const number = match.match(/\d+/);
    return number ? parseInt(number[0]) : 0;
  }
  
  // Default Force cost based on ability type
  return 0;
}

// Helper function to determine if ability requires an action
export function requiresAction(description: string): boolean {
  return description.toLowerCase().startsWith('action:');
}

// Helper function to extract trigger from description
export function extractTrigger(description: string, abilityType: AbilityType): AbilityTrigger {
  const desc = description.toLowerCase();
  
  if (abilityType === 'Tactic') {
    return 'activation_start';
  }
  
  if (abilityType === 'Innate' || abilityType === 'Identity') {
    return 'always';
  }
  
  if (desc.includes('after this unit makes a combat action')) {
    return 'after_combat_action';
  }
  
  if (desc.includes('after a') && desc.includes('attack') && desc.includes('targeting')) {
    return 'after_attack_targeting_unit';
  }
  
  if (desc.includes('when') && desc.includes('wounds')) {
    return 'when_wounds_enemy';
  }
  
  if (desc.includes('when attacked') || desc.includes('when a') && desc.includes('attack')) {
    return 'when_attacked';
  }
  
  if (desc.includes('during') && desc.includes('activation')) {
    return 'on_activation';
  }
  
  return 'custom';
}
