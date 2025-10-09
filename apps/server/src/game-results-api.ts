import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createInboxMessage } from './inbox-api.js';

const prisma = new PrismaClient();

// ===== GAME RESULT APPROVAL SYSTEM =====

interface GameResultApproval {
  id: string;
  gameResultId: string;
  proposedBy: string;
  proposedData: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED';
  proposedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  expiresAt: Date;
}

// ===== GAME RESULTS API =====

export async function getGameResults(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { page = 1, limit = 20, mode, playerId } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    let whereClause: any = {
      OR: [
        { player1Id: userId },
        { player2Id: userId }
      ]
    };

    if (playerId) {
      whereClause = {
        OR: [
          { player1Id: playerId as string },
          { player2Id: playerId as string }
        ]
      };
    }

    if (mode) {
      whereClause.mode = mode;
    }

    const [results, total] = await Promise.all([
      prisma.gameResult.findMany({
        where: whereClause,
        include: {
          player1: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          player2: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          winner: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          mission: {
            select: {
              id: true,
              name: true,
              thumbnailUrl: true
            }
          },
          player1StrikeTeam: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          player2StrikeTeam: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          characterResults: {
            include: {
              character: {
                select: {
                  id: true,
                  name: true,
                  portraitUrl: true
                }
              },
              player: {
                select: {
                  id: true,
                  name: true,
                  username: true
                }
              }
            }
          },
          reportedBy: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        },
        orderBy: { playedAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.gameResult.count({
        where: whereClause
      })
    ]);

    res.json({
      ok: true,
      results,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching game results:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch game results' 
    });
  }
}

export async function createGameResult(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const {
      player1Id,
      player2Id,
      winnerId,
      result,
      mode = 'CASUAL',
      missionId,
      player1StrikeTeamId,
      player2StrikeTeamId,
      roundsPlayed = 1,
      durationMinutes,
      location,
      notes,
      scheduledGameId,
      characterResults = []
    } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!player1Id || !player2Id || !result) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Player1Id, player2Id, and result are required' 
      });
    }

    if (player1Id === player2Id) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Players cannot be the same' 
      });
    }

    // Validate players exist
    const [player1, player2] = await Promise.all([
      prisma.user.findUnique({ where: { id: player1Id } }),
      prisma.user.findUnique({ where: { id: player2Id } })
    ]);

    if (!player1 || !player2) {
      return res.status(404).json({ 
        ok: false, 
        error: 'One or both players not found' 
      });
    }

    // Validate winner if provided
    if (winnerId && ![player1Id, player2Id].includes(winnerId)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Winner must be one of the players' 
      });
    }

    // Validate mission if provided
    if (missionId) {
      const mission = await prisma.mission.findUnique({
        where: { id: missionId }
      });

      if (!mission) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Mission not found' 
        });
      }
    }

    // Validate strike teams if provided
    if (player1StrikeTeamId) {
      const strikeTeam = await prisma.strikeTeam.findFirst({
        where: {
          id: player1StrikeTeamId,
          userId: player1Id
        }
      });

      if (!strikeTeam) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Player 1 strike team not found or access denied' 
        });
      }
    }

    if (player2StrikeTeamId) {
      const strikeTeam = await prisma.strikeTeam.findFirst({
        where: {
          id: player2StrikeTeamId,
          userId: player2Id
        }
      });

      if (!strikeTeam) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Player 2 strike team not found or access denied' 
        });
      }
    }

    // Validate scheduled game if provided
    if (scheduledGameId) {
      const scheduledGame = await prisma.scheduledGame.findFirst({
        where: {
          id: scheduledGameId,
          OR: [
            { player1Id: player1Id, player2Id: player2Id },
            { player1Id: player2Id, player2Id: player1Id }
          ]
        }
      });

      if (!scheduledGame) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Scheduled game not found or access denied' 
        });
      }
    }

    // Create game result
    const gameResult = await prisma.gameResult.create({
      data: {
        player1Id,
        player2Id,
        winnerId: winnerId || null,
        result: result as any,
        mode: mode as any,
        missionId,
        player1StrikeTeamId,
        player2StrikeTeamId,
        roundsPlayed,
        durationMinutes,
        location,
        notes,
        scheduledGameId,
        reportedById: userId
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        mission: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true
          }
        },
        player1StrikeTeam: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        player2StrikeTeam: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    // Create character results if provided
    if (characterResults.length > 0) {
      const characterResultsData = characterResults.map((charResult: any) => ({
        gameResultId: gameResult.id,
        characterId: charResult.characterId,
        playerId: charResult.playerId,
        damageDealt: charResult.damageDealt || 0,
        damageTaken: charResult.damageTaken || 0,
        abilitiesUsed: charResult.abilitiesUsed || 0,
        objectivesSecured: charResult.objectivesSecured || 0,
        isMVP: charResult.isMVP || false
      }));

      await prisma.gameResultCharacter.createMany({
        data: characterResultsData
      });
    }

    // Update strike team statistics
    if (player1StrikeTeamId) {
      const updateData: any = {};
      if (result === 'WIN' && winnerId === player1Id) {
        updateData.wins = { increment: 1 };
      } else if (result === 'LOSS' && winnerId === player2Id) {
        updateData.losses = { increment: 1 };
      } else if (result === 'DRAW') {
        updateData.draws = { increment: 1 };
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.strikeTeam.update({
          where: { id: player1StrikeTeamId },
          data: updateData
        });
      }
    }

    if (player2StrikeTeamId) {
      const updateData: any = {};
      if (result === 'WIN' && winnerId === player2Id) {
        updateData.wins = { increment: 1 };
      } else if (result === 'LOSS' && winnerId === player1Id) {
        updateData.losses = { increment: 1 };
      } else if (result === 'DRAW') {
        updateData.draws = { increment: 1 };
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.strikeTeam.update({
          where: { id: player2StrikeTeamId },
          data: updateData
        });
      }
    }

    // Send inbox messages to both players
    const otherPlayerId = userId === player1Id ? player2Id : player1Id;
    const winnerName = winnerId ? 
      (winnerId === player1Id ? player1.name || player1.username : player2.name || player2.username) :
      'Draw';

    await createInboxMessage(
      otherPlayerId,
      userId,
      'game_result',
      'Game Result Recorded',
      `A game result has been recorded. Winner: ${winnerName}`,
      {
        gameResultId: gameResult.id,
        result,
        winnerId
      }
    );

    res.status(201).json({
      ok: true,
      gameResult
    });
  } catch (error) {
    console.error('Error creating game result:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to create game result' 
    });
  }
}

