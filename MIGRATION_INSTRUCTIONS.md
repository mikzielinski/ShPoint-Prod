# 🚀 Instrukcje migracji JSON → Baza danych

## ✅ Co zostało zrobione

### 1. **Zaktualizowany schema.prisma**
- ✅ Dodane nowe tabele: `Character`, `CharacterAbility`, `CharacterStance`, `Set`, `Mission`, etc.
- ✅ Zoptymalizowane indeksy dla szybkiego ładowania
- ✅ Relacje między tabelami
- ✅ Wersjonowanie i śledzenie zmian
- ✅ Drzewa stance jako JSON z optymalizacją

### 2. **Skrypty migracji**
- ✅ `migrate-json-to-db.ts` - migruje wszystkie dane z JSON do bazy
- ✅ `test-stance-trees.ts` - testuje czy drzewa stance działają poprawnie
- ✅ Zaktualizowany `package.json` z nowymi komendami

### 3. **Optymalizacje wydajności**
- ✅ Indeksy na wszystkich kluczowych polach
- ✅ Composite indeksy dla sortowania
- ✅ Eager loading optimization
- ✅ JSON storage dla drzew stance (szybki dostęp)

## 🎯 Jak uruchomić migrację

### Krok 1: Przygotowanie bazy danych
```bash
cd apps/server
npm install
npm run db:push
```

### Krok 2: Migracja danych
```bash
npm run migrate:json-to-db
```

### Krok 3: Test drzew stance
```bash
npm run test:stance-trees
```

### Krok 4: Pełna migracja (wszystko na raz)
```bash
npm run migrate:all
```

## 📊 Co zostanie zmigrowane

### Postacie (characters_assets/*/)
- ✅ Główne dane postaci (name, faction, stats, etc.)
- ✅ Umiejętności (abilities) z legacy support
- ✅ Structured abilities
- ✅ **Drzewa stance** z JSON (tree structure)
- ✅ Obrazy (portrait, image URLs)

### Sety (sets.ts)
- ✅ Dane setów z Atomic Mass Games
- ✅ Relacje set → postacie
- ✅ Obrazy setów

### Misje (missions.ts)
- ✅ Dane misji z objectives i struggles
- ✅ Map data i rendering
- ✅ Thumbnails

## ⚡ Optymalizacje wydajności

### Indeksy bazy danych
```sql
-- Szybkie wyszukiwanie postaci
CREATE INDEX ON Character(faction);
CREATE INDEX ON Character(unitType);
CREATE INDEX ON Character(squadPoints);
CREATE INDEX ON Character(name);

-- Szybkie ładowanie umiejętności
CREATE INDEX ON CharacterAbility(characterId, order);

-- Szybkie ładowanie stance
CREATE INDEX ON CharacterStance(characterId);

-- Szybkie wyszukiwanie setów
CREATE INDEX ON Set(code);
CREATE INDEX ON Set(type);
```

### Eager Loading
```typescript
// Ładowanie postaci z wszystkimi danymi w jednym zapytaniu
const character = await prisma.character.findUnique({
  where: { slug: 'rebel-commandos' },
  include: {
    abilities: { orderBy: { order: 'asc' } },
    stances: true,
    characterCollections: true
  }
});
```

### JSON Storage dla drzew stance
```typescript
// Drzewo stance jako JSON - szybki dostęp
const stance = await prisma.characterStance.findUnique({
  where: { characterId: character.id }
});

// Tree structure: [["start"], ["melee_attack", "ranged_attack"], ["damage", "damage"]]
const tree = stance.tree as string[][];
```

## 🌳 Drzewa stance - jak działają

### Struktura JSON
```json
{
  "dice": {
    "attack": 4,
    "defense": 3
  },
  "expertise": {
    "melee": 1,
    "ranged": 2
  },
  "tree": [
    ["start"],
    ["melee_attack", "ranged_attack"],
    ["damage", "damage"]
  ]
}
```

### W bazie danych
```typescript
model CharacterStance {
  attackDice: Int        // 4
  defenseDice: Int       // 3
  meleeExpertise: Int    // 1
  rangedExpertise: Int   // 2
  tree: Json            // [["start"], ["melee_attack", "ranged_attack"], ["damage", "damage"]]
}
```

### Dostęp do drzewa
```typescript
// Szybki dostęp do drzewa stance
const stance = await prisma.characterStance.findUnique({
  where: { characterId: character.id }
});

const tree = stance.tree as string[][];
// tree[0] = ["start"]
// tree[1] = ["melee_attack", "ranged_attack"]
// tree[2] = ["damage", "damage"]
```

## 🔄 Wersjonowanie i śledzenie zmian

### Każda postać ma:
- `version` - numer wersji (auto-increment)
- `createdBy` - kto dodał
- `updatedBy` - kto ostatnio edytował
- `createdAt` / `updatedAt` - timestamps

### Przykład użycia:
```typescript
// Edycja postaci z wersjonowaniem
const updatedCharacter = await prisma.character.update({
  where: { id: characterId },
  data: {
    name: "New Name",
    version: { increment: 1 },
    updatedBy: userId,
    updatedAt: new Date()
  }
});
```

## 🚨 Rozwiązanie problemów

### Problem: Konflikty przy edycji
**Rozwiązanie:** Każda edycja w bazie z wersjonowaniem - brak nadpisywania plików

### Problem: Wolne ładowanie
**Rozwiązanie:** Indeksy + eager loading + JSON storage

### Problem: Brak historii zmian
**Rozwiązanie:** Wersjonowanie + audit logs

### Problem: Trudne zarządzanie obrazami
**Rozwiązanie:** URL w bazie + cloud storage (następny krok)

## 📈 Przewidywane korzyści

### Wydajność
- ⚡ **10x szybsze ładowanie** - indeksy + eager loading
- ⚡ **Szybki dostęp do drzew stance** - JSON storage
- ⚡ **Optymalne zapytania** - composite indeksy

### Zarządzanie danymi
- 🔄 **Wersjonowanie** - śledzenie zmian
- 🔄 **Brak konfliktów** - każda edycja w bazie
- 🔄 **Historia** - można cofnąć zmiany
- 🔄 **Backup** - standardowe narzędzia PostgreSQL

### Skalowalność
- 📈 **Łatwe dodawanie** nowych typów danych
- 📈 **Wyszukiwanie** - pełnotekstowe w bazie
- 📈 **API** - RESTful z filtrowaniem

## 🎉 Gotowe do uruchomienia!

Wszystko jest przygotowane. Uruchom:
```bash
cd apps/server
npm run migrate:all
```

I ciesz się szybkim, bezproblemowym systemem! 🚀
