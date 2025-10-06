import { Request, Response } from 'express';
import { prisma } from '../prisma';

// Get all achievements with user progress and community stats
export async function getAllAchievements(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    // Get all active achievements
    const achievements = await prisma.achievement.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { category: 'asc' },
        { rarity: 'desc' },
        { name: 'asc' }
      ]
    });

    // Get user's achievements if logged in
    let userAchievements: any[] = [];
    if (userId) {
      userAchievements = await prisma.userAchievement.findMany({
        where: {
          userId: userId
        },
        include: {
          achievement: true
        }
      });
    }

    // Get community statistics for each achievement
    const achievementsWithStats = await Promise.all(
      achievements.map(async (achievement) => {
        // Count total users who have this achievement
        const totalUsers = await prisma.user.count();
        const usersWithAchievement = await prisma.userAchievement.count({
          where: {
            achievementId: achievement.id,
            isCompleted: true
          }
        });

        const communityCompletion = totalUsers > 0 ? Math.round((usersWithAchievement / totalUsers) * 100) : 0;

        // Check if user has this achievement
        const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
        const isUnlocked = !!userAchievement?.isCompleted;
        const progress = userAchievement?.progress || 0;

        return {
          ...achievement,
          isUnlocked,
          progress,
          communityCompletion,
          usersWithAchievement,
          totalUsers
        };
      })
    );

    res.json({
      ok: true,
      achievements: achievementsWithStats
    });

  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch achievements' 
    });
  }
}

// Get user's achievements
export async function getUserAchievements(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId: userId
      },
      include: {
        achievement: true
      },
      orderBy: {
        unlockedAt: 'desc'
      }
    });

    res.json({
      ok: true,
      achievements: userAchievements
    });

  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch user achievements' 
    });
  }
}

// Admin: Create new achievement
export async function createAchievement(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { name, description, icon, rarity, category, conditions } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Admin access required' 
      });
    }

    if (!name || !description || !icon || !rarity || !category) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields: name, description, icon, rarity, category' 
      });
    }

    const achievement = await prisma.achievement.create({
      data: {
        name,
        description,
        icon,
        rarity,
        category,
        conditions: conditions || null,
        createdBy: userId
      }
    });

    res.json({
      ok: true,
      achievement
    });

  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to create achievement' 
    });
  }
}

// Admin: Update achievement
export async function updateAchievement(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const achievementId = req.params.id;
    const { name, description, icon, rarity, category, conditions, isActive } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Admin access required' 
      });
    }

    const achievement = await prisma.achievement.update({
      where: { id: achievementId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(icon && { icon }),
        ...(rarity && { rarity }),
        ...(category && { category }),
        ...(conditions !== undefined && { conditions }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      ok: true,
      achievement
    });

  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to update achievement' 
    });
  }
}

// Admin: Delete achievement
export async function deleteAchievement(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const achievementId = req.params.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Admin access required' 
      });
    }

    // Soft delete by setting isActive to false
    const achievement = await prisma.achievement.update({
      where: { id: achievementId },
      data: { isActive: false }
    });

    res.json({
      ok: true,
      message: 'Achievement deactivated successfully'
    });

  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to delete achievement' 
    });
  }
}

