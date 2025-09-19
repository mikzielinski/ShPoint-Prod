// Star Wars: Shatterpoint Ability System
// Based on official icon reference sheet
// Icon mapping based on official reference and Unicode symbols
export const ABILITY_ICONS = {
    Active: "j", // j - Active (sp-active)
    Reactive: "i", // i - Reactive (sp-reactive)
    Innate: "l", // l - Innate (sp-innate)
    Tactic: "k", // k - Tactic (sp-tactic)
    Identity: "m" // m - Identity (sp-identity)
};
// Force cost mapping
export const DEFAULT_FORCE_COSTS = {
    Active: 1, // Active abilities always have Force cost
    Reactive: 1, // Reactive abilities always have Force cost
    Innate: 0, // Innate abilities never have Force cost
    Tactic: 0, // Tactic abilities never have Force cost (special Innate)
    Identity: 0 // Identity abilities never have Force cost (special Innate)
};
// Helper function to determine ability type from description
export function detectAbilityType(description) {
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
export function extractForceCost(description) {
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
export function requiresAction(description) {
    return description.toLowerCase().startsWith('action:');
}
// Helper function to extract trigger from description
export function extractTrigger(description, abilityType) {
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
