import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDatabase() {
  try {
    console.log('🔍 Checking database state...');
    
    // Check what tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    console.log('📋 Existing tables:', tables);
    
    // Check CharacterCollection data
    try {
      const characterCollections = await prisma.$queryRaw`
        SELECT * FROM "CharacterCollection" LIMIT 5
      `;
      console.log('👥 CharacterCollection data:', characterCollections);
    } catch (e) {
      console.log('❌ CharacterCollection table not found or error:', e.message);
    }
    
    // Check if Character table exists
    try {
      const characters = await prisma.$queryRaw`
        SELECT * FROM "Character" LIMIT 5
      `;
      console.log('🎭 Character data:', characters);
    } catch (e) {
      console.log('❌ Character table not found or error:', e.message);
    }
    
    // Check foreign key constraints
    try {
      const constraints = await prisma.$queryRaw`
        SELECT 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'CharacterCollection'
      `;
      console.log('🔗 Foreign key constraints:', constraints);
    } catch (e) {
      console.log('❌ Error checking constraints:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabase();