export async function updateGameResult(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const {
      winnerId,
      result,
      roundsPlayed,
      durationMinutes,
      location,
      notes,
      characterResults
    } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const gameResult = await prisma.gameResult.findFirst({
      where: {
        id,
        OR: [
          { player1Id: userId },
          { player2Id: userId },
          { reportedById: userId }
        ]
      }
    });

    if (!gameResult) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game result not found or access denied' 
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (winnerId !== undefined) updateData.winnerId = winnerId;
    if (result) updateData.result = result;
    if (roundsPlayed !== undefined) updateData.roundsPlayed = roundsPlayed;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;

    const updatedGameResult = await prisma.gameResult.update({
      where: { id },
      data: updateData,
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        mission: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true
          }
        },
        player1StrikeTeam: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        player2StrikeTeam: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        characterResults: {
          include: {
            character: {
              select: {
                id: true,
                name: true,
                portraitUrl: true
              }
            },
            player: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      }
    });

    // Update character results if provided
    if (characterResults) {
      // Delete existing character results
      await prisma.gameResultCharacter.deleteMany({
        where: { gameResultId: id }
      });

      // Create new character results
      if (characterResults.length > 0) {
        const characterResultsData = characterResults.map((charResult: any) => ({
          gameResultId: id,
          characterId: charResult.characterId,
          playerId: charResult.playerId,
          damageDealt: charResult.damageDealt || 0,
          damageTaken: charResult.damageTaken || 0,
          abilitiesUsed: charResult.abilitiesUsed || 0,
          objectivesSecured: charResult.objectivesSecured || 0,
          isMVP: charResult.isMVP || false
        }));

        await prisma.gameResultCharacter.createMany({
          data: characterResultsData
        });
      }
    }

    res.json({
      ok: true,
      gameResult: updatedGameResult
    });
  } catch (error) {
    console.error('Error updating game result:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to update game result' 
    });
  }
}

export async function deleteGameResult(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const gameResult = await prisma.gameResult.findFirst({
      where: {
        id,
        reportedById: userId
      }
    });

    if (!gameResult) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game result not found or access denied' 
      });
    }

    await prisma.gameResult.delete({
      where: { id }
    });

    res.json({
      ok: true,
      message: 'Game result deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting game result:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to delete game result' 
    });
  }
}

