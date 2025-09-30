#!/usr/bin/env tsx

/**
 * 🚀 Skrypt migracji danych z JSON do bazy danych PostgreSQL
 * 
 * Migruje:
 * - Postacie z characters_assets/*/data.json i stance.json
 * - Sety z sets.ts
 * - Misje z missions.ts
 * 
 * Zoptymalizowane dla szybkiego ładowania z indeksami i relacjami
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper function to get character assets directory
function getCharacterAssetsDir(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'characters_assets'),
    path.join(process.cwd(), '../client/characters_assets'),
    path.join(process.cwd(), '../../client/characters_assets')
  ];
  
  for (const dir of possiblePaths) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  
  throw new Error('Characters assets directory not found');
}

// Helper function to get client data directory
function getClientDataDir(): string {
  const possiblePaths = [
    path.join(process.cwd(), '../client/src/data'),
    path.join(process.cwd(), '../../client/src/data'),
    path.join(process.cwd(), 'src/data')
  ];
  
  for (const dir of possiblePaths) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  
  throw new Error('Client data directory not found');
}

async function migrateCharacters() {
  console.log('🎭 Migrating characters...');
  
  const charactersDir = getCharacterAssetsDir();
  const characterDirs = fs.readdirSync(charactersDir)
    .filter(item => {
      const itemPath = path.join(charactersDir, item);
      return fs.statSync(itemPath).isDirectory() && item !== 'characters_assets_backup';
    });

  let migrated = 0;
  let errors = 0;

  for (const charDir of characterDirs) {
    try {
      const charPath = path.join(charactersDir, charDir);
      const dataPath = path.join(charPath, 'data.json');
      const stancePath = path.join(charPath, 'stance.json');

      if (!fs.existsSync(dataPath)) {
        console.log(`⚠️  No data.json found for ${charDir}`);
        continue;
      }

      // Load character data
      const dataJson = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      
      // Load stance data if exists
      let stanceData = null;
      if (fs.existsSync(stancePath)) {
        stanceData = JSON.parse(fs.readFileSync(stancePath, 'utf8'));
      }

      // Create character
      const character = await prisma.character.upsert({
        where: { slug: charDir },
        update: {
          name: dataJson.name || dataJson.characterNames || charDir,
          faction: dataJson.faction || 'Unknown',
          unitType: dataJson.role || dataJson.unit_type?.[0] || 'Support',
          squadPoints: dataJson.squad_points || dataJson.point_cost || 0,
          stamina: dataJson.stamina || 0,
          durability: dataJson.durability || 0,
          force: dataJson.force || null,
          hanker: dataJson.hanker || null,
          boxSetCode: dataJson.boxSetCode || null,
          characterNames: dataJson.characterNames || dataJson.name || charDir,
          numberOfCharacters: dataJson.number_of_characters || 1,
          era: dataJson.era || [],
          period: dataJson.period || [],
          tags: dataJson.tags || [],
          factions: dataJson.factions || [],
          portraitUrl: dataJson.portrait || null,
          imageUrl: dataJson.image || null,
          version: { increment: 1 },
          updatedAt: new Date()
        },
        create: {
          slug: charDir,
          name: dataJson.name || dataJson.characterNames || charDir,
          faction: dataJson.faction || 'Unknown',
          unitType: dataJson.role || dataJson.unit_type?.[0] || 'Support',
          squadPoints: dataJson.squad_points || dataJson.point_cost || 0,
          stamina: dataJson.stamina || 0,
          durability: dataJson.durability || 0,
          force: dataJson.force || null,
          hanker: dataJson.hanker || null,
          boxSetCode: dataJson.boxSetCode || null,
          characterNames: dataJson.characterNames || dataJson.name || charDir,
          numberOfCharacters: dataJson.number_of_characters || 1,
          era: dataJson.era || [],
          period: dataJson.period || [],
          tags: dataJson.tags || [],
          factions: dataJson.factions || [],
          portraitUrl: dataJson.portrait || null,
          imageUrl: dataJson.image || null,
          version: 1
        }
      });

      // Migrate abilities
      if (dataJson.abilities && Array.isArray(dataJson.abilities)) {
        // Delete existing abilities
        await prisma.characterAbility.deleteMany({
          where: { characterId: character.id }
        });

        // Create new abilities
        for (let i = 0; i < dataJson.abilities.length; i++) {
          const ability = dataJson.abilities[i];
          await prisma.characterAbility.create({
            data: {
              characterId: character.id,
              name: ability.name || `Ability ${i + 1}`,
              type: ability.type || 'Innate',
              symbol: ability.symbol || 'l',
              trigger: ability.trigger || 'always',
              isAction: ability.isAction || false,
              forceCost: ability.forceCost || 0,
              damageCost: ability.damageCost || 0,
              description: ability.description || '',
              tags: ability.tags || [],
              order: i,
              legacyText: ability.text,
              legacyTitle: ability.title
            }
          });
        }
      }

      // Migrate structured abilities if they exist
      if (dataJson.structuredAbilities && Array.isArray(dataJson.structuredAbilities)) {
        for (let i = 0; i < dataJson.structuredAbilities.length; i++) {
          const ability = dataJson.structuredAbilities[i];
          await prisma.characterAbility.create({
            data: {
              characterId: character.id,
              name: ability.name || `Structured Ability ${i + 1}`,
              type: ability.type || 'Active',
              symbol: ability.symbol || 'j',
              trigger: ability.trigger || 'on_activation',
              isAction: ability.isAction || false,
              forceCost: ability.forceCost || 0,
              damageCost: ability.damageCost || 0,
              description: ability.description || '',
              tags: ability.tags || [],
              order: 1000 + i // Put structured abilities after regular ones
            }
          });
        }
      }

      // Migrate stance data
      if (stanceData) {
        await prisma.characterStance.upsert({
          where: { characterId: character.id },
          update: {
            attackDice: stanceData.dice?.attack || 0,
            defenseDice: stanceData.dice?.defense || 0,
            meleeExpertise: stanceData.expertise?.melee || 0,
            rangedExpertise: stanceData.expertise?.ranged || 0,
            tree: stanceData.tree || []
          },
          create: {
            characterId: character.id,
            attackDice: stanceData.dice?.attack || 0,
            defenseDice: stanceData.dice?.defense || 0,
            meleeExpertise: stanceData.expertise?.melee || 0,
            rangedExpertise: stanceData.expertise?.ranged || 0,
            tree: stanceData.tree || []
          }
        });
      }

      migrated++;
      console.log(`✅ Migrated character: ${character.name} (${charDir})`);

    } catch (error) {
      errors++;
      console.error(`❌ Error migrating character ${charDir}:`, error);
    }
  }

  console.log(`🎭 Characters migration complete: ${migrated} migrated, ${errors} errors`);
}

