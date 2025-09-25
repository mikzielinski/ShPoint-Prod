import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Add admin user to allowed emails
    console.log('📧 Adding admin email to allowed emails...');
    await prisma.allowedEmail.upsert({
      where: { email: 'mikzielinski@gmail.com' },
      update: {},
      create: {
        email: 'mikzielinski@gmail.com',
        role: 'ADMIN',
        isActive: true
      }
    });

    // 2. Add some test users to allowed emails
    console.log('📧 Adding test users to allowed emails...');
    const testEmails = [
      'test1@example.com',
      'test2@example.com',
      'test3@example.com'
    ];

    for (const email of testEmails) {
      await prisma.allowedEmail.upsert({
        where: { email },
        update: {},
        create: {
          email,
          role: 'USER',
          isActive: true
        }
      });
    }

    // 3. Add some sample character collections
    console.log('👥 Adding sample character collections...');
    const sampleCharacters = [
      'general-anakin-skywalker',
      'captain-rex-cc-7567',
      '501st-clone-troopers',
      'ahsoka-tano-jedi-no-more',
      'bo-katan-kryze',
      'clan-kryze-mandalorians',
      'asajj-ventress-sith-assassin',
      'kalani-super-tactical-droid',
      'b1-battle-droids',
      'darth-maul-lord-maul',
      'gar-saxon-merciless-commander',
      'mandalorian-super-commandos'
    ];

    // Get the admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'mikzielinski@gmail.com' }
    });

    if (adminUser) {
      for (const characterId of sampleCharacters) {
        await prisma.characterCollection.upsert({
          where: {
            userId_characterId: {
              userId: adminUser.id,
              characterId: characterId
            }
          },
          update: {},
          create: {
            userId: adminUser.id,
            characterId: characterId,
            isOwned: true,
            isPainted: Math.random() > 0.5, // Random painted status
            isWishlist: false,
            isSold: false,
            isFavorite: Math.random() > 0.8 // Random favorite status
          }
        });
      }
    }

    // 4. Add some sample set collections
    console.log('📦 Adding sample set collections...');
    const sampleSets = [
      'swp01', // Core Set
      'swp03', // Twice the Pride Squad Pack
      'swp04', // Duel of the Fates Squad Pack
      'swp05', // First Contact Squad Pack
      'swp06', // Never Tell Me the Odds Squad Pack
      'swp07', // Sabotage Showdown Squad Pack
      'swp08', // Shifting Priorities Squad Pack
      'swp09', // The Mandalorian Squad Pack
      'swp10', // The Armorer Squad Pack
      'swp11', // Ahsoka Tano Squad Pack
      'swp12', // Darth Maul Squad Pack
      'swp13', // Count Dooku Squad Pack
      'swp14', // Jango Fett Squad Pack
      'swp15', // The Mandalorian Super Commandos Squad Pack
      'swp16'  // The Armorer Squad Pack
    ];

    if (adminUser) {
      for (const setId of sampleSets) {
        await prisma.setCollection.upsert({
          where: {
            userId_setId: {
              userId: adminUser.id,
              setId: setId
            }
          },
          update: {},
          create: {
            userId: adminUser.id,
            setId: setId,
            isOwned: Math.random() > 0.3, // Random owned status
            isPainted: Math.random() > 0.7, // Random painted status
            isWishlist: Math.random() > 0.8, // Random wishlist status
            isSold: false,
            isFavorite: Math.random() > 0.9 // Random favorite status
          }
        });
      }
    }

    // 5. Add some sample mission collections
    console.log('🎯 Adding sample mission collections...');
    const sampleMissions = [
      'core-mission-pack',
      'dont-tell-me-odds',
      'first-contact',
      'sabotage-showdown',
      'shifting-priorities'
    ];

    if (adminUser) {
      for (const missionId of sampleMissions) {
        await prisma.missionCollection.upsert({
          where: {
            userId_missionId: {
              userId: adminUser.id,
              missionId: missionId
            }
          },
          update: {},
          create: {
            userId: adminUser.id,
            missionId: missionId,
            isOwned: Math.random() > 0.2, // Random owned status
            isWishlist: Math.random() > 0.9, // Random wishlist status
            isFavorite: Math.random() > 0.95, // Random favorite status
            isCompleted: Math.random() > 0.7, // Random completed status
            isLocked: Math.random() > 0.9 // Random locked status
          }
        });
      }
    }

    // 6. Add some sample strike teams
    console.log('⚔️ Adding sample strike teams...');
    if (adminUser) {
      const sampleStrikeTeams = [
        {
          name: 'Clone Wars Republic',
          description: 'A powerful Republic strike team from the Clone Wars era',
          characters: [
            { characterId: 'general-anakin-skywalker', role: 'PRIMARY' },
            { characterId: 'captain-rex-cc-7567', role: 'SECONDARY' },
            { characterId: '501st-clone-troopers', role: 'SUPPORT' }
          ]
        },
        {
          name: 'Mandalorian Warriors',
          description: 'A fierce Mandalorian strike team',
          characters: [
            { characterId: 'bo-katan-kryze', role: 'PRIMARY' },
            { characterId: 'clan-kryze-mandalorians', role: 'SECONDARY' },
            { characterId: 'mandalorian-super-commandos', role: 'SUPPORT' }
          ]
        },
        {
          name: 'Sith Assassins',
          description: 'A dark side strike team',
          characters: [
            { characterId: 'asajj-ventress-sith-assassin', role: 'PRIMARY' },
            { characterId: 'kalani-super-tactical-droid', role: 'SECONDARY' },
            { characterId: 'b1-battle-droids', role: 'SUPPORT' }
          ]
        }
      ];

      for (const team of sampleStrikeTeams) {
        const strikeTeam = await prisma.strikeTeam.create({
          data: {
            name: team.name,
            description: team.description,
            userId: adminUser.id,
            isPublished: Math.random() > 0.5, // Random published status
            characters: {
              create: team.characters.map((char, index) => ({
                characterId: char.characterId,
                role: char.role as 'PRIMARY' | 'SECONDARY' | 'SUPPORT',
                order: index + 1
              }))
            }
          }
        });
        console.log(`✅ Created strike team: ${strikeTeam.name}`);
      }
    }

    console.log('✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