export async function getPlayerStats(req: Request, res: Response) {
  try {
    const { playerId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const targetPlayerId = playerId || userId;

    const [
      totalGames,
      wins,
      losses,
      draws,
      recentResults,
      favoriteMissions,
      favoriteCharacters
    ] = await Promise.all([
      prisma.gameResult.count({
        where: {
          OR: [
            { player1Id: targetPlayerId },
            { player2Id: targetPlayerId }
          ]
        }
      }),
      prisma.gameResult.count({
        where: {
          OR: [
            { player1Id: targetPlayerId, winnerId: targetPlayerId },
            { player2Id: targetPlayerId, winnerId: targetPlayerId }
          ]
        }
      }),
      prisma.gameResult.count({
        where: {
          OR: [
            { player1Id: targetPlayerId, winnerId: { not: targetPlayerId } },
            { player2Id: targetPlayerId, winnerId: { not: targetPlayerId } }
          ],
          result: { not: 'DRAW' }
        }
      }),
      prisma.gameResult.count({
        where: {
          OR: [
            { player1Id: targetPlayerId },
            { player2Id: targetPlayerId }
          ],
          result: 'DRAW'
        }
      }),
      prisma.gameResult.findMany({
        where: {
          OR: [
            { player1Id: targetPlayerId },
            { player2Id: targetPlayerId }
          ]
        },
        include: {
          player1: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          player2: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          mission: {
            select: {
              id: true,
              name: true,
              thumbnailUrl: true
            }
          }
        },
        orderBy: { playedAt: 'desc' },
        take: 10
      }),
      prisma.gameResult.groupBy({
        by: ['missionId'],
        where: {
          OR: [
            { player1Id: targetPlayerId },
            { player2Id: targetPlayerId }
          ],
          missionId: { not: null }
        },
        _count: {
          missionId: true
        },
        orderBy: {
          _count: {
            missionId: 'desc'
          }
        },
        take: 5
      }),
      prisma.gameResultCharacter.groupBy({
        by: ['characterId'],
        where: {
          playerId: targetPlayerId
        },
        _count: {
          characterId: true
        },
        orderBy: {
          _count: {
            characterId: 'desc'
          }
        },
        take: 5
      })
    ]);

    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    res.json({
      ok: true,
      stats: {
        totalGames,
        wins,
        losses,
        draws,
        winRate: Math.round(winRate * 100) / 100,
        recentResults,
        favoriteMissions,
        favoriteCharacters
      }
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch player stats' 
    });
  }
}

// ===== NEW APPROVAL SYSTEM FUNCTIONS =====

// Create game result from approved game/challenge
export async function createGameResultFromApproved(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { scheduledGameId, gameData } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!scheduledGameId || !gameData) {
      return res.status(400).json({ 
        ok: false, 
        error: 'scheduledGameId and gameData are required' 
      });
    }

    // Get the scheduled game
    const scheduledGame = await prisma.scheduledGame.findUnique({
      where: { id: scheduledGameId },
      include: {
        player1: true,
        player2: true,
        mission: true,
        player1StrikeTeam: true,
        player2StrikeTeam: true
      }
    });

    if (!scheduledGame) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Scheduled game not found' 
      });
    }

    // Check if user is one of the players
    if (scheduledGame.player1Id !== userId && scheduledGame.player2Id !== userId) {
      return res.status(403).json({ 
        ok: false, 
        error: 'You can only create results for your own games' 
      });
    }

    // Check if game is approved/completed
    if (scheduledGame.status !== 'COMPLETED' && scheduledGame.status !== 'CONFIRMED') {
      return res.status(400).json({ 
        ok: false, 
        error: 'Game must be completed or confirmed to create results' 
      });
    }

    // Check if result already exists
    const existingResult = await prisma.gameResult.findUnique({
      where: { scheduledGameId }
    });

    if (existingResult) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Game result already exists for this game' 
      });
    }

    // Create the game result
    const gameResult = await prisma.gameResult.create({
      data: {
        player1Id: scheduledGame.player1Id,
        player2Id: scheduledGame.player2Id!,
        winnerId: gameData.winnerId,
        result: gameData.result,
        mode: gameData.mode || 'FRIENDLY',
        missionId: scheduledGame.missionId,
        player1StrikeTeamId: scheduledGame.player1StrikeTeamId,
        player2StrikeTeamId: scheduledGame.player2StrikeTeamId,
        roundsPlayed: gameData.roundsPlayed || 1,
        durationMinutes: gameData.durationMinutes,
        location: gameData.location || scheduledGame.location,
        notes: gameData.notes,
        scheduledGameId: scheduledGame.id,
        reportedById: userId,
        playedAt: new Date(),
        isVerified: false
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        mission: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true
          }
        }
      }
    });

    // Create approval request for the opponent
    const opponentId = scheduledGame.player1Id === userId ? scheduledGame.player2Id! : scheduledGame.player1Id;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours

    // Create inbox message for opponent
    await createInboxMessage(
      opponentId,
      userId,
      'GAME_RESULT_PROPOSED',
      'Game Result Proposed',
      `A game result has been proposed for your game. Please review and approve or suggest changes.`,
      {
        gameResultId: gameResult.id,
        scheduledGameId: scheduledGame.id,
        proposedBy: userId,
        gameData: gameData,
        expiresAt: expiresAt.toISOString()
      }
    );

    res.json({
      ok: true,
      gameResult,
      message: 'Game result created and sent for approval'
    });

  } catch (error) {
    console.error('Error creating game result from approved game:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to create game result' 
    });
  }
}

