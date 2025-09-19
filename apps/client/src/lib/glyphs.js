{
    rtf1;
    ansi;
    ansicpg1250;
    cocoartf2822;
    cocoatextscaling0;
    cocoaplatform0;
    {
        fonttbl;
        f0;
        fswiss;
        fcharset0;
        Helvetica;
    }
    {
        colortbl;
        red255;
        green255;
        blue255;
    }
    {
         * ;
        expandedcolortbl;
        ;
    }
    paperw11900;
    paperh16840;
    margl1440;
    margr1440;
    vieww11520;
    viewh8400;
    viewkind0;
    pard;
    tx720;
    tx1440;
    tx2160;
    tx2880;
    tx3600;
    tx4320;
    tx5040;
    tx5760;
    tx6480;
    tx7200;
    tx7920;
    tx8640;
    pardirnatural;
    partightenfactor0;
    f0;
    fs24;
    cf0; // Ustal wsp\'f3lny typ nazw \'96 mo\uc0\u380 esz rozszerzy\u263  bez zmian w reszcie kodu:\
        | "crit" | "hit" | "block" | "expertise";
        | "damage" | "heal" | "force";
        | "dash" | "jump" | "reposition" | "shove" | "hunker";
        | "exposed" | "strained" | "pinned" | "disarmed";
        | "range" | "die" | "info";
        | "CRIT" | "HIT" | "BLOCK" | "DAMAGE" | "HEAL";
        | "SHOVE" | "DASH" | "JUMP" | "REPOSITION" | "HUNKER";
        | "EXPOSED" | "STRAINED" | "PINNED" | "DISARMED";
        | "RANGE" | "FORCE" | "EXPERTISE";
    // mapowanie nazw \uc0\u8594  symbol id w sprite\
    export const GLYPH_ID = , { crit: , "g-crit": , hit: , "g-hit": , block: , "g-block": , expertise: , "g-expertise": , damage: , "g-damage": , heal: , "g-heal": , force: , "g-force": , dash: , "g-dash": , jump: , "g-jump": , reposition: , "g-reposition": , shove: , "g-shove": , hunker: , "g-hunker": , exposed: , "g-exposed": , strained: , "g-strained": , pinned: , "g-pinned": , disarmed: , "g-disarmed": , range: , "g-range": , die: , "g-die": , info: , "g-info": , };
}
;
// kolory/kategorie pod stance (opcjonalne)\
export const GLYPH_STYLE, { kind: SymbolKind };
className ?  : string;
 >> ;
{
    crit: ;
    {
        kind: "attack", className;
        "pip--atk";
    }
    hit: ;
    {
        kind: "attack", className;
        "pip--atk";
    }
    damage: ;
    {
        kind: "attack", className;
        "pip--atk";
    }
    expertise: ;
    {
        kind: "attack", className;
        "pip--atk";
    }
    block: ;
    {
        kind: "defense", className;
        "pip--def";
    }
    exposed: ;
    {
        kind: "effect";
    }
    strained: ;
    {
        kind: "effect";
    }
    pinned: ;
    {
        kind: "effect";
    }
    disarmed: ;
    {
        kind: "effect";
    }
    shove: ;
    {
        kind: "effect";
    }
    dash: ;
    {
        kind: "effect";
    }
    jump: ;
    {
        kind: "effect";
    }
    reposition: ;
    {
        kind: "effect";
    }
    heal: ;
    {
        kind: "effect";
    }
    hunker: ;
    {
        kind: "effect";
    }
    range: ;
    {
        kind: "effect";
    }
    die: ;
    {
        kind: "effect";
    }
    force: ;
    {
        kind: "effect";
    }
    info: ;
    {
        kind: "effect";
    }
}
;
{
    switch (s) {
    }
    {
        "CRIT";
        return "crit";
        "HIT";
        return "hit";
        "BLOCK";
        return "block";
        "EXPERTISE";
        return "expertise";
        "DAMAGE";
        return "damage";
        "HEAL";
        return "heal";
        "FORCE";
        return "force";
        "SHOVE";
        return "shove";
        "DASH";
        return "dash";
        "JUMP";
        return "jump";
        "REPOSITION";
        return "reposition";
        "HUNKER";
        return "hunker";
        "EXPOSED";
        return "exposed";
        "STRAINED";
        return "strained";
        "PINNED";
        return "pinned";
        "DISARMED";
        return "disarmed";
        "RANGE";
        return "range";
        "DIE";
        return "die";
        return "info";
    }
}
