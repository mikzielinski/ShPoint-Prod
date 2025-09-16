import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCollections() {
  console.log('🔍 Checking collections in database...\n');
  
  try {
    // Check CharacterCollections
    console.log('📊 Character Collections:');
    const characterCollections = await prisma.characterCollection.findMany({
      take: 5, // Show first 5
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${characterCollections.length} character collections:`);
    characterCollections.forEach(collection => {
      console.log(`  - ${collection.characterId}: owned=${collection.isOwned}, painted=${collection.isPainted}, wishlist=${collection.isWishlist}, sold=${collection.isSold}, favorite=${collection.isFavorite}`);
    });
    
    // Check SetCollections
    console.log('\n📦 Set Collections:');
    const setCollections = await prisma.setCollection.findMany({
      take: 5, // Show first 5
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${setCollections.length} set collections:`);
    setCollections.forEach(collection => {
      console.log(`  - ${collection.setId}: owned=${collection.isOwned}, painted=${collection.isPainted}, wishlist=${collection.isWishlist}, sold=${collection.isSold}, favorite=${collection.isFavorite}`);
    });
    
    // Count totals
    const totalCharacters = await prisma.characterCollection.count();
    const totalSets = await prisma.setCollection.count();
    
    console.log(`\n📈 Totals:`);
    console.log(`  - Character Collections: ${totalCharacters}`);
    console.log(`  - Set Collections: ${totalSets}`);
    
  } catch (error) {
    console.error('❌ Error checking collections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCollections();