// Approve game result
export async function approveGameResult(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { gameResultId, reviewNotes } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!gameResultId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'gameResultId is required' 
      });
    }

    // Get the game result
    const gameResult = await prisma.gameResult.findUnique({
      where: { id: gameResultId },
      include: {
        player1: true,
        player2: true,
        scheduledGame: true
      }
    });

    if (!gameResult) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game result not found' 
      });
    }

    // Check if user is the opponent (not the one who reported the result)
    const opponentId = gameResult.player1Id === userId ? gameResult.player2Id : gameResult.player1Id;
    if (gameResult.player1Id !== userId && gameResult.player2Id !== userId) {
      return res.status(403).json({ 
        ok: false, 
        error: 'You can only approve results for your own games' 
      });
    }

    // Check if user is not the one who reported the result
    if (!gameResult.reportedById || gameResult.reportedById === userId) {
      return res.status(403).json({ 
        ok: false, 
        error: 'You cannot approve your own game result' 
      });
    }

    // Update the game result as verified
    const updatedGameResult = await prisma.gameResult.update({
      where: { id: gameResultId },
      data: {
        isVerified: true,
        verifiedAt: new Date()
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        mission: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true
          }
        }
      }
    });

    // Update scheduled game status
    if (gameResult.scheduledGame) {
      await prisma.scheduledGame.update({
        where: { id: gameResult.scheduledGame.id },
        data: { status: 'COMPLETED' }
      });
    }

    // Notify the proposer
    await createInboxMessage(
      gameResult.reportedById,
      userId,
      'GAME_RESULT_APPROVED',
      'Game Result Approved',
      `Your game result has been approved by your opponent.`,
      {
        gameResultId: gameResult.id,
        approvedBy: userId,
        reviewNotes: reviewNotes
      }
    );

    res.json({
      ok: true,
      gameResult: updatedGameResult,
      message: 'Game result approved successfully'
    });

  } catch (error) {
    console.error('Error approving game result:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to approve game result' 
    });
  }
}

// Reject game result with proposed changes
export async function rejectGameResult(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { gameResultId, rejectionReason, proposedChanges } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!gameResultId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'gameResultId is required' 
      });
    }

    // Get the game result
    const gameResult = await prisma.gameResult.findUnique({
      where: { id: gameResultId },
      include: {
        player1: true,
        player2: true
      }
    });

    if (!gameResult) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game result not found' 
      });
    }

    // Check if user is the opponent
    if (gameResult.player1Id !== userId && gameResult.player2Id !== userId) {
      return res.status(403).json({ 
        ok: false, 
        error: 'You can only reject results for your own games' 
      });
    }

    // Delete the game result
    await prisma.gameResult.delete({
      where: { id: gameResultId }
    });

    // Notify the proposer with rejection reason and proposed changes
    await createInboxMessage(
      gameResult.reportedById,
      userId,
      'GAME_RESULT_REJECTED',
      'Game Result Rejected',
      `Your game result was rejected. Please review the feedback and submit a new result.`,
      {
        originalGameResultId: gameResultId,
        rejectionReason: rejectionReason,
        proposedChanges: proposedChanges,
        rejectedBy: userId
      }
    );

    res.json({
      ok: true,
      message: 'Game result rejected and proposer notified'
    });

  } catch (error) {
    console.error('Error rejecting game result:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to reject game result' 
    });
  }
}

