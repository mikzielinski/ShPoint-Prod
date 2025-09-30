# 🗄️ Plan migracji danych do bazy danych

## Obecny problem
- Dane postaci w plikach JSON powodują konflikty przy jednoczesnych edycjach
- Brak wersjonowania i historii zmian
- Trudne zarządzanie obrazami

## Rozwiązanie: Kompletna migracja do PostgreSQL

### 1. Nowe tabele w schema.prisma

#### Character (główne dane postaci)
```prisma
model Character {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  faction           String
  unitType          String   // Primary, Secondary, Support
  squadPoints       Int
  stamina           Int
  durability        Int
  force             Int?
  hanker            Int?
  boxSetCode        String?
  characterNames    String
  numberOfCharacters Int     @default(1)
  
  // Era i okresy
  era               String[]
  period            String[]
  tags              String[]
  factions          String[]
  
  // Obrazy
  portraitUrl       String?
  imageUrl          String?
  
  // Relacje
  abilities         CharacterAbility[]
  stances           CharacterStance[]
  characterCollections CharacterCollection[]
  strikeTeamCharacters StrikeTeamCharacter[]
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdBy         String?  // ID użytkownika który dodał
  updatedBy         String?  // ID użytkownika który ostatnio edytował
  version           Int      @default(1)
  isActive          Boolean  @default(true)
  
  @@index([faction])
  @@index([unitType])
  @@index([boxSetCode])
  @@index([isActive])
}
```

#### CharacterAbility (umiejętności postaci)
```prisma
model CharacterAbility {
  id            String   @id @default(cuid())
  characterId   String
  character     Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  
  name          String
  type          String   // Active, Reactive, Innate
  symbol        String
  trigger       String
  isAction      Boolean  @default(false)
  forceCost     Int      @default(0)
  damageCost    Int      @default(0)
  description   String
  tags          String[]
  
  // Legacy support
  legacyText    String?
  legacyTitle   String?
  
  // Metadata
  order         Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([characterId])
  @@index([type])
}
```

#### CharacterStance (stance postaci)
```prisma
model CharacterStance {
  id            String   @id @default(cuid())
  characterId   String
  character     Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  
  // Dice data
  attackDice    Int
  defenseDice   Int
  
  // Expertise
  meleeExpertise Int
  rangedExpertise Int
  
  // Tree structure (JSON)
  tree          Json     // Array of arrays representing stance tree
  
  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([characterId])
}
```

#### Set (sety/boxy)
```prisma
model Set {
  id            String   @id @default(cuid())
  name          String
  code          String   @unique // SWP01, SWP03, etc.
  type          SetType
  description   String?
  productUrl    String?
  imageUrl      String?
  
  // Relacje
  characters    SetCharacter[]
  setCollections SetCollection[]
  
  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  isActive      Boolean  @default(true)
  
  @@index([code])
  @@index([type])
  @@index([isActive])
}

enum SetType {
  CORE_SET
  SQUAD_PACK
  TERRAIN_PACK
  DUEL_PACK
  MISSION_PACK
  ACCESSORIES
}
```

#### SetCharacter (postacie w setach)
```prisma
model SetCharacter {
  id            String   @id @default(cuid())
  setId         String
  set           Set      @relation(fields: [setId], references: [id], onDelete: Cascade)
  characterId   String?  // Może być null jeśli postać nie istnieje jeszcze
  character     Character? @relation(fields: [characterId], references: [id])
  
  role          CharacterRole // Primary, Secondary, Supporting
  name          String        // Nazwa postaci w kontekście setu
  
  @@unique([setId, characterId])
  @@index([setId])
  @@index([characterId])
}
```

#### Mission (misje)
```prisma
model Mission {
  id            String   @id @default(cuid())
  name          String
  source        String   // official, custom
  setCode       String?
  description   String?
  thumbnailUrl  String?
  
  // Map data
  mapSizeInch   Int
  mapUnit       String
  mapOrigin     String
  mapAxis       String
  
  // Rendering data
  pointDiameterInch Float
  pointColorActive  String
  pointColorInactive String
  
  // Relacje
  objectives    MissionObjective[]
  struggles     MissionStruggle[]
  missionCollections MissionCollection[]
  
  // Metadata
  tags          String[]
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  isActive      Boolean  @default(true)
  
  @@index([source])
  @@index([setCode])
  @@index([isActive])
}
```

#### MissionObjective (cele misji)
```prisma
model MissionObjective {
  id            String   @id @default(cuid())
  missionId     String
  mission       Mission  @relation(fields: [missionId], references: [id], onDelete: Cascade)
  
  key           String   // A, B, C, etc.
  x             Float
  y             Float
  radius        Float
  
  @@index([missionId])
}
```

#### MissionStruggle (struggles w misjach)
```prisma
model MissionStruggle {
  id            String   @id @default(cuid())
  missionId     String
  mission       Mission  @relation(fields: [missionId], references: [id], onDelete: Cascade)
  
  index         Int      // 1, 2, 3
  cards         Json     // Array of struggle cards
  
  @@index([missionId])
  @@index([index])
}
```

### 2. System przechowywania obrazów

#### Opcja A: Cloud Storage (ZALECANA)
- **AWS S3** lub **Cloudinary**
- Obrazy przechowywane w chmurze
- URL w bazie danych
- Automatyczne resize i optymalizacja
- CDN dla szybkiego ładowania

#### Opcja B: Local Storage z CDN
- Obrazy w `/public/uploads/`
- Struktura: `/uploads/characters/{id}/portrait.png`
- URL w bazie: `/uploads/characters/{id}/portrait.png`

#### Opcja C: Hybrid (obecna + nowa)
- Zachować obecne obrazy w `/public/`
- Nowe obrazy w cloud storage
- Migracja stopniowa

### 3. Strategia migracji

#### Faza 1: Przygotowanie
1. Dodanie nowych tabel do schema.prisma
2. Migracja bazy danych
3. Backup obecnych danych JSON

#### Faza 2: Migracja danych
1. **Postacie**: Skrypt migrujący JSON → baza
2. **Sety**: Migracja z sets.ts → baza
3. **Misje**: Migracja z missions.ts → baza
4. **Obrazy**: Upload do cloud storage

#### Faza 3: Aktualizacja API
1. Nowe endpointy dla bazy danych
2. Zachowanie kompatybilności z obecnymi
3. Stopniowe przełączanie frontendu

#### Faza 4: Cleanup
1. Usunięcie starych plików JSON
2. Aktualizacja dokumentacji
3. Testy i optymalizacja

### 4. Korzyści

✅ **Rozwiązanie konfliktów** - każda edycja w bazie z wersjonowaniem
✅ **Historia zmian** - śledzenie kto i kiedy edytował
✅ **Lepsze zarządzanie obrazami** - cloud storage z CDN
✅ **Skalowalność** - łatwe dodawanie nowych typów danych
✅ **Backup i recovery** - standardowe narzędzia PostgreSQL
✅ **Wyszukiwanie** - pełnotekstowe wyszukiwanie w bazie
✅ **API** - RESTful API z filtrowaniem i sortowaniem

### 5. Timeline

- **Tydzień 1**: Przygotowanie schema i migracja bazy
- **Tydzień 2**: Skrypty migracji danych
- **Tydzień 3**: Aktualizacja API i testy
- **Tydzień 4**: Migracja obrazów i cleanup

Czy chcesz żebym zaczął implementację tego planu?
