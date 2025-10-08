import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Check and update user achievements based on their current progress
export async function checkUserAchievements(userId: string) {
  try {
    console.log(`🏆 Checking achievements for user: ${userId}`);
    
    // Get all achievements
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true }
    });
    
    // Get user's current stats
    const characterCollections = await prisma.characterCollection.findMany({
      where: { userId }
    });
    
    const setCollections = await prisma.setCollection.findMany({
      where: { userId }
    });
    
    const missionCollections = await prisma.missionCollection.findMany({
      where: { userId }
    });
    
    const strikeTeams = await prisma.strikeTeam.findMany({
      where: { userId }
    });
    
    // Calculate current stats
    const ownedCharacters = characterCollections.filter(c => c.isOwned).length;
    const paintedCharacters = characterCollections.filter(c => c.isPainted).length;
    const ownedSets = setCollections.filter(c => c.isOwned).length;
    const ownedMissions = missionCollections.filter(c => c.isOwned).length;
    const createdStrikeTeams = strikeTeams.length;
    
    console.log(`📊 User stats:`, {
      ownedCharacters,
      paintedCharacters,
      ownedSets,
      ownedMissions,
      createdStrikeTeams
    });
    
    // Check each achievement
    for (const achievement of achievements) {
      const conditions = achievement.conditions as any;
      
      let currentProgress = 0;
      let shouldUnlock = false;
      
      switch (conditions.type) {
        // Legacy simple conditions
        case 'characters_owned':
          currentProgress = ownedCharacters;
          shouldUnlock = ownedCharacters >= conditions.count;
          break;
        case 'characters_painted':
          currentProgress = paintedCharacters;
          shouldUnlock = paintedCharacters >= conditions.count;
          break;
        case 'sets_owned':
          currentProgress = ownedSets;
          shouldUnlock = ownedSets >= conditions.count;
          break;
        case 'missions_owned':
          currentProgress = ownedMissions;
          shouldUnlock = ownedMissions >= conditions.count;
          break;
        case 'strike_teams_created':
          currentProgress = createdStrikeTeams;
          shouldUnlock = createdStrikeTeams >= conditions.count;
          break;
        
        // New complex conditions
        case 'character_completion':
          const totalCharacters = await prisma.character.count();
          const completionPercentage = totalCharacters > 0 ? (ownedCharacters / totalCharacters) * 100 : 0;
          currentProgress = Math.round(completionPercentage);
          shouldUnlock = completionPercentage >= (conditions.threshold * 100);
          break;
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
          const factionCompletionPercentage = factionCharacters > 0 ? (ownedFactionCharacters / factionCharacters) * 100 : 0;
          currentProgress = Math.round(factionCompletionPercentage);
          shouldUnlock = factionCompletionPercentage >= (conditions.threshold * 100);
          break;
        case 'shelf_of_shame':
          const unpaintedCount = await prisma.characterCollection.count({
            where: { userId, isOwned: true, isPainted: false }
          });
          currentProgress = unpaintedCount;
          shouldUnlock = unpaintedCount >= conditions.count;
          break;
        case 'games_played':
          const gamesPlayed = await prisma.gameResult.count({
            where: {
              OR: [{ player1Id: userId }, { player2Id: userId }],
              isVerified: true
            }
          });
          currentProgress = gamesPlayed;
          shouldUnlock = gamesPlayed >= conditions.count;
          break;
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
          const winRatePercentage = totalGames > 0 ? (wins / totalGames) * 100 : 0;
          currentProgress = Math.round(winRatePercentage);
          shouldUnlock = winRatePercentage >= (conditions.threshold * 100);
          break;
        case 'challenges_sent':
          const challengesSent = await prisma.challenge.count({
            where: { challengerId: userId }
          });
          currentProgress = challengesSent;
          shouldUnlock = challengesSent >= conditions.count;
          break;
        case 'challenges_accepted':
          const challengesAccepted = await prisma.challenge.count({
            where: { challengedId: userId, status: 'ACCEPTED' }
          });
          currentProgress = challengesAccepted;
          shouldUnlock = challengesAccepted >= conditions.count;
          break;
        
        default:
          console.log(`⚠️ Unknown achievement condition type: ${conditions.type}`);
          continue;
      }
      
      // Get or create user achievement record
      let userAchievement = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievementId: achievement.id
        }
      });
      
      if (!userAchievement) {
        userAchievement = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: currentProgress,
            isCompleted: shouldUnlock,
            unlockedAt: shouldUnlock ? new Date() : null
          }
        });
        console.log(`📝 Created user achievement record for: ${achievement.name}`);
        if (shouldUnlock) {
          console.log(`🎉 Achievement unlocked: ${achievement.name} for user ${userId}`);
        }
      } else {
        // Update progress
        const updatedUserAchievement = await prisma.userAchievement.update({
          where: { id: userAchievement.id },
          data: {
            progress: currentProgress,
            isCompleted: shouldUnlock,
            unlockedAt: shouldUnlock && !userAchievement.isCompleted ? new Date() : userAchievement.unlockedAt
          }
        });
        
        if (shouldUnlock && !userAchievement.isCompleted) {
          console.log(`🎉 Achievement unlocked: ${achievement.name} for user ${userId}`);
        }
        
        userAchievement = updatedUserAchievement;
      }
    }
    
    console.log(`✅ Achievement check completed for user: ${userId}`);
    
  } catch (error) {
    console.error(`❌ Error checking achievements for user ${userId}:`, error);
  }
}

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