// Get approved games that can have results created
export async function getApprovedGamesForResults(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Get approved games where user is a player and no result exists yet
    const approvedGames = await prisma.scheduledGame.findMany({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ],
        status: {
          in: ['COMPLETED', 'CONFIRMED']
        },
        gameResult: null
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        mission: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true
          }
        },
        player1StrikeTeam: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        player2StrikeTeam: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: { scheduledDate: 'desc' }
    });

    res.json({
      ok: true,
      approvedGames
    });

  } catch (error) {
    console.error('Error fetching approved games for results:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch approved games' 
    });
  }
}

// Auto-approve game results after 48 hours (cron job)
export async function autoApproveExpiredGameResults() {
  try {
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    // Find unverified game results older than 48 hours
    const expiredResults = await prisma.gameResult.findMany({
      where: {
        isVerified: false,
        createdAt: {
          lt: fortyEightHoursAgo
        }
      },
      include: {
        player1: true,
        player2: true,
        scheduledGame: true
      }
    });

    for (const result of expiredResults) {
      // Auto-approve the result
      await prisma.gameResult.update({
        where: { id: result.id },
        data: {
          isVerified: true,
          verifiedAt: new Date()
        }
      });

      // Update scheduled game status
      if (result.scheduledGame) {
        await prisma.scheduledGame.update({
          where: { id: result.scheduledGame.id },
          data: { status: 'COMPLETED' }
        });
      }

      // Notify both players about auto-approval
      await createInboxMessage(
        result.player1Id,
        null, // System message
        'GAME_RESULT_AUTO_APPROVED',
        'Game Result Auto-Approved',
        `Your game result was automatically approved after 48 hours without opponent review.`,
        {
          gameResultId: result.id,
          autoApprovedAt: new Date().toISOString()
        }
      );

      await createInboxMessage(
        result.player2Id,
        null, // System message
        'GAME_RESULT_AUTO_APPROVED',
        'Game Result Auto-Approved',
        `A game result was automatically approved after 48 hours without your review.`,
        {
          gameResultId: result.id,
          autoApprovedAt: new Date().toISOString()
        }
      );
    }

    console.log(`Auto-approved ${expiredResults.length} game results`);
    return expiredResults.length;
  } catch (error) {
    console.error('Error in auto-approval cron job:', error);
    return 0;
  }
}

// Edit existing game result (dispute resolution)
export async function editGameResult(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { gameResultId, updates, reason } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!gameResultId || !updates) {
      return res.status(400).json({ 
        ok: false, 
        error: 'gameResultId and updates are required' 
      });
    }

    // Get the game result
    const gameResult = await prisma.gameResult.findUnique({
      where: { id: gameResultId },
      include: {
        player1: true,
        player2: true
      }
    });

    if (!gameResult) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game result not found' 
      });
    }

    // Check if user is one of the players
    if (gameResult.player1Id !== userId && gameResult.player2Id !== userId) {
      return res.status(403).json({ 
        ok: false, 
        error: 'You can only edit results for your own games' 
      });
    }

    // Create a new approval request for the opponent
    const opponentId = gameResult.player1Id === userId ? gameResult.player2Id : gameResult.player1Id;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Update the game result (reset verification)
    const updatedResult = await prisma.gameResult.update({
      where: { id: gameResultId },
      data: {
        ...updates,
        isVerified: false,
        verifiedAt: null,
        updatedAt: new Date()
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        mission: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true
          }
        }
      }
    });

    // Notify opponent about the edit
    await createInboxMessage(
      opponentId,
      userId,
      'GAME_RESULT_EDITED',
      'Game Result Edited',
      `Your opponent has edited the game result. Please review the changes and approve or suggest modifications.`,
      {
        gameResultId: gameResultId,
        editedBy: userId,
        reason: reason,
        changes: updates,
        expiresAt: expiresAt.toISOString()
      }
    );

    res.json({
      ok: true,
      gameResult: updatedResult,
      message: 'Game result updated and sent for re-approval'
    });

  } catch (error) {
    console.error('Error editing game result:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to edit game result' 
    });
  }
}

// Get game result approval history
export async function getGameResultHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { gameResultId } = req.params;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Get the game result with full history
    const gameResult = await prisma.gameResult.findUnique({
      where: { id: gameResultId },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        mission: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true
          }
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
      }
    });

    if (!gameResult) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game result not found' 
      });
    }

    // Check if user is one of the players
    if (gameResult.player1Id !== userId && gameResult.player2Id !== userId) {
      return res.status(403).json({ 
        ok: false, 
        error: 'You can only view history for your own games' 
      });
    }

    res.json({
      ok: true,
      gameResult
    });

  } catch (error) {
    console.error('Error fetching game result history:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch game result history' 
    });
  }
}

