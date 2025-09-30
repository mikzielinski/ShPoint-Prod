import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createInboxMessage } from './inbox-api.js';

const prisma = new PrismaClient();

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