// Validate and award all eligible achievements for a user
export async function validateAndAwardAchievements(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'User ID is required' 
      });
    }

    console.log(`🔍 Validating and awarding achievements for user: ${userId}`);
    
    // Get all active achievements
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true }
    });
    
    // Get user's current achievements
    const existingUserAchievements = await prisma.userAchievement.findMany({
      where: { userId }
    });
    
    const results = {
      totalAchievements: achievements.length,
      alreadyUnlocked: 0,
      newlyUnlocked: 0,
      unlockedAchievements: [] as any[],
      progress: [] as any[]
    };
    
    // Check each achievement
    for (const achievement of achievements) {
      const conditions = achievement.conditions as any;
      
      // Skip if no conditions
      if (!conditions || !conditions.type) {
        continue;
      }
      
      // Check if user already has this achievement
      const existingUserAchievement = existingUserAchievements.find(
        ua => ua.achievementId === achievement.id && ua.isCompleted
      );
      
      if (existingUserAchievement) {
        results.alreadyUnlocked++;
        continue;
      }
      
      // Calculate progress and check if should unlock
      let currentProgress = 0;
      let shouldUnlock = false;
      let progressDetails = '';
      
      switch (conditions.type) {
        case 'character_completion':
          const totalCharacters = await prisma.character.count();
          const ownedCharacters = await prisma.characterCollection.count({
            where: { userId, isOwned: true }
          });
          const completionPercentage = totalCharacters > 0 ? (ownedCharacters / totalCharacters) * 100 : 0;
          currentProgress = Math.round(completionPercentage);
          shouldUnlock = completionPercentage >= (conditions.threshold * 100);
          progressDetails = `${ownedCharacters}/${totalCharacters} characters (${currentProgress}%)`;
          break;
          
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
          const factionCompletionPercentage = factionCharacters > 0 ? (ownedFactionCharacters / factionCharacters) * 100 : 0;
          currentProgress = Math.round(factionCompletionPercentage);
          shouldUnlock = factionCompletionPercentage >= (conditions.threshold * 100);
          progressDetails = `${ownedFactionCharacters}/${factionCharacters} ${conditions.faction} characters (${currentProgress}%)`;
          break;
          
        case 'shelf_of_shame':
          const unpaintedCount = await prisma.characterCollection.count({
            where: { userId, isOwned: true, isPainted: false }
          });
          currentProgress = unpaintedCount;
          shouldUnlock = unpaintedCount >= conditions.count;
          progressDetails = `${unpaintedCount}/${conditions.count} unpainted characters`;
          break;
          
        case 'games_played':
          const gamesPlayed = await prisma.gameResult.count({
            where: {
              OR: [{ player1Id: userId }, { player2Id: userId }],
              isVerified: true
            }
          });
          currentProgress = gamesPlayed;
          shouldUnlock = gamesPlayed >= conditions.count;
          progressDetails = `${gamesPlayed}/${conditions.count} games played`;
          break;
          
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
          const winRatePercentage = totalGames > 0 ? (wins / totalGames) * 100 : 0;
          currentProgress = Math.round(winRatePercentage);
          shouldUnlock = winRatePercentage >= (conditions.threshold * 100);
          progressDetails = `${wins}/${totalGames} wins (${currentProgress}%) - need ${Math.round(conditions.threshold * 100)}%`;
          break;
          
        case 'challenges_sent':
          const challengesSent = await prisma.challenge.count({
            where: { challengerId: userId }
          });
          currentProgress = challengesSent;
          shouldUnlock = challengesSent >= conditions.count;
          progressDetails = `${challengesSent}/${conditions.count} challenges sent`;
          break;
          
        case 'challenges_accepted':
          const challengesAccepted = await prisma.challenge.count({
            where: { challengedId: userId, status: 'ACCEPTED' }
          });
          currentProgress = challengesAccepted;
          shouldUnlock = challengesAccepted >= conditions.count;
          progressDetails = `${challengesAccepted}/${conditions.count} challenges accepted`;
          break;
          
        default:
          progressDetails = `Unknown condition type: ${conditions.type}`;
          break;
      }
      
      // Store progress info
      results.progress.push({
        achievementId: achievement.id,
        name: achievement.name,
        type: conditions.type,
        currentProgress,
        shouldUnlock,
        progressDetails,
        threshold: conditions.threshold || conditions.count
      });
      
      // Award achievement if eligible
      if (shouldUnlock) {
        await prisma.userAchievement.upsert({
          where: {
            userId_achievementId: {
              userId,
              achievementId: achievement.id
            }
          },
          update: {
            isCompleted: true,
            progress: 100,
            unlockedAt: new Date()
          },
          create: {
            userId,
            achievementId: achievement.id,
            isCompleted: true,
            progress: 100,
            unlockedAt: new Date()
          }
        });
        
        results.newlyUnlocked++;
        results.unlockedAchievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity
        });
        
        console.log(`🎉 Awarded achievement: ${achievement.name} to user ${userId}`);
      }
    }
    
    console.log(`✅ Achievement validation completed for user ${userId}:`, results);
    
    res.json({
      ok: true,
      message: `Achievement validation completed for user ${userId}`,
      results
    });
    
  } catch (error) {
    console.error('Error validating and awarding achievements:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to validate and award achievements' 
    });
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
        rarity: 'COMMON' as any,
        category: 'COLLECTION' as any,
        conditions: { type: 'character_completion', threshold: 0.01 }
      },
      {
        name: 'Collector',
        description: 'Own 25% of all characters',
        icon: '📚',
        rarity: 'RARE' as any,
        category: 'COLLECTION' as any,
        conditions: { type: 'character_completion', threshold: 0.25 }
      },
      {
        name: 'Completionist',
        description: 'Own all characters in the game!',
        icon: '🏆',
        rarity: 'LEGENDARY' as any,
        category: 'COLLECTION' as any,
        conditions: { type: 'character_completion', threshold: 1.0 }
      },
      {
        name: 'Shelf of Shame Apprentice',
        description: 'You have 5+ unpainted miniatures!',
        icon: '🎨',
        rarity: 'COMMON' as any,
        category: 'COLLECTION' as any,
        conditions: { type: 'shelf_of_shame', count: 5 }
      },
      {
        name: 'Shelf of Shame Master',
        description: 'You have 10+ unpainted miniatures!',
        icon: '😅',
        rarity: 'RARE' as any,
        category: 'COLLECTION' as any,
        conditions: { type: 'shelf_of_shame', count: 10 }
      },
      {
        name: 'Rebel Scam',
        description: 'Halfway to Rebel mastery!',
        icon: '🎭',
        rarity: 'RARE' as any,
        category: 'COLLECTION' as any,
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
        rarity: 'RARE' as any,
        category: 'COLLECTION' as any,
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
        rarity: 'RARE' as any,
        category: 'COLLECTION' as any,
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
        rarity: 'COMMON' as any,
        category: 'GAME_PLAY' as any,
        conditions: { type: 'games_played', count: 1 }
      },
      {
        name: 'Rookie',
        description: 'Play 10 games',
        icon: '🎮',
        rarity: 'COMMON' as any,
        category: 'GAME_PLAY' as any,
        conditions: { type: 'games_played', count: 10 }
      },
      {
        name: 'Half Century',
        description: 'Played 50+ games!',
        icon: '🎯',
        rarity: 'RARE' as any,
        category: 'GAME_PLAY' as any,
        conditions: { type: 'games_played', count: 50 }
      },
      {
        name: 'Century Club',
        description: 'Played 100+ games!',
        icon: '💯',
        rarity: 'EPIC' as any,
        category: 'GAME_PLAY' as any,
        conditions: { type: 'games_played', count: 100 }
      },
      {
        name: 'Solid Player',
        description: '60%+ win rate! Not bad!',
        icon: '👍',
        rarity: 'RARE' as any,
        category: 'GAME_PLAY' as any,
        conditions: { type: 'win_rate', threshold: 0.6 }
      },
      {
        name: 'Winning Streak',
        description: '80%+ win rate! You\'re on fire!',
        icon: '🔥',
        rarity: 'EPIC' as any,
        category: 'GAME_PLAY' as any,
        conditions: { type: 'win_rate', threshold: 0.8 }
      },

      // Challenge Achievements
      {
        name: 'Challenger',
        description: 'Send your first challenge',
        icon: '🥊',
        rarity: 'COMMON' as any,
        category: 'CHALLENGES' as any,
        conditions: { type: 'challenges_sent', count: 1 }
      },
      {
        name: 'Challenge Master',
        description: 'Sent 50+ challenges!',
        icon: '🥊',
        rarity: 'RARE' as any,
        category: 'CHALLENGES' as any,
        conditions: { type: 'challenges_sent', count: 50 }
      },
      {
        name: 'Always Ready',
        description: 'Accepted 30+ challenges!',
        icon: '⚡',
        rarity: 'RARE' as any,
        category: 'CHALLENGES' as any,
        conditions: { type: 'challenges_accepted', count: 30 }
      },

      // Strike Team Achievements
      {
        name: 'Army Builder',
        description: 'Created 10+ strike teams!',
        icon: '⚔️',
        rarity: 'RARE' as any,
        category: 'STRIKE_TEAMS' as any,
        conditions: { type: 'strike_teams_created', count: 10 }
      }
    ];

    for (const achievementData of defaultAchievements) {
      // Check if achievement already exists by name
      const existing = await prisma.achievement.findFirst({
        where: { name: achievementData.name }
      });

      if (existing) {
        // Update existing achievement
        await prisma.achievement.update({
          where: { id: existing.id },
          data: achievementData
        });
      } else {
        // Create new achievement
        await prisma.achievement.create({
          data: achievementData
        });
      }
    }

    console.log('Default achievements seeded successfully');
    return true;

  } catch (error) {
    console.error('Error seeding default achievements:', error);
    return false;
  }
}