// Admin override - force approve/reject game result
export async function adminOverrideGameResult(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { gameResultId, action, reason } = req.body;

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

    if (!gameResultId || !action) {
      return res.status(400).json({ 
        ok: false, 
        error: 'gameResultId and action are required' 
      });
    }

    const gameResult = await prisma.gameResult.findUnique({
      where: { id: gameResultId },
      include: {
        player1: true,
        player2: true
      }
    });

    if (!gameResult) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game result not found' 
      });
    }

    if (action === 'approve') {
      // Force approve
      const updatedResult = await prisma.gameResult.update({
        where: { id: gameResultId },
        data: {
          isVerified: true,
          verifiedAt: new Date()
        }
      });

      // Notify both players
      await createInboxMessage(
        gameResult.player1Id,
        userId,
        'GAME_RESULT_ADMIN_APPROVED',
        'Game Result Admin Approved',
        `Your game result was approved by an administrator.`,
        {
          gameResultId: gameResultId,
          approvedBy: userId,
          reason: reason
        }
      );

      await createInboxMessage(
        gameResult.player2Id,
        userId,
        'GAME_RESULT_ADMIN_APPROVED',
        'Game Result Admin Approved',
        `A game result was approved by an administrator.`,
        {
          gameResultId: gameResultId,
          approvedBy: userId,
          reason: reason
        }
      );

      res.json({
        ok: true,
        gameResult: updatedResult,
        message: 'Game result force approved by admin'
      });

    } else if (action === 'reject') {
      // Force reject and delete
      await prisma.gameResult.delete({
        where: { id: gameResultId }
      });

      // Notify both players
      await createInboxMessage(
        gameResult.player1Id,
        userId,
        'GAME_RESULT_ADMIN_REJECTED',
        'Game Result Admin Rejected',
        `Your game result was rejected by an administrator.`,
        {
          originalGameResultId: gameResultId,
          rejectedBy: userId,
          reason: reason
        }
      );

      await createInboxMessage(
        gameResult.player2Id,
        userId,
        'GAME_RESULT_ADMIN_REJECTED',
        'Game Result Admin Rejected',
        `A game result was rejected by an administrator.`,
        {
          originalGameResultId: gameResultId,
          rejectedBy: userId,
          reason: reason
        }
      );

      res.json({
        ok: true,
        message: 'Game result force rejected by admin'
      });
    } else {
      res.status(400).json({ 
        ok: false, 
        error: 'Invalid action. Use "approve" or "reject"' 
      });
    }

  } catch (error) {
    console.error('Error in admin override:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to process admin override' 
    });
  }
}

// Get pending game result approvals for user
export async function getPendingGameResultApprovals(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Get unverified game results where user is the opponent
    const pendingApprovals = await prisma.gameResult.findMany({
      where: {
        isVerified: false,
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ],
        reportedById: {
          not: userId // Exclude results reported by the user themselves
        }
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        mission: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true
          }
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        scheduledGame: {
          select: {
            id: true,
            scheduledDate: true,
            location: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      ok: true,
      pendingApprovals
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch pending approvals' 
    });
  }
}

