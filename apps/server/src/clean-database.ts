import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log('🧹 Cleaning database for migration...');
    
    // Delete all data from tables that will have new foreign key constraints
    console.log('🗑️ Deleting CharacterCollection data...');
    await prisma.$executeRaw`DELETE FROM "CharacterCollection"`;
    
    console.log('🗑️ Deleting SetCollection data...');
    await prisma.$executeRaw`DELETE FROM "SetCollection"`;
    
    console.log('🗑️ Deleting MissionCollection data...');
    await prisma.$executeRaw`DELETE FROM "MissionCollection"`;
    
    console.log('🗑️ Deleting StrikeTeamCharacter data...');
    await prisma.$executeRaw`DELETE FROM "StrikeTeamCharacter"`;
    
    console.log('🗑️ Deleting StrikeTeam data...');
    await prisma.$executeRaw`DELETE FROM "StrikeTeam"`;
    
    // Clear new tables if they have any data
    console.log('🗑️ Clearing new tables...');
    await prisma.$executeRaw`DELETE FROM "CharacterStance"`;
    await prisma.$executeRaw`DELETE FROM "CharacterAbility"`;
    await prisma.$executeRaw`DELETE FROM "Character"`;
    await prisma.$executeRaw`DELETE FROM "SetCharacter"`;
    await prisma.$executeRaw`DELETE FROM "Set"`;
    await prisma.$executeRaw`DELETE FROM "MissionObjective"`;
    await prisma.$executeRaw`DELETE FROM "MissionStruggle"`;
    await prisma.$executeRaw`DELETE FROM "Mission"`;
    
    console.log('✅ Database cleaned successfully!');
    console.log('🚀 Now you can run: npm run db:push');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
