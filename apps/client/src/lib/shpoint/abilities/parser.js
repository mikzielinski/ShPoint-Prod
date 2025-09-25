import { detectAbilityType, extractForceCost, requiresAction, extractTrigger, ABILITY_ICONS, DEFAULT_FORCE_COSTS } from './types';
/**
 * Split long ability text into individual abilities
 * Uses common patterns to separate abilities
 */
export function splitAbilities(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }
    // Common ability separators
    const separators = [
        /\s+(?=[A-Z][a-z]+ [A-Z])/g, // Capital words (ability names)
        /\s+(?=Primary Unit)/g, // Primary Unit abilities
        /\s+(?=Secondary Unit)/g, // Secondary Unit abilities
        /\s+(?=Support Unit)/g, // Support Unit abilities
        /\s+(?=Galactic Republic)/g, // Faction abilities
        /\s+(?=Steadfast)/g, // Common ability names
        /\s+(?=Sharpshooter)/g, // Common ability names
        /\s+(?=Coordinated Fire)/g, // Common ability names
    ];
    let abilities = [text];
    // Try each separator
    for (const separator of separators) {
        const newAbilities = [];
        for (const ability of abilities) {
            const parts = ability.split(separator);
            if (parts.length > 1) {
                newAbilities.push(...parts);
            }
            else {
                newAbilities.push(ability);
            }
        }
        abilities = newAbilities;
    }
    // Clean up and filter empty abilities
    return abilities
        .map(ability => ability.trim())
        .filter(ability => ability.length > 10) // Filter out very short fragments
        .filter(ability => !ability.match(/^\s*[.,;]\s*$/)); // Filter out punctuation only
}
/**
 * Extract ability name from text
 */
function extractAbilityName(text) {
    // Look for common ability name patterns
    const patterns = [
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/, // Capitalized words at start
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*:/, // Name followed by colon
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\[/, // Name followed by bracket
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    // Fallback: use first few words
    const words = text.split(/\s+/).slice(0, 3);
    return words.join(' ').replace(/[.,:;]/g, '').trim();
}
/**
 * Generate unique ID for ability
 */
function generateAbilityId(name, index) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '') + `-${index}`;
}
/**
 * Parse a single ability text into Ability object
 */
export function parseAbility(text, index = 0) {
    const cleanText = text.trim();
    // Extract name
    const name = extractAbilityName(cleanText);
    // Generate ID
    const id = generateAbilityId(name, index);
    // Detect ability type
    const type = detectAbilityType(cleanText);
    // Get symbol
    const symbol = ABILITY_ICONS[type];
    // Extract Force cost
    const forceCost = extractForceCost(cleanText) || DEFAULT_FORCE_COSTS[type];
    // Check if requires action
    const isAction = requiresAction(cleanText);
    // Extract trigger
    const trigger = extractTrigger(cleanText, type);
    // Extract tags (basic implementation)
    const tags = [];
    if (cleanText.toLowerCase().includes('force'))
        tags.push('Force');
    if (cleanText.toLowerCase().includes('combat'))
        tags.push('Combat');
    if (cleanText.toLowerCase().includes('movement'))
        tags.push('Movement');
    if (cleanText.toLowerCase().includes('attack'))
        tags.push('Attack');
    if (cleanText.toLowerCase().includes('defense'))
        tags.push('Defense');
    return {
        id,
        type,
        symbol,
        name,
        description: cleanText,
        forceCost,
        trigger,
        isAction,
        tags: tags.length > 0 ? tags : undefined
    };
}
/**
 * Parse legacy abilities array into structured abilities
 */
export function parseLegacyAbilities(abilities) {
    const result = [];
    for (let i = 0; i < abilities.length; i++) {
        const legacy = abilities[i];
        // Get text from various possible fields
        const text = legacy.text || legacy.description || legacy.title || legacy.name || '';
        if (!text)
            continue;
        // Split text into individual abilities
        const abilityTexts = splitAbilities(text);
        // Parse each ability
        for (let j = 0; j < abilityTexts.length; j++) {
            const ability = parseAbility(abilityTexts[j], result.length);
            result.push(ability);
        }
    }
    return result;
}
/**
 * Parse single ability text block into multiple structured abilities
 */
export function parseAbilityText(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }
    const abilityTexts = splitAbilities(text);
    const result = [];
    for (let i = 0; i < abilityTexts.length; i++) {
        const ability = parseAbility(abilityTexts[i], i);
        result.push(ability);
    }
    return result;
}
/**
 * Validate parsed abilities
 */
export function validateAbilities(abilities) {
    const valid = [];
    const errors = [];
    for (const ability of abilities) {
        const errors_for_ability = [];
        if (!ability.id) {
            errors_for_ability.push('Missing ID');
        }
        if (!ability.name) {
            errors_for_ability.push('Missing name');
        }
        if (!ability.description) {
            errors_for_ability.push('Missing description');
        }
        if (ability.forceCost === undefined || ability.forceCost < 0) {
            errors_for_ability.push('Invalid Force cost');
        }
        if (errors_for_ability.length === 0) {
            valid.push(ability);
        }
        else {
            errors.push(`${ability.id || 'Unknown'}: ${errors_for_ability.join(', ')}`);
        }
    }
    return { valid, errors };
}