// Get comprehensive user statistics
export async function getUserComprehensiveStats(req: Request, res: Response) {
  try {
    console.log('🔍 getUserComprehensiveStats called');
    const userId = (req as any).user?.id;
    console.log('🔍 userId:', userId);

    if (!userId) {
      console.log('❌ No userId found');
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Get basic game stats
    const gameStats = await prisma.gameResult.aggregate({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ],
        isVerified: true
      },
      _count: {
        id: true
      }
    });

    const wins = await prisma.gameResult.count({
      where: {
        winnerId: userId,
        isVerified: true
      }
    });

    const losses = await prisma.gameResult.count({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ],
        winnerId: {
          not: userId
        },
        result: {
          not: 'DRAW'
        },
        isVerified: true
      }
    });

    const draws = await prisma.gameResult.count({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ],
        result: 'DRAW',
        isVerified: true
      }
    });

    const totalGames = wins + losses + draws;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    // Get total play time
    const totalPlayTime = await prisma.gameResult.aggregate({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ],
        isVerified: true,
        durationMinutes: {
          not: null
        }
      },
      _sum: {
        durationMinutes: true
      }
    });

    // Get favorite missions
    const favoriteMissions = await prisma.gameResult.groupBy({
      by: ['missionId'],
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ],
        isVerified: true,
        missionId: {
          not: null
        }
      },
      _count: {
        missionId: true
      },
      orderBy: {
        _count: {
          missionId: 'desc'
        }
      },
      take: 5
    });

    const missionsWithNames = await Promise.all(
      favoriteMissions.map(async (mission) => {
        const missionData = await prisma.mission.findUnique({
          where: { id: mission.missionId! },
          select: { id: true, name: true, thumbnailUrl: true }
        });
        return {
          ...mission,
          mission: missionData
        };
      })
    );

    // Get favorite characters (from character results)
    const favoriteCharacters = await prisma.gameResultCharacter.groupBy({
      by: ['characterId'],
      where: {
        playerId: userId
      },
      _count: {
        characterId: true
      },
      orderBy: {
        _count: {
          characterId: 'desc'
        }
      },
      take: 10
    });

    const charactersWithNames = await Promise.all(
      favoriteCharacters.map(async (char) => {
        const characterData = await prisma.character.findUnique({
          where: { id: char.characterId },
          select: { id: true, name: true, portraitUrl: true }
        });
        return {
          ...char,
          character: characterData
        };
      })
    );

    // Get collection statistics
    const totalCharacters = await prisma.character.count();
    const ownedCharacters = await prisma.characterCollection.count({
      where: {
        userId: userId,
        isOwned: true
      }
    });

    const totalSets = await prisma.set.count();
    const ownedSets = await prisma.setCollection.count({
      where: {
        userId: userId,
        isOwned: true
      }
    });

    const totalMissions = await prisma.mission.count();
    const ownedMissions = await prisma.missionCollection.count({
      where: {
        userId: userId,
        isOwned: true
      }
    });

    // Get favorite cards (most favorited)
    const favoriteCards = await prisma.characterCollection.findMany({
      where: {
        userId: userId,
        isFavorite: true
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            portraitUrl: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // Get recent activity
    const recentGames = await prisma.gameResult.findMany({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ],
        isVerified: true
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        mission: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true
          }
        }
      },
      orderBy: {
        playedAt: 'desc'
      },
      take: 5
    });

    // Get strike team statistics
    const strikeTeamStats = await prisma.strikeTeam.aggregate({
      where: {
        userId: userId
      },
      _count: {
        id: true
      }
    });

    const strikeTeamWins = await prisma.strikeTeam.aggregate({
      where: {
        userId: userId
      },
      _sum: {
        wins: true
      }
    });

    const strikeTeamLosses = await prisma.strikeTeam.aggregate({
      where: {
        userId: userId
      },
      _sum: {
        losses: true
      }
    });

    // Get challenges statistics
    const challengesSent = await prisma.challenge.count({
      where: {
        challengerId: userId
      }
    });

    const challengesReceived = await prisma.challenge.count({
      where: {
        challengedId: userId
      }
    });

    const challengesAccepted = await prisma.challenge.count({
      where: {
        challengedId: userId,
        status: 'ACCEPTED'
      }
    });

    // Get faction statistics
    const factionStats = await prisma.character.groupBy({
      by: ['faction'],
      _count: {
        faction: true
      },
      orderBy: {
        _count: {
          faction: 'desc'
        }
      }
    });

    // Get user's owned characters count
    const userOwnedCharacters = await prisma.characterCollection.count({
      where: {
        userId: userId,
        isOwned: true
      }
    });

    // Get character faction data for owned characters
    const ownedCharacterIds = await prisma.characterCollection.findMany({
      where: {
        userId: userId,
        isOwned: true
      },
      select: {
        characterId: true
      }
    });

    const ownedCharactersWithFactions = await prisma.character.findMany({
      where: {
        id: {
          in: ownedCharacterIds.map(c => c.characterId)
        }
      },
      select: {
        id: true,
        faction: true
      }
    });

    // Calculate faction completion
    const factionCompletion = factionStats.map(faction => {
      const ownedInFaction = ownedCharactersWithFactions.filter(char => char.faction === faction.faction).length;
      const totalInFaction = faction._count.faction;
      const completion = totalInFaction > 0 ? Math.round((ownedInFaction / totalInFaction) * 100) : 0;
      
      return {
        faction: faction.faction,
        owned: ownedInFaction,
        total: totalInFaction,
        completion: completion
      };
    });

    // Get shelf of shame (unpainted characters)
    const shelfOfShame = await prisma.characterCollection.findMany({
      where: {
        userId: userId,
        isOwned: true,
        isPainted: false
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            portraitUrl: true,
            faction: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate collection completion percentages
    const characterCompletion = totalCharacters > 0 ? Math.round((ownedCharacters / totalCharacters) * 100) : 0;
    const setCompletion = totalSets > 0 ? Math.round((ownedSets / totalSets) * 100) : 0;
    const missionCompletion = totalMissions > 0 ? Math.round((ownedMissions / totalMissions) * 100) : 0;

    // Get user's unlocked achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId: userId,
        isCompleted: true
      },
      include: {
        achievement: true
      },
      orderBy: {
        unlockedAt: 'desc'
      }
    });

    // Check and unlock new achievements
    const { checkAndUnlockAchievements } = await import('./achievements-api.js');
    const newlyUnlocked = await checkAndUnlockAchievements(userId);

    // Get updated achievements if any were unlocked
    const updatedUserAchievements = newlyUnlocked.length > 0 
      ? await prisma.userAchievement.findMany({
          where: {
            userId: userId,
            isCompleted: true
          },
          include: {
            achievement: true
          },
          orderBy: {
            unlockedAt: 'desc'
          }
        })
      : userAchievements;

    res.json({
      ok: true,
      stats: {
        // Game Statistics
        gamesPlayed: totalGames,
        wins: wins,
        losses: losses,
        draws: draws,
        winRate: winRate,
        totalPlayTimeHours: totalPlayTime._sum.durationMinutes ? Math.round((totalPlayTime._sum.durationMinutes / 60) * 10) / 10 : 0,
        
        // Collection Statistics
        collection: {
          characters: {
            owned: ownedCharacters,
            total: totalCharacters,
            completion: characterCompletion
          },
          sets: {
            owned: ownedSets,
            total: totalSets,
            completion: setCompletion
          },
          missions: {
            owned: ownedMissions,
            total: totalMissions,
            completion: missionCompletion
          },
          factions: factionCompletion
        },
        
        // Shelf of Shame
        shelfOfShame: shelfOfShame,
        
        // Favorites
        favoriteMissions: missionsWithNames,
        favoriteCharacters: charactersWithNames,
        favoriteCards: favoriteCards,
        
        // Strike Team Statistics
        strikeTeams: {
          total: strikeTeamStats._count.id,
          totalWins: strikeTeamWins._sum.wins || 0,
          totalLosses: strikeTeamLosses._sum.losses || 0
        },
        
        // Challenge Statistics
        challenges: {
          sent: challengesSent,
          received: challengesReceived,
          accepted: challengesAccepted
        },
        
        // Recent Activity
        recentGames: recentGames,
        
        // Achievements
        achievements: updatedUserAchievements.map(ua => ({
          id: ua.achievement.id,
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          rarity: ua.achievement.rarity,
          category: ua.achievement.category,
          unlockedAt: ua.unlockedAt
        })),
        
        // Newly unlocked achievements (for notifications)
        newlyUnlocked: newlyUnlocked.map(achievement => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching comprehensive user stats:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch user statistics' 
    });
  }
}

