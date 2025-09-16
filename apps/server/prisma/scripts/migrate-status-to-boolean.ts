import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateStatusToBoolean() {
  console.log('Starting migration of status fields to boolean fields...');
  
  try {
    // Migrate CharacterCollection data
    console.log('Migrating CharacterCollection data...');
    
    // Get all character collections that might have old status data
    const characterCollections = await prisma.characterCollection.findMany({
      where: {
        OR: [
          { isOwned: false, isPainted: false, isWishlist: false, isSold: false, isFavorite: false }
        ]
      }
    });
    
    console.log(`Found ${characterCollections.length} character collections to migrate`);
    
    // For now, let's set all existing collections as OWNED since they were in the database
    for (const collection of characterCollections) {
      await prisma.characterCollection.update({
        where: { id: collection.id },
        data: {
          isOwned: true,
          isPainted: false,
          isWishlist: false,
          isSold: false,
          isFavorite: false
        }
      });
    }
    
    // Migrate SetCollection data
    console.log('Migrating SetCollection data...');
    
    const setCollections = await prisma.setCollection.findMany({
      where: {
        OR: [
          { isOwned: false, isPainted: false, isWishlist: false, isSold: false, isFavorite: false }
        ]
      }
    });
    
    console.log(`Found ${setCollections.length} set collections to migrate`);
    
    // For now, let's set all existing collections as OWNED since they were in the database
    for (const collection of setCollections) {
      await prisma.setCollection.update({
        where: { id: collection.id },
        data: {
          isOwned: true,
          isPainted: false,
          isWishlist: false,
          isSold: false,
          isFavorite: false
        }
      });
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateStatusToBoolean()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