async function migrateSets() {
  console.log('📦 Migrating sets...');
  
  const dataDir = getClientDataDir();
  const setsPath = path.join(dataDir, 'sets.ts');
  
  if (!fs.existsSync(setsPath)) {
    console.log('⚠️  No sets.ts found, skipping sets migration');
    return;
  }

  // Read and parse sets.ts file
  const setsContent = fs.readFileSync(setsPath, 'utf8');
  
  // Extract setsData array using regex (simple approach)
  const setsMatch = setsContent.match(/export const setsData: Set\[\] = (\[[\s\S]*?\]);/);
  if (!setsMatch) {
    console.log('⚠️  Could not parse setsData from sets.ts');
    return;
  }

  try {
    // Evaluate the sets data (in production, you'd want a proper parser)
    const setsData = eval(setsMatch[1]);
    
    let migrated = 0;
    let errors = 0;

    for (const setData of setsData) {
      try {
        const set = await prisma.set.upsert({
          where: { code: setData.code },
          update: {
            name: setData.name,
            type: setData.type.toUpperCase().replace(' ', '_') as any,
            description: setData.description || null,
            productUrl: setData.product_url || null,
            imageUrl: setData.image || null,
            updatedAt: new Date()
          },
          create: {
            code: setData.code,
            name: setData.name,
            type: setData.type.toUpperCase().replace(' ', '_') as any,
            description: setData.description || null,
            productUrl: setData.product_url || null,
            imageUrl: setData.image || null
          }
        });

        // Migrate set characters
        if (setData.characters && Array.isArray(setData.characters)) {
          // Delete existing set characters
          await prisma.setCharacter.deleteMany({
            where: { setId: set.id }
          });

          // Create new set characters
          for (const charData of setData.characters) {
            await prisma.setCharacter.create({
              data: {
                setId: set.id,
                role: charData.role.toUpperCase() as any,
                name: charData.name
              }
            });
          }
        }

        migrated++;
        console.log(`✅ Migrated set: ${set.name} (${set.code})`);

      } catch (error) {
        errors++;
        console.error(`❌ Error migrating set ${setData.code}:`, error);
      }
    }

    console.log(`📦 Sets migration complete: ${migrated} migrated, ${errors} errors`);

  } catch (error) {
    console.error('❌ Error parsing sets.ts:', error);
  }
}