// Edit and reschedule approved game
export async function editApprovedGame(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { gameId, updates } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!gameId || !updates) {
      return res.status(400).json({ 
        ok: false, 
        error: 'gameId and updates are required' 
      });
    }

    // Get the game
    const game = await prisma.scheduledGame.findUnique({
      where: { id: gameId },
      include: {
        player1: true,
        player2: true
      }
    });

    if (!game) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game not found' 
      });
    }

    // Check if user is the host
    if (game.player1Id !== userId) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Only the game host can edit the game' 
      });
    }

    // Update the game
    const updatedGame = await prisma.scheduledGame.update({
      where: { id: gameId },
      data: {
        ...updates,
        status: 'SCHEDULED', // Reset to scheduled for new approval
        confirmedAt: null
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        mission: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true
          }
        }
      }
    });

    // Notify the opponent about the changes
    if (game.player2Id) {
      await createInboxMessage(
        game.player2Id,
        userId,
        'GAME_UPDATED',
        'Game Updated',
        `The game has been updated and requires your approval for the new details.`,
        {
          gameId: gameId,
          updates: updates,
          updatedBy: userId
        }
      );
    }

    res.json({
      ok: true,
      game: updatedGame,
      message: 'Game updated and opponent notified'
    });

  } catch (error) {
    console.error('Error editing approved game:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to edit game' 
    });
  }
}