// Check and unlock achievements for a user
export async function checkAndUnlockAchievements(userId: string) {
  try {
    // Get all active achievements
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true }
    });

    // Get user's current achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId }
    });

    const unlockedAchievements = [];

    for (const achievement of achievements) {
      // Skip if user already has this achievement
      if (userAchievements.some(ua => ua.achievementId === achievement.id && ua.isCompleted)) {
        continue;
      }

      let shouldUnlock = false;
      let progress = 0;

      // Check achievement conditions based on category
      switch (achievement.category) {
        case 'COLLECTION':
          shouldUnlock = await checkCollectionAchievements(userId, achievement);
          break;
        case 'GAME_PLAY':
          shouldUnlock = await checkGamePlayAchievements(userId, achievement);
          break;
        case 'CHALLENGES':
          shouldUnlock = await checkChallengeAchievements(userId, achievement);
          break;
        case 'STRIKE_TEAMS':
          shouldUnlock = await checkStrikeTeamAchievements(userId, achievement);
          break;
        case 'DICE_ROLLS':
          shouldUnlock = await checkDiceRollAchievements(userId, achievement);
          break;
        case 'SOCIAL':
          shouldUnlock = await checkSocialAchievements(userId, achievement);
          break;
        case 'SPECIAL':
          shouldUnlock = await checkSpecialAchievements(userId, achievement);
          break;
      }

      if (shouldUnlock) {
        // Create or update user achievement
        await prisma.userAchievement.upsert({
          where: {
            userId_achievementId: {
              userId,
              achievementId: achievement.id
            }
          },
          update: {
            isCompleted: true,
            progress: 100
          },
          create: {
            userId,
            achievementId: achievement.id,
            isCompleted: true,
            progress: 100
          }
        });

        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;

  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

// Helper functions for checking different achievement types
async function checkCollectionAchievements(userId: string, achievement: any): Promise<boolean> {
  const conditions = achievement.conditions as any;
  
  if (!conditions) return false;

  switch (conditions.type) {
    case 'character_completion':
      const totalCharacters = await prisma.character.count();
      const ownedCharacters = await prisma.characterCollection.count({
        where: { userId, isOwned: true }
      });
      return (ownedCharacters / totalCharacters) >= (conditions.threshold || 1.0);

    case 'faction_completion':
      const factionCharacters = await prisma.character.count({
        where: { faction: conditions.faction }
      });
      const ownedFactionCharacters = await prisma.characterCollection.count({
        where: {
          userId,
          isOwned: true,
          character: { faction: conditions.faction }
        }
      });
      return (ownedFactionCharacters / factionCharacters) >= (conditions.threshold || 1.0);

    case 'shelf_of_shame':
      const unpaintedCount = await prisma.characterCollection.count({
        where: { userId, isOwned: true, isPainted: false }
      });
      return unpaintedCount >= (conditions.count || 5);

    default:
      return false;
  }
}

async function checkGamePlayAchievements(userId: string, achievement: any): Promise<boolean> {
  const conditions = achievement.conditions as any;
  
  if (!conditions) return false;

  switch (conditions.type) {
    case 'games_played':
      const gamesPlayed = await prisma.gameResult.count({
        where: {
          OR: [{ player1Id: userId }, { player2Id: userId }],
          isVerified: true
        }
      });
      return gamesPlayed >= (conditions.count || 10);

    case 'win_rate':
      const totalGames = await prisma.gameResult.count({
        where: {
          OR: [{ player1Id: userId }, { player2Id: userId }],
          isVerified: true
        }
      });
      const wins = await prisma.gameResult.count({
        where: { winnerId: userId, isVerified: true }
      });
      const winRate = totalGames > 0 ? (wins / totalGames) : 0;
      return winRate >= (conditions.threshold || 0.6);

    case 'win_streak':
      // This would require more complex logic to track streaks
      return false;

    default:
      return false;
  }
}

async function checkChallengeAchievements(userId: string, achievement: any): Promise<boolean> {
  const conditions = achievement.conditions as any;
  
  if (!conditions) return false;

  switch (conditions.type) {
    case 'challenges_sent':
      const challengesSent = await prisma.challenge.count({
        where: { challengerId: userId }
      });
      return challengesSent >= (conditions.count || 10);

    case 'challenges_accepted':
      const challengesAccepted = await prisma.challenge.count({
        where: { challengedId: userId, status: 'ACCEPTED' }
      });
      return challengesAccepted >= (conditions.count || 5);

    default:
      return false;
  }
}

async function checkStrikeTeamAchievements(userId: string, achievement: any): Promise<boolean> {
  const conditions = achievement.conditions as any;
  
  if (!conditions) return false;

  switch (conditions.type) {
    case 'strike_teams_created':
      const strikeTeamsCreated = await prisma.strikeTeam.count({
        where: { userId }
      });
      return strikeTeamsCreated >= (conditions.count || 5);

    default:
      return false;
  }
}

async function checkDiceRollAchievements(userId: string, achievement: any): Promise<boolean> {
  // This would require dice roll tracking in the database
  // For now, return false as dice roll tracking isn't implemented yet
  return false;
}

async function checkSocialAchievements(userId: string, achievement: any): Promise<boolean> {
  // This would require social features like friends, comments, etc.
  // For now, return false as social features aren't fully implemented
  return false;
}

async function checkSpecialAchievements(userId: string, achievement: any): Promise<boolean> {
  const conditions = achievement.conditions as any;
  
  if (!conditions) return false;

  switch (conditions.type) {
    case 'first_login':
      // This would be checked on first login
      return false;

    case 'beta_tester':
      // This would be manually assigned
      return false;

    default:
      return false;
  }
}

// Seed default achievements
export async function seedDefaultAchievements() {
  try {
    const defaultAchievements = [
      // Collection Achievements
      {
        name: 'First Steps',
        description: 'Add your first character to collection',
        icon: '🎯',
        rarity: 'COMMON',
        category: 'COLLECTION',
        conditions: { type: 'character_completion', threshold: 0.01 }
      },
      {
        name: 'Collector',
        description: 'Own 25% of all characters',
        icon: '📚',
        rarity: 'RARE',
        category: 'COLLECTION',
        conditions: { type: 'character_completion', threshold: 0.25 }
      },
      {
        name: 'Completionist',
        description: 'Own all characters in the game!',
        icon: '🏆',
        rarity: 'LEGENDARY',
        category: 'COLLECTION',
        conditions: { type: 'character_completion', threshold: 1.0 }
      },
      {
        name: 'Shelf of Shame Apprentice',
        description: 'You have 5+ unpainted miniatures!',
        icon: '🎨',
        rarity: 'COMMON',
        category: 'COLLECTION',
        conditions: { type: 'shelf_of_shame', count: 5 }
      },
      {
        name: 'Shelf of Shame Master',
        description: 'You have 10+ unpainted miniatures!',
        icon: '😅',
        rarity: 'RARE',
        category: 'COLLECTION',
        conditions: { type: 'shelf_of_shame', count: 10 }
      },
      {
        name: 'Rebel Scam',
        description: 'Halfway to Rebel mastery!',
        icon: '🎭',
        rarity: 'RARE',
        category: 'COLLECTION',
        conditions: { type: 'faction_completion', faction: 'Rebel', threshold: 0.5 }
      },
      {
        name: 'Rebel Hero',
        description: 'Own all Rebel characters!',
        icon: '⭐',
        rarity: 'EPIC',
        category: 'COLLECTION',
        conditions: { type: 'faction_completion', faction: 'Rebel', threshold: 1.0 }
      },
      {
        name: 'Empire Scam',
        description: 'Halfway to Empire mastery!',
        icon: '🎭',
        rarity: 'RARE',
        category: 'COLLECTION',
        conditions: { type: 'faction_completion', faction: 'Empire', threshold: 0.5 }
      },
      {
        name: 'Empire Hero',
        description: 'Own all Empire characters!',
        icon: '⭐',
        rarity: 'EPIC',
        category: 'COLLECTION',
        conditions: { type: 'faction_completion', faction: 'Empire', threshold: 1.0 }
      },
      {
        name: 'Mandalorian Scam',
        description: 'Halfway to Mandalorian mastery!',
        icon: '🎭',
        rarity: 'RARE',
        category: 'COLLECTION',
        conditions: { type: 'faction_completion', faction: 'Mandalorian', threshold: 0.5 }
      },
      {
        name: 'Mandalorian Hero',
        description: 'Own all Mandalorian characters!',
        icon: '⭐',
        rarity: 'EPIC',
        category: 'COLLECTION',
        conditions: { type: 'faction_completion', faction: 'Mandalorian', threshold: 1.0 }
      },

      // Game Play Achievements
      {
        name: 'First Blood',
        description: 'Play your first game',
        icon: '⚔️',
        rarity: 'COMMON',
        category: 'GAME_PLAY',
        conditions: { type: 'games_played', count: 1 }
      },
      {
        name: 'Rookie',
        description: 'Play 10 games',
        icon: '🎮',
        rarity: 'COMMON',
        category: 'GAME_PLAY',
        conditions: { type: 'games_played', count: 10 }
      },
      {
        name: 'Half Century',
        description: 'Played 50+ games!',
        icon: '🎯',
        rarity: 'RARE',
        category: 'GAME_PLAY',
        conditions: { type: 'games_played', count: 50 }
      },
      {
        name: 'Century Club',
        description: 'Played 100+ games!',
        icon: '💯',
        rarity: 'EPIC',
        category: 'GAME_PLAY',
        conditions: { type: 'games_played', count: 100 }
      },
      {
        name: 'Solid Player',
        description: '60%+ win rate! Not bad!',
        icon: '👍',
        rarity: 'RARE',
        category: 'GAME_PLAY',
        conditions: { type: 'win_rate', threshold: 0.6 }
      },
      {
        name: 'Winning Streak',
        description: '80%+ win rate! You\'re on fire!',
        icon: '🔥',
        rarity: 'EPIC',
        category: 'GAME_PLAY',
        conditions: { type: 'win_rate', threshold: 0.8 }
      },

      // Challenge Achievements
      {
        name: 'Challenger',
        description: 'Send your first challenge',
        icon: '🥊',
        rarity: 'COMMON',
        category: 'CHALLENGES',
        conditions: { type: 'challenges_sent', count: 1 }
      },
      {
        name: 'Challenge Master',
        description: 'Sent 50+ challenges!',
        icon: '🥊',
        rarity: 'RARE',
        category: 'CHALLENGES',
        conditions: { type: 'challenges_sent', count: 50 }
      },
      {
        name: 'Always Ready',
        description: 'Accepted 30+ challenges!',
        icon: '⚡',
        rarity: 'RARE',
        category: 'CHALLENGES',
        conditions: { type: 'challenges_accepted', count: 30 }
      },

      // Strike Team Achievements
      {
        name: 'Army Builder',
        description: 'Created 10+ strike teams!',
        icon: '⚔️',
        rarity: 'RARE',
        category: 'STRIKE_TEAMS',
        conditions: { type: 'strike_teams_created', count: 10 }
      }
    ];

    for (const achievementData of defaultAchievements) {
      await prisma.achievement.upsert({
        where: { name: achievementData.name },
        update: achievementData,
        create: achievementData
      });
    }

    console.log('Default achievements seeded successfully');
    return true;

  } catch (error) {
    console.error('Error seeding default achievements:', error);
    return false;
  }
}