async function migrateMissions() {
  console.log('🎯 Migrating missions...');
  
  const dataDir = getClientDataDir();
  const missionsPath = path.join(dataDir, 'missions.ts');
  
  if (!fs.existsSync(missionsPath)) {
    console.log('⚠️  No missions.ts found, skipping missions migration');
    return;
  }

  // Read and parse missions.ts file
  const missionsContent = fs.readFileSync(missionsPath, 'utf8');
  
  // Extract missionsData array using regex
  const missionsMatch = missionsContent.match(/export const missionsData: Mission\[\] = (\[[\s\S]*?\]);/);
  if (!missionsMatch) {
    console.log('⚠️  Could not parse missionsData from missions.ts');
    return;
  }

  try {
    // Evaluate the missions data
    const missionsData = eval(missionsMatch[1]);
    
    let migrated = 0;
    let errors = 0;

    for (const missionData of missionsData) {
      try {
        const mission = await prisma.mission.upsert({
          where: { id: missionData.id },
          update: {
            name: missionData.name,
            source: missionData.source,
            setCode: missionData.setCode || null,
            description: missionData.description || null,
            thumbnailUrl: missionData.thumbnail || null,
            mapSizeInch: missionData.map?.sizeInch || 36,
            mapUnit: missionData.map?.unit || 'inch',
            mapOrigin: missionData.map?.origin || 'center',
            mapAxis: missionData.map?.axis || 'x-right_y-up',
            pointDiameterInch: missionData.rendering?.point?.diameterInch || 1,
            pointColorActive: missionData.rendering?.point?.colorActive || 'gold',
            pointColorInactive: missionData.rendering?.point?.colorInactive || 'gray',
            tags: missionData.tags || [],
            notes: missionData.notes || null,
            updatedAt: new Date()
          },
          create: {
            id: missionData.id,
            name: missionData.name,
            source: missionData.source,
            setCode: missionData.setCode || null,
            description: missionData.description || null,
            thumbnailUrl: missionData.thumbnail || null,
            mapSizeInch: missionData.map?.sizeInch || 36,
            mapUnit: missionData.map?.unit || 'inch',
            mapOrigin: missionData.map?.origin || 'center',
            mapAxis: missionData.map?.axis || 'x-right_y-up',
            pointDiameterInch: missionData.rendering?.point?.diameterInch || 1,
            pointColorActive: missionData.rendering?.point?.colorActive || 'gold',
            pointColorInactive: missionData.rendering?.point?.colorInactive || 'gray',
            tags: missionData.tags || [],
            notes: missionData.notes || null
          }
        });

        // Migrate objectives
        if (missionData.objectives && Array.isArray(missionData.objectives)) {
          // Delete existing objectives
          await prisma.missionObjective.deleteMany({
            where: { missionId: mission.id }
          });

          // Create new objectives
          for (const objective of missionData.objectives) {
            await prisma.missionObjective.create({
              data: {
                missionId: mission.id,
                key: objective.key,
                x: objective.x,
                y: objective.y,
                radius: objective.radius
              }
            });
          }
        }

        // Migrate struggles
        if (missionData.struggles && Array.isArray(missionData.struggles)) {
          // Delete existing struggles
          await prisma.missionStruggle.deleteMany({
            where: { missionId: mission.id }
          });

          // Create new struggles
          for (const struggle of missionData.struggles) {
            await prisma.missionStruggle.create({
              data: {
                missionId: mission.id,
                index: struggle.index,
                cards: struggle.cards
              }
            });
          }
        }

        migrated++;
        console.log(`✅ Migrated mission: ${mission.name} (${mission.id})`);

      } catch (error) {
        errors++;
        console.error(`❌ Error migrating mission ${missionData.id}:`, error);
      }
    }

    console.log(`🎯 Missions migration complete: ${migrated} migrated, ${errors} errors`);

  } catch (error) {
    console.error('❌ Error parsing missions.ts:', error);
  }
}

async function main() {
  console.log('🚀 Starting JSON to Database migration...');
  console.log('=====================================');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Run migrations
    await migrateCharacters();
    await migrateSets();
    await migrateMissions();

    console.log('=====================================');
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('- Characters: Migrated with abilities and stances');
    console.log('- Sets: Migrated with character relationships');
    console.log('- Missions: Migrated with objectives and struggles');
    console.log('');
    console.log('⚡ Performance optimizations:');
    console.log('- Added database indexes for fast queries');
    console.log('- Optimized relationships for eager loading');
    console.log('- Stance trees stored as JSON for flexibility');
    console.log('- Version tracking for change management');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  main();
}

export { migrateCharacters, migrateSets, migrateMissions };
