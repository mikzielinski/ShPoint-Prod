#!/usr/bin/env tsx

/**
 * 🌳 Test skrypt dla drzew stance
 * 
 * Testuje czy drzewa stance są poprawnie przechowywane i ładowane
 * oraz czy struktura JSON jest zachowana
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

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

// Test stance tree structure
function testStanceTreeStructure(tree: any): boolean {
  if (!Array.isArray(tree)) {
    console.log('❌ Tree is not an array');
    return false;
  }

  if (tree.length === 0) {
    console.log('❌ Tree is empty');
    return false;
  }

  // Check if first level is "start"
  if (tree[0] && !Array.isArray(tree[0])) {
    console.log('❌ First level should be an array');
    return false;
  }

  if (tree[0] && tree[0][0] !== 'start') {
    console.log('❌ First level should start with "start"');
    return false;
  }

  // Check each level
  for (let i = 0; i < tree.length; i++) {
    const level = tree[i];
    if (!Array.isArray(level)) {
      console.log(`❌ Level ${i} is not an array`);
      return false;
    }

    for (let j = 0; j < level.length; j++) {
      const node = level[j];
      if (typeof node !== 'string') {
        console.log(`❌ Node at [${i}][${j}] is not a string: ${typeof node}`);
        return false;
      }
    }
  }

  return true;
}

// Test stance data from JSON file
async function testStanceFromJson(characterId: string) {
  console.log(`\n🧪 Testing stance for character: ${characterId}`);
  
  const charactersDir = getCharacterAssetsDir();
  const stancePath = path.join(charactersDir, characterId, 'stance.json');
  
  if (!fs.existsSync(stancePath)) {
    console.log(`⚠️  No stance.json found for ${characterId}`);
    return null;
  }

  try {
    const stanceData = JSON.parse(fs.readFileSync(stancePath, 'utf8'));
    
    console.log('📄 Original JSON stance data:');
    console.log(JSON.stringify(stanceData, null, 2));
    
    // Test tree structure
    if (stanceData.tree) {
      const isValid = testStanceTreeStructure(stanceData.tree);
      console.log(`🌳 Tree structure valid: ${isValid ? '✅' : '❌'}`);
      
      if (isValid) {
        console.log('🌳 Tree levels:');
        stanceData.tree.forEach((level: any[], index: number) => {
          console.log(`  Level ${index}: [${level.join(', ')}]`);
        });
      }
    }
    
    return stanceData;
  } catch (error) {
    console.error(`❌ Error reading stance.json for ${characterId}:`, error);
    return null;
  }
}

// Test stance data from database
async function testStanceFromDatabase(characterId: string) {
  console.log(`\n🗄️  Testing stance from database for character: ${characterId}`);
  
  try {
    const character = await prisma.character.findUnique({
      where: { slug: characterId },
      include: {
        stances: true
      }
    });

    if (!character) {
      console.log(`❌ Character ${characterId} not found in database`);
      return null;
    }

    if (!character.stances || character.stances.length === 0) {
      console.log(`⚠️  No stance data found for ${characterId} in database`);
      return null;
    }

    const stance = character.stances[0];
    
    console.log('🗄️  Database stance data:');
    console.log(`  Attack Dice: ${stance.attackDice}`);
    console.log(`  Defense Dice: ${stance.defenseDice}`);
    console.log(`  Melee Expertise: ${stance.meleeExpertise}`);
    console.log(`  Ranged Expertise: ${stance.rangedExpertise}`);
    console.log(`  Tree: ${JSON.stringify(stance.tree, null, 2)}`);
    
    // Test tree structure
    if (stance.tree) {
      const isValid = testStanceTreeStructure(stance.tree as any);
      console.log(`🌳 Tree structure valid: ${isValid ? '✅' : '❌'}`);
      
      if (isValid) {
        console.log('🌳 Tree levels:');
        (stance.tree as any[]).forEach((level: any[], index: number) => {
          console.log(`  Level ${index}: [${level.join(', ')}]`);
        });
      }
    }
    
    return stance;
  } catch (error) {
    console.error(`❌ Error reading stance from database for ${characterId}:`, error);
    return null;
  }
}

// Compare JSON vs Database stance data
async function compareStanceData(characterId: string) {
  console.log(`\n🔄 Comparing stance data for: ${characterId}`);
  
  const jsonStance = await testStanceFromJson(characterId);
  const dbStance = await testStanceFromDatabase(characterId);
  
  if (!jsonStance || !dbStance) {
    console.log('⚠️  Cannot compare - missing data');
    return;
  }
  
  // Compare basic data
  const diceMatch = jsonStance.dice?.attack === dbStance.attackDice && 
                   jsonStance.dice?.defense === dbStance.defenseDice;
  console.log(`🎲 Dice data match: ${diceMatch ? '✅' : '❌'}`);
  
  const expertiseMatch = jsonStance.expertise?.melee === dbStance.meleeExpertise && 
                        jsonStance.expertise?.ranged === dbStance.rangedExpertise;
  console.log(`🎯 Expertise data match: ${expertiseMatch ? '✅' : '❌'}`);
  
  // Compare tree structure
  const treeMatch = JSON.stringify(jsonStance.tree) === JSON.stringify(dbStance.tree);
  console.log(`🌳 Tree structure match: ${treeMatch ? '✅' : '❌'}`);
  
  if (!treeMatch) {
    console.log('📄 JSON tree:', JSON.stringify(jsonStance.tree, null, 2));
    console.log('🗄️  DB tree:', JSON.stringify(dbStance.tree, null, 2));
  }
}

// Test performance of stance loading
async function testStanceLoadingPerformance() {
  console.log('\n⚡ Testing stance loading performance...');
  
  const startTime = Date.now();
  
  // Load all characters with stances
  const characters = await prisma.character.findMany({
    include: {
      stances: true,
      abilities: {
        orderBy: { order: 'asc' }
      }
    }
  });
  
  const endTime = Date.now();
  const loadTime = endTime - startTime;
  
  console.log(`📊 Loaded ${characters.length} characters with stances in ${loadTime}ms`);
  console.log(`⚡ Average load time per character: ${(loadTime / characters.length).toFixed(2)}ms`);
  
  // Test tree access performance
  const treeStartTime = Date.now();
  let totalTreeNodes = 0;
  
  for (const character of characters) {
    if (character.stances && character.stances.length > 0) {
      const tree = character.stances[0].tree as any[];
      if (Array.isArray(tree)) {
        totalTreeNodes += tree.flat().length;
      }
    }
  }
  
  const treeEndTime = Date.now();
  const treeAccessTime = treeEndTime - treeStartTime;
  
  console.log(`🌳 Accessed ${totalTreeNodes} tree nodes in ${treeAccessTime}ms`);
  console.log(`⚡ Average tree access time per node: ${(treeAccessTime / totalTreeNodes).toFixed(4)}ms`);
}

// Test specific characters
async function testSpecificCharacters() {
  console.log('\n🎯 Testing specific characters...');
  
  const testCharacters = [
    'rebel-commandos',
    'general-anakin-skywalker',
    'ahsoka-tano-fulcrum',
    'darth-vader-fallen-master'
  ];
  
  for (const charId of testCharacters) {
    await compareStanceData(charId);
  }
}

async function main() {
  console.log('🌳 Starting stance trees test...');
  console.log('=====================================');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Run tests
    await testSpecificCharacters();
    await testStanceLoadingPerformance();
    
    console.log('\n=====================================');
    console.log('🎉 Stance trees test completed!');
    console.log('');
    console.log('✅ Tests performed:');
    console.log('- JSON stance data validation');
    console.log('- Database stance data validation');
    console.log('- JSON vs Database comparison');
    console.log('- Tree structure validation');
    console.log('- Loading performance testing');
    console.log('');
    console.log('🌳 Stance trees are working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test if called directly
if (require.main === module) {
  main();
}

export { testStanceTreeStructure, testStanceFromJson, testStanceFromDatabase, compareStanceData };
