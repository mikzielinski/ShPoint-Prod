import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { GLYPHS, iconFromCode } from '../lib/icons';
/** ====== Ikony (PUA) ====== */
const ICON = {
    "1": "\u0031", // pinned
    "3": "\u0033", // hunker
    "4": "\u0034", // exposed
    "5": "\u0035", // strained
    "8": "\u0038", // unit
    "9": "\u0039", // disarm
    a: "\u0061", // strike
    b: "\u0062", // critical
    c: "\u0063", // attack expertise
    d: "\u0064", // failure
    e: "\u0065", // block
    f: "\u0066", // defense expertise
    g: "\u0067", // range icon (mapujemy do sp-ranged)
    h: "\u0068", // dash
    i: "\u0069", // reactive
    j: "\u006A", // active
    k: "\u006B", // tactic
    l: "\u006C", // innate
    m: "\u006D", // identify
    n: "\u006E", // ranged
    o: "\u006F", // melee
    p: "\u0070", // shove
    q: "\u0071", // damage
    r: "\u0072", // heal
    s: "\u0073", // reposition
    t: "\u0074", // jump
    u: "\u0075", // climb
    v: "\u0076", // force
    w: "\u0077", // durability
};
const DiceSimulator = ({ hero1Action, hero2Action, hero1Stance, hero2Stance, hero1ActiveSide, hero2ActiveSide, onBackToCharacterSelection, showBackButton = false }) => {
    const [hero1DiceCount, setHero1DiceCount] = useState(0);
    const [hero2DiceCount, setHero2DiceCount] = useState(0);
    const [hero1Results, setHero1Results] = useState({
        criticals: 0,
        strikes: 0,
        blocks: 0,
        attackExpertise: 0,
        defenseExpertise: 0,
        failures: 0
    });
    const [hero2Results, setHero2Results] = useState({
        criticals: 0,
        strikes: 0,
        blocks: 0,
        attackExpertise: 0,
        defenseExpertise: 0,
        failures: 0
    });
    const [isRolling, setIsRolling] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [diceAnimation, setDiceAnimation] = useState(null);
    const [currentSymbols, setCurrentSymbols] = useState({ hero1: [], hero2: [] });
    // Pobierz liczbę kostek z danych postaci
    const getDiceCount = (hero, action) => {
        const stance = hero === 'hero1' ? hero1Stance : hero2Stance;
        const activeSide = hero === 'hero1' ? hero1ActiveSide : hero2ActiveSide;
        const side = stance?.sides?.find((s) => s.id === activeSide);
        if (action === 'defense') {
            // Obrona: pobierz wartość Defense od DEFENDERA w zależności od typu ataku ATTACKERA
            const attackerAction = hero === 'hero1' ? hero2Action : hero1Action;
            if (attackerAction === 'melee') {
                return side?.attack?.melee?.defense || 0;
            }
            else if (attackerAction === 'ranged') {
                return side?.attack?.ranged?.defense || 0;
            }
            return 0;
        }
        else {
            // Atak: pobierz wartość Dice od ATTACKERA
            return side?.attack?.[action]?.dice || 0;
        }
    };
    // Symuluj rzut kostkami
    const rollDice = (count, isAttack) => {
        const results = {
            criticals: 0,
            strikes: 0,
            blocks: 0,
            attackExpertise: 0,
            defenseExpertise: 0,
            failures: 0
        };
        for (let i = 0; i < count; i++) {
            if (isAttack) {
                // Attack dice (D8) - 8 stron: 1 Critical, 2 Strikes, 2 Attack Expertise, 3 Failures
                const roll = Math.floor(Math.random() * 8) + 1;
                if (roll === 1)
                    results.criticals++;
                else if (roll >= 2 && roll <= 3)
                    results.strikes++;
                else if (roll >= 4 && roll <= 5)
                    results.attackExpertise++;
                else
                    results.failures++; // 6, 7, 8
            }
            else {
                // Defense dice (D6) - 6 stron: 2 Blocks, 2 Defense Expertise, 2 Failures
                // NIE MA CRITICALS w defense dice!
                const roll = Math.floor(Math.random() * 6) + 1;
                if (roll >= 1 && roll <= 2)
                    results.blocks++;
                else if (roll >= 3 && roll <= 4)
                    results.defenseExpertise++;
                else
                    results.failures++; // 5, 6
            }
        }
        return results;
    };
    // Obsługa rzutu kostek
    const handleRollDice = () => {
        if (manualMode) {
            // W trybie manualnym tylko wykonaj obliczenia (interpretResults już jest wywoływane przez useEffect)
            return;
        }
        const hero1IsAttack = hero1Action !== 'defense';
        const hero2IsAttack = hero2Action !== 'defense';
        const hero1Count = hero1DiceCount || getDiceCount('hero1', hero1Action);
        const hero2Count = hero2DiceCount || getDiceCount('hero2', hero2Action);
        // Uruchom animację kostek
        setDiceAnimation({
            hero1: { type: hero1IsAttack ? 'D8' : 'D6', count: hero1Count, results: [] },
            hero2: { type: hero2IsAttack ? 'D8' : 'D6', count: hero2Count, results: [] }
        });
        // Inicjalizuj symbole
        const attackSymbols = [GLYPHS.critical, GLYPHS.strike, GLYPHS.attack_expertise, GLYPHS.failure];
        const defenseSymbols = [GLYPHS.block, GLYPHS.defense_expertise, GLYPHS.failure];
        setCurrentSymbols({
            hero1: Array.from({ length: hero1Count }, (_, i) => hero1IsAttack ? attackSymbols[i % attackSymbols.length] : defenseSymbols[i % defenseSymbols.length]),
            hero2: Array.from({ length: hero2Count }, (_, i) => hero2IsAttack ? attackSymbols[i % attackSymbols.length] : defenseSymbols[i % defenseSymbols.length])
        });
        setIsRolling(true);
        // Animacja zmiany symboli
        const symbolInterval = setInterval(() => {
            setCurrentSymbols(prev => ({
                hero1: prev.hero1.map(() => hero1IsAttack ? attackSymbols[Math.floor(Math.random() * attackSymbols.length)] :
                    defenseSymbols[Math.floor(Math.random() * defenseSymbols.length)]),
                hero2: prev.hero2.map(() => hero2IsAttack ? attackSymbols[Math.floor(Math.random() * attackSymbols.length)] :
                    defenseSymbols[Math.floor(Math.random() * defenseSymbols.length)])
            }));
        }, 200);
        // Zatrzymaj animację i pokaż wyniki po 2 sekundach
        setTimeout(() => {
            clearInterval(symbolInterval);
            setHero1Results(rollDice(hero1Count, hero1IsAttack));
            setHero2Results(rollDice(hero2Count, hero2IsAttack));
            setDiceAnimation(null);
            setCurrentSymbols({ hero1: [], hero2: [] });
            setIsRolling(false);
        }, 2000);
    };
    // Reset wyników
    // Helper functions for glyph rendering
    const tokenToSpClass = (token) => {
        const raw = (token ?? "").toString().trim();
        const br = raw.match(/^\[(\d+)\]$/);
        if (br)
            return `sp-[${br[1]}]`;
        const lower = raw.toLowerCase();
        // Specjalne aliasy / nazwy
        switch (lower) {
            case "crit":
            case "critical":
                return "sp-critical";
            case "hit":
            case "strike":
                return "sp-strike";
            case "block":
                return "sp-block";
            case "damage":
                return "sp-damage";
            case "heal":
                return "sp-heal";
            case "force":
                return "sp-force";
            case "dash":
                return "sp-dash";
            case "jump":
                return "sp-jump";
            case "reposition":
                return "sp-reposition";
            case "climb":
                return "sp-climb";
            case "expertise":
            case "attack-expertise":
                return "sp-attack-expertise";
            case "defense-expertise":
                return "sp-defense-expertise";
            case "ranged":
                return "sp-ranged";
            case "melee":
                return "sp-melee";
            case "shove":
                return "sp-shove";
            case "reactive":
                return "sp-reactive";
            case "active":
                return "sp-active";
            case "tactic":
                return "sp-tactic";
            case "innate":
                return "sp-innate";
            case "identify":
                return "sp-identify";
            case "failure":
            case "fail":
                return "sp-failure";
            default:
                return `sp-${lower}`;
        }
    };
    const iconChar = (t) => {
        // Najpierw spróbuj nowego systemu z icons.ts
        const iconName = iconFromCode(t);
        if (iconName && GLYPHS[iconName]) {
            return GLYPHS[iconName];
        }
        // Fallback do starego systemu
        return ICON[t] ?? (t.match(/^\[(\d+)\]$/)?.[1] ?? t);
    };
    // Function to render glyph tokens
    const renderGlyphToken = (token, key) => {
        const cls = tokenToSpClass(token);
        const ch = iconChar(token);
        return (_jsx("span", { className: `sp ${cls}`, style: {
                display: "inline-flex",
                minWidth: 20,
                height: 20,
                padding: "0 6px",
                borderRadius: 4,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: "#f9fafb",
                background: "#374151",
                border: "1px solid #4b5563"
            }, children: ch }, key));
    };
    // Komponent animacji kostek
    const DiceAnimation = ({ diceData, symbols }) => {
        if (!diceData)
            return null;
        const { type, count, results } = diceData;
        const isD8 = type === 'D8';
        const diceColor = isD8 ? '#6b7280' : '#3b82f6'; // Szary dla D8 (atak), niebieski dla D6 (obrona)
        return (_jsxs("div", { style: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                gap: '20px'
            }, children: [_jsxs("div", { style: {
                        fontSize: '24px',
                        color: '#f9fafb',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }, children: ["Rolling ", type, " Dice..."] }), _jsx("div", { style: {
                        display: 'flex',
                        gap: '15px',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }, children: Array.from({ length: count }, (_, i) => (_jsx("div", { style: {
                            width: isD8 ? '60px' : '50px',
                            height: isD8 ? '60px' : '50px',
                            background: diceColor,
                            borderRadius: isD8 ? '8px' : '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                            animation: `diceRoll${isD8 ? 'D8' : 'D6'} 2s ease-in-out infinite`,
                            transform: isD8 ? 'rotateX(45deg) rotateY(45deg)' : 'rotateX(0deg) rotateY(0deg)',
                            border: `2px solid ${diceColor === '#6b7280' ? '#4b5563' : '#2563eb'}`
                        }, children: _jsx("span", { className: "spicon", style: {
                                fontSize: '20px',
                                color: '#ffffff',
                                animation: `symbolChange${isD8 ? 'Attack' : 'Defense'} 0.3s ease-in-out infinite`
                            }, children: symbols[i] || (isD8 ? GLYPHS.strike : GLYPHS.block) }) }, i))) }), _jsx("style", { jsx: true, children: `
          @keyframes diceRollD8 {
            0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
            25% { transform: rotateX(90deg) rotateY(90deg) rotateZ(45deg); }
            50% { transform: rotateX(180deg) rotateY(180deg) rotateZ(90deg); }
            75% { transform: rotateX(270deg) rotateY(270deg) rotateZ(135deg); }
            100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(180deg); }
          }
          
          @keyframes diceRollD6 {
            0% { transform: rotateX(0deg) rotateY(0deg); }
            25% { transform: rotateX(90deg) rotateY(45deg); }
            50% { transform: rotateX(180deg) rotateY(90deg); }
            75% { transform: rotateX(270deg) rotateY(135deg); }
            100% { transform: rotateX(360deg) rotateY(180deg); }
          }
          
          @keyframes symbolChangeAttack {
            0% { opacity: 1; transform: scale(1); }
            25% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 0.7; transform: scale(1.1); }
            75% { opacity: 0.3; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
          
          @keyframes symbolChangeDefense {
            0% { opacity: 1; transform: scale(1); }
            33% { opacity: 0.5; transform: scale(0.9); }
            66% { opacity: 0.8; transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
          }
        ` })] }));
    };
    // Function to count symbols from active attack path
    const countSymbolsFromActivePath = (hero) => {
        const stance = hero === 'hero1' ? hero1Stance : hero2Stance;
        const activeSide = hero === 'hero1' ? hero1ActiveSide : hero2ActiveSide;
        if (!stance)
            return {};
        const activeSideData = stance.sides?.find((s) => s.id === activeSide);
        if (!activeSideData?.tree?.nodes)
            return {};
        const nodes = activeSideData.tree.nodes;
        const symbolCounts = {};
        // Get active nodes from window (set by BattlePage)
        const activeNodes = window[`${hero}ActiveNodes`] || new Set();
        // Count symbols from all active nodes
        activeNodes.forEach((nodeId) => {
            const node = nodes[nodeId];
            if (node?.effects) {
                node.effects.forEach((effect) => {
                    symbolCounts[effect] = (symbolCounts[effect] || 0) + 1;
                });
            }
        });
        return symbolCounts;
    };
    const handleReset = () => {
        setHero1Results({
            criticals: 0,
            strikes: 0,
            blocks: 0,
            attackExpertise: 0,
            defenseExpertise: 0,
            failures: 0
        });
        setHero2Results({
            criticals: 0,
            strikes: 0,
            blocks: 0,
            attackExpertise: 0,
            defenseExpertise: 0,
            failures: 0
        });
        // Wyczyść window
        window.hero1AttackExpertise = 0;
        window.hero1DefenseExpertise = 0;
        window.hero2AttackExpertise = 0;
        window.hero2DefenseExpertise = 0;
        window.hero1FinalAttack = 0;
        window.hero2FinalAttack = 0;
    };
    // Obsługa ręcznego wprowadzania wyników
    const handleManualResult = (hero, resultType, increment) => {
        const currentResults = hero === 'hero1' ? hero1Results : hero2Results;
        const setResults = hero === 'hero1' ? setHero1Results : setHero2Results;
        setResults(prev => ({
            ...prev,
            [resultType]: Math.max(0, prev[resultType] + (increment ? 1 : -1))
        }));
    };
    // Sprawdź czy ekspertyza jest aktywna
    const isExpertiseActive = (expertiseValue, rolledExpertise) => {
        if (expertiseValue.includes('+')) {
            // Format: "5+" - aktywna gdy 5 lub więcej
            const minValue = parseInt(expertiseValue.replace('+', ''));
            return rolledExpertise >= minValue;
        }
        else if (expertiseValue.includes('-')) {
            // Format: "3-4" - aktywna gdy 3 lub 4
            const [min, max] = expertiseValue.split('-').map(Number);
            return rolledExpertise >= min && rolledExpertise <= max;
        }
        else {
            // Format: "1" - aktywna tylko gdy dokładnie 1
            return rolledExpertise === parseInt(expertiseValue);
        }
    };
    // Funkcja do interpretacji ekspertyz i modyfikacji wyników
    const applyExpertiseEffects = (hero, results, expertiseCount, action) => {
        const stance = hero === 'hero1' ? hero1Stance : hero2Stance;
        const activeSide = hero === 'hero1' ? hero1ActiveSide : hero2ActiveSide;
        const side = stance?.sides?.find((s) => s.id === activeSide);
        let modifiedResults = { ...results };
        let additionalEffects = [];
        // Znajdź odpowiednią ekspertyzę
        let expertise = null;
        if (action === 'melee' && side?.attack?.melee?.expertise) {
            expertise = side.attack.melee.expertise;
        }
        else if (action === 'ranged' && side?.attack?.ranged?.expertise) {
            expertise = side.attack.ranged.expertise;
        }
        else if (action === 'defense' && side?.defense?.expertise) {
            expertise = side.defense.expertise;
        }
        if (expertise && expertiseCount > 0) {
            // Debug: sprawdź ekspertyzy
            console.log(`${hero} ${action} expertise:`, expertise);
            console.log(`${hero} ${action} expertiseCount:`, expertiseCount);
            // Znajdź aktywną ekspertyzę - sprawdź wszystkie i wybierz najlepszą
            let activeExpertise = null;
            let bestMatch = -1;
            expertise.forEach((exp) => {
                let matches = false;
                let priority = 0;
                if (exp.value.includes('+')) {
                    const minValue = parseInt(exp.value.replace('+', ''));
                    matches = expertiseCount >= minValue;
                    priority = minValue;
                }
                else if (exp.value.includes('-')) {
                    const [min, max] = exp.value.split('-').map(Number);
                    matches = expertiseCount >= min && expertiseCount <= max;
                    priority = max; // Wybierz najwyższy zakres
                }
                else {
                    matches = expertiseCount === parseInt(exp.value);
                    priority = parseInt(exp.value);
                }
                if (matches && priority > bestMatch) {
                    activeExpertise = exp;
                    bestMatch = priority;
                }
            });
            console.log(`${hero} ${action} activeExpertise:`, activeExpertise);
            if (activeExpertise && activeExpertise.effects) {
                console.log(`${hero} ${action} effects:`, activeExpertise.effects);
                activeExpertise.effects.forEach((effect) => {
                    console.log(`${hero} ${action} processing effect:`, effect);
                    // Sprawdź czy to modyfikacja wyniku (np. "Fail -> Strike")
                    if (effect.includes('->')) {
                        const [from, to] = effect.split('->').map(s => s.trim());
                        console.log(`${hero} ${action} processing conversion: "${from}" -> "${to}"`);
                        if (from === 'Fail' && to === 'Strike' && modifiedResults.failures > 0) {
                            modifiedResults.failures--;
                            modifiedResults.strikes++;
                        }
                        else if (from === 'Strike' && to === 'Crit' && modifiedResults.strikes > 0) {
                            modifiedResults.strikes--;
                            modifiedResults.criticals++;
                        }
                        else if (from === 'Crit' && to === 'Strike' && modifiedResults.criticals > 0) {
                            modifiedResults.criticals--;
                            modifiedResults.strikes++;
                        }
                        else if (from === 'Strike' && to === 'Fail' && modifiedResults.strikes > 0) {
                            console.log(`${hero} ${action} converting Strike to Fail: ${modifiedResults.strikes} -> ${modifiedResults.strikes - 1} strikes, ${modifiedResults.failures} -> ${modifiedResults.failures + 1} failures`);
                            modifiedResults.strikes--;
                            modifiedResults.failures++;
                        }
                        else {
                            console.log(`${hero} ${action} no conversion possible for ${from} -> ${to}: strikes=${modifiedResults.strikes}, failures=${modifiedResults.failures}, criticals=${modifiedResults.criticals}`);
                        }
                    }
                    else if (effect === 'Crit' || effect === 'b') {
                        // Dodaj Critical
                        modifiedResults.criticals++;
                    }
                    else if (effect === 'Strike' || effect === 'a') {
                        // Dodaj Strike
                        modifiedResults.strikes++;
                    }
                    else if (effect === 'Block' || effect === 'e') {
                        // Dodaj Block
                        modifiedResults.blocks++;
                    }
                    else if (effect === 'Fail' || effect === 'd') {
                        // Dodaj Fail
                        modifiedResults.failures++;
                    }
                    else if (effect === 'c') {
                        // Dodaj Attack Expertise
                        modifiedResults.attackExpertise++;
                    }
                    else if (effect === 'f') {
                        // Dodaj Defense Expertise
                        modifiedResults.defenseExpertise++;
                    }
                    else if (effect.includes('→')) {
                        // Obsługa konwersji z pojedynczymi znakami (np. "a→d")
                        const [from, to] = effect.split('→').map(s => s.trim());
                        console.log(`${hero} ${action} processing single char conversion: "${from}" -> "${to}"`);
                        // Sprawdź czy to konwersja wpływająca na przeciwnika (np. "a→d" w defense expertise)
                        const isCrossPlayerEffect = (action === 'defense' && from === 'a' && to === 'd') ||
                            (action === 'attack' && from === 'a' && to === 'd');
                        if (isCrossPlayerEffect) {
                            // To jest efekt wpływający na przeciwnika - dodaj do additionalEffects
                            console.log(`${hero} ${action} adding cross-player effect: ${effect}`);
                            additionalEffects.push(effect);
                        }
                        else {
                            // To jest lokalna konwersja - przetwórz lokalnie
                            if (from === 'a' && to === 'd' && modifiedResults.strikes > 0) {
                                console.log(`${hero} ${action} converting Strike (a) to Fail (d) locally`);
                                modifiedResults.strikes--;
                                modifiedResults.failures++;
                            }
                            else if (from === 'b' && to === 'a' && modifiedResults.criticals > 0) {
                                console.log(`${hero} ${action} converting Crit (b) to Strike (a) locally`);
                                modifiedResults.criticals--;
                                modifiedResults.strikes++;
                            }
                            else if (from === 'a' && to === 'b' && modifiedResults.strikes > 0) {
                                console.log(`${hero} ${action} converting Strike (a) to Crit (b) locally`);
                                modifiedResults.strikes--;
                                modifiedResults.criticals++;
                            }
                            else if (from === 'd' && to === 'a' && modifiedResults.failures > 0) {
                                console.log(`${hero} ${action} converting Fail (d) to Strike (a) locally`);
                                modifiedResults.failures--;
                                modifiedResults.strikes++;
                            }
                            else {
                                console.log(`${hero} ${action} no single char conversion possible for ${from} -> ${to}`);
                            }
                        }
                    }
                    else {
                        // Inne efekty (np. Reposition, Jump, Move)
                        additionalEffects.push(effect);
                    }
                });
            }
        }
        console.log(`${hero} ${action} final modifiedResults:`, modifiedResults);
        console.log(`${hero} ${action} additionalEffects:`, additionalEffects);
        return { modifiedResults, additionalEffects };
    };
    // Interpretacja wyników
    const interpretResults = () => {
        const hero1IsAttack = hero1Action !== 'defense';
        const hero2IsAttack = hero2Action !== 'defense';
        // 1. Odczyt rzutów - wyniki (już mamy w hero1Results, hero2Results)
        // 2. Konwersja ekspertyz - najpierw przetwarzamy efekty dla obu graczy
        const hero1ExpertiseCount = hero1IsAttack ? hero1Results.attackExpertise : hero1Results.defenseExpertise;
        const hero2ExpertiseCount = hero2IsAttack ? hero2Results.attackExpertise : hero2Results.defenseExpertise;
        const hero1Effects = applyExpertiseEffects('hero1', hero1Results, hero1ExpertiseCount, hero1Action);
        const hero2Effects = applyExpertiseEffects('hero2', hero2Results, hero2ExpertiseCount, hero2Action);
        let hero1Modified = hero1Effects.modifiedResults;
        let hero2Modified = hero2Effects.modifiedResults;
        // 3. Wzajemne oddziaływania - konwersje mogą wpływać na przeciwnika
        console.log('=== CROSS-PLAYER EFFECTS ===');
        console.log('Hero1 effects:', hero1Effects.additionalEffects);
        console.log('Hero2 effects:', hero2Effects.additionalEffects);
        // Sprawdź czy efekty jednego gracza wpływają na wyniki drugiego
        // Przykład: Broniący ma ekspertyzę "a→d" (Strike -> Fail) - zmienia Strike przeciwnika w Fail
        // Hero1 efekty wpływające na Hero2
        hero1Effects.additionalEffects.forEach(effect => {
            if (effect.includes('→')) {
                const [from, to] = effect.split('→').map(s => s.trim());
                console.log(`Hero1 effect "${effect}" affecting Hero2: ${from} -> ${to}`);
                if (from === 'a' && to === 'd' && hero2Modified.strikes > 0) {
                    console.log(`Converting Hero2 Strike to Fail: ${hero2Modified.strikes} -> ${hero2Modified.strikes - 1} strikes, ${hero2Modified.failures} -> ${hero2Modified.failures + 1} failures`);
                    hero2Modified.strikes--;
                    hero2Modified.failures++;
                }
            }
        });
        // Hero2 efekty wpływające na Hero1
        hero2Effects.additionalEffects.forEach(effect => {
            if (effect.includes('→')) {
                const [from, to] = effect.split('→').map(s => s.trim());
                console.log(`Hero2 effect "${effect}" affecting Hero1: ${from} -> ${to}`);
                if (from === 'a' && to === 'd' && hero1Modified.strikes > 0) {
                    console.log(`Converting Hero1 Strike to Fail: ${hero1Modified.strikes} -> ${hero1Modified.strikes - 1} strikes, ${hero1Modified.failures} -> ${hero1Modified.failures + 1} failures`);
                    hero1Modified.strikes--;
                    hero1Modified.failures++;
                }
            }
        });
        console.log('After cross-player effects:');
        console.log('Hero1 modified:', hero1Modified);
        console.log('Hero2 modified:', hero2Modified);
        // 4. Bloki (tylko dla obrony)
        const hero1Blocks = hero1IsAttack ? 0 : hero1Modified.blocks;
        const hero2Blocks = hero2IsAttack ? 0 : hero2Modified.blocks;
        // 5. Suma - Oblicz finalne wyniki
        const hero1FinalAttack = hero1IsAttack ?
            hero1Modified.criticals + Math.max(0, hero1Modified.strikes - hero2Blocks) : 0;
        const hero2FinalAttack = hero2IsAttack ?
            hero2Modified.criticals + Math.max(0, hero2Modified.strikes - hero1Blocks) : 0;
        // Final Defense = ilość zablokowanych strike'ów
        const hero1FinalDefense = hero1IsAttack ? 0 : Math.min(hero1Modified.blocks, hero2IsAttack ? hero2Modified.strikes : 0);
        const hero2FinalDefense = hero2IsAttack ? 0 : Math.min(hero2Modified.blocks, hero1IsAttack ? hero1Modified.strikes : 0);
        // Zapisz wyniki ekspertyz i Final Attack w window dla BattlePage
        window.hero1AttackExpertise = hero1Results.attackExpertise;
        window.hero1DefenseExpertise = hero1Results.defenseExpertise;
        window.hero2AttackExpertise = hero2Results.attackExpertise;
        window.hero2DefenseExpertise = hero2Results.defenseExpertise;
        window.hero1FinalAttack = hero1FinalAttack;
        window.hero2FinalAttack = hero2FinalAttack;
        return {
            hero1FinalAttack,
            hero2FinalAttack,
            hero1FinalDefense,
            hero2FinalDefense,
            hero1Expertise: hero1ExpertiseCount,
            hero2Expertise: hero2ExpertiseCount,
            hero1Modified,
            hero2Modified,
            hero1AdditionalEffects: hero1Effects.additionalEffects,
            hero2AdditionalEffects: hero2Effects.additionalEffects
        };
    };
    // Pobierz domyślną liczbę kostek
    const defaultHero1Count = getDiceCount('hero1', hero1Action);
    const defaultHero2Count = getDiceCount('hero2', hero2Action);
    // Aktualizuj window gdy zmieniają się wyniki
    useEffect(() => {
        interpretResults();
    }, [hero1Results, hero2Results, hero1Action, hero2Action]);
    return (_jsxs(_Fragment, { children: [diceAnimation && (_jsx(DiceAnimation, { diceData: diceAnimation.hero1, symbols: currentSymbols.hero1 })), _jsxs("div", { style: {
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: '12px',
                    border: '2px solid #475569',
                    padding: '24px',
                    minHeight: '400px'
                }, children: [_jsxs("h3", { style: {
                            color: '#f9fafb',
                            fontSize: '24px',
                            fontWeight: '700',
                            marginBottom: '24px',
                            textAlign: 'center'
                        }, children: [_jsx("span", { className: "spicon sp-melee", style: { fontSize: '28px', color: '#f97316' }, children: GLYPHS.melee }), " Combat Zone"] }), _jsxs("div", { style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: '24px',
                            padding: '16px',
                            background: '#1e293b',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            minWidth: '300px'
                        }, children: [_jsxs("h4", { style: { color: '#f9fafb', marginBottom: '12px' }, children: [hero1Action === 'defense' ? 'DEFENDER' : 'ATTACKER', " - ", hero1Action.toUpperCase(), _jsxs("span", { style: { fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }, children: ["(", hero1Action === 'defense' ? 'D6' : 'D8', ")"] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }, children: [_jsx("span", { style: { color: '#d1d5db' }, children: "Dice Count:" }), _jsx("button", { onClick: () => setHero1DiceCount(Math.max(0, hero1DiceCount - 1)), style: {
                                            background: '#dc2626',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            cursor: 'pointer'
                                        }, children: "-" }), _jsx("input", { type: "number", value: hero1DiceCount || defaultHero1Count, onChange: (e) => setHero1DiceCount(parseInt(e.target.value) || 0), style: {
                                            background: '#374151',
                                            color: '#f9fafb',
                                            border: '1px solid #4b5563',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            width: '60px',
                                            textAlign: 'center'
                                        } }), _jsx("button", { onClick: () => setHero1DiceCount(hero1DiceCount + 1), style: {
                                            background: '#059669',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            cursor: 'pointer'
                                        }, children: "+" })] }), _jsxs("div", { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }, children: [hero1Action !== 'defense' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-critical", style: { fontSize: '16px', color: '#fbbf24' }, children: GLYPHS.critical }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero1Results.criticals }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero1', 'criticals', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero1', 'criticals', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })), hero1Action !== 'defense' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-strike", style: { fontSize: '16px', color: '#ef4444' }, children: GLYPHS.strike }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero1Results.strikes }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero1', 'strikes', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero1', 'strikes', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })), hero1Action === 'defense' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-block", style: { fontSize: '16px', color: '#6b7280' }, children: GLYPHS.block }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero1Results.blocks }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero1', 'blocks', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero1', 'blocks', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })), hero1Action !== 'defense' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-attack-expertise", style: { fontSize: '16px', color: '#dc2626' }, children: GLYPHS.attack_expertise }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero1Results.attackExpertise }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero1', 'attackExpertise', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero1', 'attackExpertise', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })), hero1Action === 'defense' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-defense-expertise", style: { fontSize: '16px', color: '#2563eb' }, children: GLYPHS.defense_expertise }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero1Results.defenseExpertise }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero1', 'defenseExpertise', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero1', 'defenseExpertise', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-failure", style: { fontSize: '16px', color: '#9ca3af' }, children: GLYPHS.failure }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero1Results.failures }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero1', 'failures', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero1', 'failures', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })] })] }), _jsxs("div", { style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: '24px',
                            padding: '16px',
                            background: '#1e293b',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            minWidth: '300px'
                        }, children: [_jsxs("h4", { style: { color: '#f9fafb', marginBottom: '12px' }, children: [hero2Action === 'defense' ? 'DEFENDER' : 'ATTACKER', " - ", hero2Action.toUpperCase(), _jsxs("span", { style: { fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }, children: ["(", hero2Action === 'defense' ? 'D6' : 'D8', ")"] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }, children: [_jsx("span", { style: { color: '#d1d5db' }, children: "Dice Count:" }), _jsx("button", { onClick: () => setHero2DiceCount(Math.max(0, hero2DiceCount - 1)), style: {
                                            background: '#dc2626',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            cursor: 'pointer'
                                        }, children: "-" }), _jsx("input", { type: "number", value: hero2DiceCount || defaultHero2Count, onChange: (e) => setHero2DiceCount(parseInt(e.target.value) || 0), style: {
                                            background: '#374151',
                                            color: '#f9fafb',
                                            border: '1px solid #4b5563',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            width: '60px',
                                            textAlign: 'center'
                                        } }), _jsx("button", { onClick: () => setHero2DiceCount(hero2DiceCount + 1), style: {
                                            background: '#059669',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            cursor: 'pointer'
                                        }, children: "+" })] }), _jsxs("div", { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }, children: [hero2Action !== 'defense' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-critical", style: { fontSize: '16px', color: '#fbbf24' }, children: GLYPHS.critical }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero2Results.criticals }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero2', 'criticals', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero2', 'criticals', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })), hero2Action !== 'defense' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-strike", style: { fontSize: '16px', color: '#ef4444' }, children: GLYPHS.strike }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero2Results.strikes }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero2', 'strikes', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero2', 'strikes', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })), hero2Action === 'defense' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-block", style: { fontSize: '16px', color: '#6b7280' }, children: GLYPHS.block }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero2Results.blocks }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero2', 'blocks', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero2', 'blocks', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })), hero2Action !== 'defense' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-attack-expertise", style: { fontSize: '16px', color: '#dc2626' }, children: GLYPHS.attack_expertise }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero2Results.attackExpertise }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero2', 'attackExpertise', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero2', 'attackExpertise', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })), hero2Action === 'defense' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-defense-expertise", style: { fontSize: '16px', color: '#2563eb' }, children: GLYPHS.defense_expertise }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero2Results.defenseExpertise }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero2', 'defenseExpertise', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero2', 'defenseExpertise', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { className: "spicon sp-failure", style: { fontSize: '16px', color: '#9ca3af' }, children: GLYPHS.failure }), _jsx("span", { style: { color: '#f9fafb', minWidth: '20px', textAlign: 'center' }, children: hero2Results.failures }), manualMode && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("button", { onClick: () => handleManualResult('hero2', 'failures', true), style: { background: '#059669', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "+" }), _jsx("button", { onClick: () => handleManualResult('hero2', 'failures', false), style: { background: '#dc2626', color: 'white', border: 'none', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }, children: "-" })] }))] })] })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }, children: [_jsx("button", { onClick: handleRollDice, disabled: isRolling, style: {
                                    background: isRolling ? '#6b7280' : (manualMode ? '#059669' : '#f97316'),
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: isRolling ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }, children: isRolling ? (_jsx(_Fragment, { children: "Rolling..." })) : manualMode ? (_jsx(_Fragment, { children: "Calculate" })) : (_jsx(_Fragment, { children: "Roll Dice" })) }), _jsx("button", { onClick: () => setManualMode(!manualMode), style: {
                                    background: manualMode ? '#059669' : '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }, children: manualMode ? 'Exit Manual' : 'Manual Input' }), _jsx("button", { onClick: handleReset, style: {
                                    background: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }, children: "Reset" }), showBackButton && onBackToCharacterSelection && (_jsx("button", { onClick: onBackToCharacterSelection, style: {
                                    background: '#8b5cf6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }, children: "Back to Character Selection" }))] }), (hero1Results.criticals > 0 || hero1Results.strikes > 0 || hero1Results.blocks > 0 ||
                        hero2Results.criticals > 0 || hero2Results.strikes > 0 || hero2Results.blocks > 0) && (_jsxs("div", { style: {
                            marginTop: '24px',
                            padding: '16px',
                            background: '#1e293b',
                            borderRadius: '8px',
                            border: '1px solid #334155'
                        }, children: [_jsx("h4", { style: { color: '#f9fafb', marginBottom: '12px', textAlign: 'center' }, children: "Dice Results" }), (() => {
                                const interpretation = interpretResults();
                                return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { style: {
                                                background: '#0f172a',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                border: '1px solid #334155',
                                                minWidth: '100%'
                                            }, children: [_jsx("h5", { style: { color: '#3b82f6', marginBottom: '8px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }, children: "Attacker" }), _jsxs("div", { style: { fontSize: '14px', color: '#9ca3af', marginBottom: '6px' }, children: ["Base Roll:", hero1Action === 'defense' ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "spicon sp-block", style: { fontSize: '14px', color: '#10b981', margin: '0 2px' }, children: GLYPHS.block }), hero1Results.blocks, _jsx("span", { className: "spicon sp-defense-expertise", style: { fontSize: '14px', color: '#3b82f6', margin: '0 2px' }, children: GLYPHS.defense_expertise }), hero1Results.defenseExpertise, _jsx("span", { className: "spicon sp-failure", style: { fontSize: '14px', color: '#6b7280', margin: '0 2px' }, children: GLYPHS.failure }), hero1Results.failures] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "spicon sp-critical", style: { fontSize: '14px', color: '#fbbf24', margin: '0 2px' }, children: GLYPHS.critical }), hero1Results.criticals, _jsx("span", { className: "spicon sp-strike", style: { fontSize: '14px', color: '#ef4444', margin: '0 2px' }, children: GLYPHS.strike }), hero1Results.strikes, _jsx("span", { className: "spicon sp-attack-expertise", style: { fontSize: '14px', color: '#f59e0b', margin: '0 2px' }, children: GLYPHS.attack_expertise }), hero1Results.attackExpertise, _jsx("span", { className: "spicon sp-failure", style: { fontSize: '14px', color: '#6b7280', margin: '0 2px' }, children: GLYPHS.failure }), hero1Results.failures] }))] }), hero1Action === 'defense' && (_jsxs("div", { style: { fontSize: '14px', color: '#9ca3af', marginBottom: '6px' }, children: ["After Expertise:", _jsx("span", { className: "spicon sp-block", style: { fontSize: '14px', color: '#10b981', margin: '0 2px' }, children: GLYPHS.block }), interpretation.hero1Modified.blocks] })), hero1Action !== 'defense' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { fontSize: '14px', color: '#9ca3af', marginBottom: '6px' }, children: ["After Expertise:", _jsx("span", { className: "spicon sp-critical", style: { fontSize: '14px', color: '#fbbf24', margin: '0 2px' }, children: GLYPHS.critical }), interpretation.hero1Modified.criticals, _jsx("span", { className: "spicon sp-strike", style: { fontSize: '14px', color: '#ef4444', margin: '0 2px' }, children: GLYPHS.strike }), interpretation.hero1Modified.strikes] }), _jsxs("div", { style: { fontSize: '14px', color: '#9ca3af', marginBottom: '6px' }, children: ["After Block:", _jsx("span", { className: "spicon sp-critical", style: { fontSize: '14px', color: '#fbbf24', margin: '0 2px' }, children: GLYPHS.critical }), interpretation.hero1Modified.criticals, _jsx("span", { className: "spicon sp-strike", style: { fontSize: '14px', color: '#ef4444', margin: '0 2px' }, children: GLYPHS.strike }), Math.max(0, interpretation.hero1Modified.strikes - (hero2Action === 'defense' ? interpretation.hero2Modified.blocks : 0))] })] })), _jsxs("div", { style: { fontSize: '14px', color: '#9ca3af', marginBottom: '6px' }, children: [hero1Action === 'defense' ? 'Final Defense:' : 'Final Attack:', " ", _jsx("span", { style: { color: '#f9fafb', fontWeight: '600' }, children: hero1Action === 'defense' ? interpretation.hero1FinalDefense : interpretation.hero1FinalAttack })] }), interpretation.hero1AdditionalEffects.length > 0 && (_jsxs("div", { style: { fontSize: '14px', color: '#9ca3af' }, children: ["Additional Effects:", interpretation.hero1AdditionalEffects.map((effect, index) => (_jsx("span", { className: "spicon", style: { fontSize: '12px', margin: '0 2px' }, children: effect }, index)))] }))] }), _jsxs("div", { style: {
                                                background: '#0f172a',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                border: '1px solid #334155',
                                                minWidth: '100%'
                                            }, children: [_jsx("h5", { style: { color: '#ef4444', marginBottom: '8px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }, children: "Defender" }), _jsxs("div", { style: { fontSize: '14px', color: '#9ca3af', marginBottom: '6px' }, children: ["Base Roll:", hero2Action === 'defense' ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "spicon sp-block", style: { fontSize: '14px', color: '#10b981', margin: '0 2px' }, children: GLYPHS.block }), hero2Results.blocks, _jsx("span", { className: "spicon sp-defense-expertise", style: { fontSize: '14px', color: '#3b82f6', margin: '0 2px' }, children: GLYPHS.defense_expertise }), hero2Results.defenseExpertise, _jsx("span", { className: "spicon sp-failure", style: { fontSize: '14px', color: '#6b7280', margin: '0 2px' }, children: GLYPHS.failure }), hero2Results.failures] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "spicon sp-critical", style: { fontSize: '14px', color: '#fbbf24', margin: '0 2px' }, children: GLYPHS.critical }), hero2Results.criticals, _jsx("span", { className: "spicon sp-strike", style: { fontSize: '14px', color: '#ef4444', margin: '0 2px' }, children: GLYPHS.strike }), hero2Results.strikes, _jsx("span", { className: "spicon sp-attack-expertise", style: { fontSize: '14px', color: '#f59e0b', margin: '0 2px' }, children: GLYPHS.attack_expertise }), hero2Results.attackExpertise, _jsx("span", { className: "spicon sp-failure", style: { fontSize: '14px', color: '#6b7280', margin: '0 2px' }, children: GLYPHS.failure }), hero2Results.failures] }))] }), hero2Action === 'defense' && (_jsxs("div", { style: { fontSize: '14px', color: '#9ca3af', marginBottom: '6px' }, children: ["After Expertise:", _jsx("span", { className: "spicon sp-block", style: { fontSize: '14px', color: '#10b981', margin: '0 2px' }, children: GLYPHS.block }), interpretation.hero2Modified.blocks] })), hero2Action !== 'defense' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { fontSize: '14px', color: '#9ca3af', marginBottom: '6px' }, children: ["After Expertise:", _jsx("span", { className: "spicon sp-critical", style: { fontSize: '14px', color: '#fbbf24', margin: '0 2px' }, children: GLYPHS.critical }), interpretation.hero2Modified.criticals, _jsx("span", { className: "spicon sp-strike", style: { fontSize: '14px', color: '#ef4444', margin: '0 2px' }, children: GLYPHS.strike }), interpretation.hero2Modified.strikes] }), _jsxs("div", { style: { fontSize: '14px', color: '#9ca3af', marginBottom: '6px' }, children: ["After Block:", _jsx("span", { className: "spicon sp-critical", style: { fontSize: '14px', color: '#fbbf24', margin: '0 2px' }, children: GLYPHS.critical }), interpretation.hero2Modified.criticals, _jsx("span", { className: "spicon sp-strike", style: { fontSize: '14px', color: '#ef4444', margin: '0 2px' }, children: GLYPHS.strike }), Math.max(0, interpretation.hero2Modified.strikes - (hero1Action === 'defense' ? interpretation.hero1Modified.blocks : 0))] })] })), _jsxs("div", { style: { fontSize: '14px', color: '#9ca3af', marginBottom: '6px' }, children: [hero2Action === 'defense' ? 'Final Defense:' : 'Final Attack:', " ", _jsx("span", { style: { color: '#f9fafb', fontWeight: '600' }, children: hero2Action === 'defense' ? interpretation.hero2FinalDefense : interpretation.hero2FinalAttack })] }), interpretation.hero2AdditionalEffects.length > 0 && (_jsxs("div", { style: { fontSize: '14px', color: '#9ca3af' }, children: ["Additional Effects:", interpretation.hero2AdditionalEffects.map((effect, index) => (_jsx("span", { className: "spicon", style: { fontSize: '12px', margin: '0 2px' }, children: effect }, index)))] }))] })] }));
                            })()] })), (() => {
                        const hero1Symbols = countSymbolsFromActivePath('hero1');
                        const hero2Symbols = countSymbolsFromActivePath('hero2');
                        const hasSymbols = Object.keys(hero1Symbols).length > 0 || Object.keys(hero2Symbols).length > 0;
                        return (_jsxs("div", { style: {
                                padding: '16px',
                                background: '#1e293b',
                                borderRadius: '8px',
                                border: '1px solid #334155',
                                marginTop: '12px'
                            }, children: [_jsx("h4", { style: { color: '#f9fafb', marginBottom: '12px', textAlign: 'center' }, children: "Combat Summary" }), hasSymbols ? (_jsxs("div", { style: { display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }, children: [Object.keys(hero1Symbols).length > 0 && (_jsxs("div", { style: { minWidth: '200px' }, children: [_jsx("h5", { style: { color: '#3b82f6', marginBottom: '8px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }, children: "Attacker - Active Path" }), _jsx("div", { style: {
                                                        display: 'flex',
                                                        gap: '8px',
                                                        flexWrap: 'wrap',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }, children: Object.entries(hero1Symbols).map(([symbol, count]) => (_jsxs("div", { style: {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '4px 8px',
                                                            background: '#374151',
                                                            borderRadius: '4px',
                                                            border: '1px solid #4b5563'
                                                        }, children: [_jsx("span", { className: "spicon", style: { fontSize: '14px', color: '#f9fafb' }, children: renderGlyphToken(symbol) }), _jsx("span", { style: { fontSize: '12px', color: '#f9fafb', fontWeight: '600' }, children: count })] }, symbol))) })] })), Object.keys(hero2Symbols).length > 0 && (_jsxs("div", { style: { minWidth: '200px' }, children: [_jsx("h5", { style: { color: '#ef4444', marginBottom: '8px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }, children: "Defender - Active Path" }), _jsx("div", { style: {
                                                        display: 'flex',
                                                        gap: '8px',
                                                        flexWrap: 'wrap',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }, children: Object.entries(hero2Symbols).map(([symbol, count]) => (_jsxs("div", { style: {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '4px 8px',
                                                            background: '#374151',
                                                            borderRadius: '4px',
                                                            border: '1px solid #4b5563'
                                                        }, children: [_jsx("span", { className: "spicon", style: { fontSize: '14px', color: '#f9fafb' }, children: renderGlyphToken(symbol) }), _jsx("span", { style: { fontSize: '12px', color: '#f9fafb', fontWeight: '600' }, children: count })] }, symbol))) })] }))] })) : (_jsx("div", { style: {
                                        textAlign: 'center',
                                        color: '#9ca3af',
                                        fontSize: '14px',
                                        padding: '20px'
                                    }, children: "Pick active stance path" }))] }));
                    })()] })] }));
};
export default DiceSimulator;
