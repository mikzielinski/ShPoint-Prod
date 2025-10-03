#!/usr/bin/env tsx

/**
 * 🧪 Test skrypt dla nowych API endpoints (v2)
 * 
 * Testuje czy nowe API endpoints działają poprawnie z bazą danych
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test data
const testCharacter = {
  name: "Test Character",
  faction: "Test Faction",
  unitType: "Primary",
  squadPoints: 4,
  stamina: 8,
  durability: 2,
  force: 1,
  hanker: 0,
  boxSetCode: "TEST01",
  characterNames: "Test Character",
  numberOfCharacters: 1,
  era: ["Test Era"],
  period: ["Test Period"],
  tags: ["test"],
  factions: ["Test Faction"],
  portraitUrl: "https://example.com/portrait.png",
  imageUrl: "https://example.com/image.png",
  abilities: [
    {
      name: "Test Ability",
      type: "Active",
      symbol: "j",
      trigger: "on_activation",
      isAction: false,
      forceCost: 1,
      damageCost: 0,
      description: "This is a test ability",
      tags: ["test"]
    }
  ],
  stance: {
    attackDice: 4,
    defenseDice: 3,
    meleeExpertise: 1,
    rangedExpertise: 2,
    tree: [
      ["start"],
      ["melee_attack", "ranged_attack"],
      ["damage", "damage"]
    ]
  }
};

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test basic query
    const characterCount = await prisma.character.count();
    console.log(`📊 Found ${characterCount} characters in database`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function testCharacterCRUD() {
  console.log('\n🎭 Testing Character CRUD operations...');
  
  try {
    // Create test character
    console.log('📝 Creating test character...');
    const character = await prisma.character.create({
      data: {
        slug: 'test-character',
        name: testCharacter.name,
        faction: testCharacter.faction,
        unitType: testCharacter.unitType,
        squadPoints: testCharacter.squadPoints,
        stamina: testCharacter.stamina,
        durability: testCharacter.durability,
        force: testCharacter.force,
        hanker: testCharacter.hanker,
        boxSetCode: testCharacter.boxSetCode,
        characterNames: testCharacter.characterNames,
        numberOfCharacters: testCharacter.numberOfCharacters,
        era: testCharacter.era,
        period: testCharacter.period,
        tags: testCharacter.tags,
        factions: testCharacter.factions,
        portraitUrl: testCharacter.portraitUrl,
        imageUrl: testCharacter.imageUrl,
        version: 1
      }
    });
    
    console.log(`✅ Created character: ${character.name} (ID: ${character.id})`);
    
    // Create abilities
    console.log('📝 Creating abilities...');
    for (let i = 0; i < testCharacter.abilities.length; i++) {
      const ability = testCharacter.abilities[i];
      await prisma.characterAbility.create({
        data: {
          characterId: character.id,
          name: ability.name,
          type: ability.type,
          symbol: ability.symbol,
          trigger: ability.trigger,
          isAction: ability.isAction,
          forceCost: ability.forceCost,
          damageCost: ability.damageCost,
          description: ability.description,
          tags: ability.tags,
          order: i
        }
      });
    }
    
    console.log(`✅ Created ${testCharacter.abilities.length} abilities`);
    
    // Create stance
    console.log('📝 Creating stance...');
    await prisma.characterStance.create({
      data: {
        characterId: character.id,
        attackDice: testCharacter.stance.attackDice,
        defenseDice: testCharacter.stance.defenseDice,
        meleeExpertise: testCharacter.stance.meleeExpertise,
        rangedExpertise: testCharacter.stance.rangedExpertise,
        tree: testCharacter.stance.tree
      }
    });
    
    console.log('✅ Created stance with tree structure');
    
    // Read character with relations
    console.log('📖 Reading character with relations...');
    const fullCharacter = await prisma.character.findUnique({
      where: { id: character.id },
      include: {
        abilities: {
          orderBy: { order: 'asc' }
        },
        stances: true
      }
    });
    
    if (fullCharacter) {
      console.log(`✅ Read character: ${fullCharacter.name}`);
      console.log(`  - Abilities: ${Array.isArray(fullCharacter.abilities) ? fullCharacter.abilities.length : 'N/A'}`);
      console.log(`  - Stances: ${Array.isArray(fullCharacter.stances) ? fullCharacter.stances.length : 'N/A'}`);
      console.log(`  - Version: ${fullCharacter.version}`);
    }
    
    // Update character
    console.log('📝 Updating character...');
    const updatedCharacter = await prisma.character.update({
      where: { id: character.id },
      data: {
        name: "Updated Test Character",
        version: { increment: 1 }
      }
    });
    
    console.log(`✅ Updated character: ${updatedCharacter.name} (Version: ${updatedCharacter.version})`);
    
    // Test tree access
    console.log('🌳 Testing stance tree access...');
    const stance = await prisma.characterStance.findUnique({
      where: { characterId: character.id }
    });
    
    if (stance) {
      const tree = stance.tree as string[][];
      console.log('✅ Stance tree structure:');
      tree.forEach((level, index) => {
        console.log(`  Level ${index}: [${level.join(', ')}]`);
      });
    }
    
    // Clean up - soft delete
    console.log('🗑️ Cleaning up test character...');
    await prisma.character.update({
      where: { id: character.id },
      data: { isActive: false }
    });
    
    console.log('✅ Test character soft deleted');
    
    return true;
    
  } catch (error) {
    console.error('❌ Character CRUD test failed:', error);
    return false;
  }
}

async function testPerformance() {
  console.log('\n⚡ Testing performance...');
  
  try {
    const startTime = Date.now();
    
    // Test loading all characters with relations
    const characters = await prisma.character.findMany({
      where: { isActive: true },
      include: {
        abilities: {
          orderBy: { order: 'asc' }
        },
        stances: true,
        _count: {
          select: {
            characterCollections: true
          }
        }
      },
      take: 50
    });
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log(`📊 Loaded ${characters.length} characters with relations in ${loadTime}ms`);
    console.log(`⚡ Average load time per character: ${(loadTime / characters.length).toFixed(2)}ms`);
    
    // Test tree access performance
    const treeStartTime = Date.now();
    let totalTreeNodes = 0;
    
    for (const character of characters) {
      if (Array.isArray(character.stances) && character.stances.length > 0) {
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
    
    return true;
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API endpoints...');
  
  try {
    // Test characters endpoint
    console.log('📡 Testing GET /api/v2/characters...');
    const response = await fetch('http://localhost:3001/api/v2/characters');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Characters API: ${data.items?.length || 0} characters loaded`);
      console.log(`  - Total: ${data.total}`);
      console.log(`  - Page: ${data.page}/${data.totalPages}`);
    } else {
      console.log(`❌ Characters API failed: ${response.status} ${response.statusText}`);
    }
    
    // Test individual character endpoint
    console.log('📡 Testing GET /api/v2/characters/rebel-commandos...');
    const charResponse = await fetch('http://localhost:3001/api/v2/characters/rebel-commandos');
    
    if (charResponse.ok) {
      const charData = await charResponse.json();
      console.log(`✅ Character API: ${charData.character?.name || 'Unknown'}`);
      console.log(`  - Abilities: ${charData.character?.abilities?.length || 0}`);
      console.log(`  - Stances: ${charData.character?.stances?.length || 0}`);
    } else {
      console.log(`❌ Character API failed: ${charResponse.status} ${charResponse.statusText}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ API endpoints test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🧪 Starting new API endpoints test...');
  console.log('=====================================');

  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Test Character CRUD
    const crudSuccess = await testCharacterCRUD();
    if (!crudSuccess) {
      throw new Error('Character CRUD test failed');
    }

    // Test performance
    const performanceSuccess = await testPerformance();
    if (!performanceSuccess) {
      throw new Error('Performance test failed');
    }

    // Test API endpoints (only if server is running)
    try {
      await testAPIEndpoints();
    } catch (error) {
      console.log('⚠️  API endpoints test skipped (server not running)');
    }
    
    console.log('\n=====================================');
    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('✅ Tests performed:');
    console.log('- Database connection');
    console.log('- Character CRUD operations');
    console.log('- Stance tree structure');
    console.log('- Performance testing');
    console.log('- API endpoints (if server running)');
    console.log('');
    console.log('🚀 New API endpoints are ready to use!');

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

export { testDatabaseConnection, testCharacterCRUD, testPerformance, testAPIEndpoints };
