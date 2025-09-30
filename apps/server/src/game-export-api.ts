import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== GAME EXPORT API =====

export async function exportGameLog(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { gameSessionId, format = 'json', includeTurns = false } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!gameSessionId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'GameSessionId is required' 
      });
    }

    // Validate game session exists and user has access
    const gameSession = await prisma.gameSession.findFirst({
      where: {
        id: gameSessionId as string,
        gameResult: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ]
        }
      },
      include: {
        gameResult: {
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
                description: true,
                thumbnailUrl: true,
                mapSizeInch: true,
                mapUnit: true,
                mapOrigin: true,
                mapAxis: true,
                pointDiameterInch: true,
                pointColorActive: true,
                pointColorInactive: true
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
        },
        mission: {
          select: {
            id: true,
            name: true,
            description: true,
            thumbnailUrl: true,
            mapSizeInch: true,
            mapUnit: true,
            mapOrigin: true,
            mapAxis: true,
            pointDiameterInch: true,
            pointColorActive: true,
            pointColorInactive: true,
            objectives: {
              select: {
                id: true,
                key: true,
                x: true,
                y: true,
                radius: true
              }
            },
            struggles: {
              select: {
                id: true,
                index: true,
                cards: true
              }
            }
          }
        },
        struggleCards: {
          orderBy: { selectedAt: 'asc' }
        },
        characterStates: {
          include: {
            character: {
              select: {
                id: true,
                name: true,
                slug: true,
                faction: true,
                unitType: true,
                squadPoints: true,
                stamina: true,
                durability: true,
                force: true,
                hanker: true,
                portraitUrl: true,
                imageUrl: true
              }
            },
            player: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { updatedAt: 'asc' }
        },
        diceRolls: {
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
            },
            targetCharacter: {
              select: {
                id: true,
                name: true,
                portraitUrl: true
              }
            }
          },
          orderBy: { rolledAt: 'asc' }
        },
        nodeActivations: {
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
            },
            targetCharacter: {
              select: {
                id: true,
                name: true,
                portraitUrl: true
              }
            }
          },
          orderBy: { activatedAt: 'asc' }
        }
      }
    });

    if (!gameSession) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game session not found or access denied' 
      });
    }

    // Prepare export data
    const exportData = {
      gameSession: {
        id: gameSession.id,
        currentTier: gameSession.currentTier,
        isActive: gameSession.isActive,
        startedAt: gameSession.startedAt,
        completedAt: gameSession.completedAt,
        startingPositions: gameSession.startingPositions,
        setupData: gameSession.setupData
      },
      gameResult: {
        id: gameSession.gameResult.id,
        result: gameSession.gameResult.result,
        mode: gameSession.gameResult.mode,
        roundsPlayed: gameSession.gameResult.roundsPlayed,
        durationMinutes: gameSession.gameResult.durationMinutes,
        location: gameSession.gameResult.location,
        notes: gameSession.gameResult.notes,
        playedAt: gameSession.gameResult.playedAt,
        player1: gameSession.gameResult.player1,
        player2: gameSession.gameResult.player2,
        winner: gameSession.gameResult.winner,
        player1StrikeTeam: gameSession.gameResult.player1StrikeTeam,
        player2StrikeTeam: gameSession.gameResult.player2StrikeTeam
      },
      mission: gameSession.mission,
      struggleCards: gameSession.struggleCards,
      characterStates: gameSession.characterStates,
      diceRolls: gameSession.diceRolls,
      nodeActivations: gameSession.nodeActivations
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvData = generateCSV(exportData, includeTurns === 'true');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="game-log-${gameSessionId}.csv"`);
      res.send(csvData);
    } else {
      // JSON format (default)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="game-log-${gameSessionId}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting game log:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to export game log' 
    });
  }
}

export async function exportGameLogByTurn(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { gameSessionId, turn, format = 'json' } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!gameSessionId || !turn) {
      return res.status(400).json({ 
        ok: false, 
        error: 'GameSessionId and turn are required' 
      });
    }

    // Validate game session exists and user has access
    const gameSession = await prisma.gameSession.findFirst({
      where: {
        id: gameSessionId as string,
        gameResult: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ]
        }
      },
      include: {
        gameResult: {
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
                description: true,
                thumbnailUrl: true
              }
            }
          }
        },
        mission: {
          select: {
            id: true,
            name: true,
            description: true,
            thumbnailUrl: true
          }
        },
        struggleCards: {
          where: {
            // Filter by turn if we have turn-based data
          },
          orderBy: { selectedAt: 'asc' }
        },
        characterStates: {
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
          },
          orderBy: { updatedAt: 'asc' }
        },
        diceRolls: {
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
            },
            targetCharacter: {
              select: {
                id: true,
                name: true,
                portraitUrl: true
              }
            }
          },
          orderBy: { rolledAt: 'asc' }
        },
        nodeActivations: {
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
            },
            targetCharacter: {
              select: {
                id: true,
                name: true,
                portraitUrl: true
              }
            }
          },
          orderBy: { activatedAt: 'asc' }
        }
      }
    });

    if (!gameSession) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game session not found or access denied' 
      });
    }

    // Filter data by turn (this would need to be implemented based on your turn tracking)
    const turnNumber = parseInt(turn as string);
    
    // For now, we'll export all data and let the client filter by turn
    // In a real implementation, you'd filter the data based on turn timestamps or turn markers
    const exportData = {
      gameSession: {
        id: gameSession.id,
        currentTier: gameSession.currentTier,
        isActive: gameSession.isActive,
        startedAt: gameSession.startedAt,
        completedAt: gameSession.completedAt
      },
      gameResult: {
        id: gameSession.gameResult.id,
        result: gameSession.gameResult.result,
        mode: gameSession.gameResult.mode,
        roundsPlayed: gameSession.gameResult.roundsPlayed,
        player1: gameSession.gameResult.player1,
        player2: gameSession.gameResult.player2,
        mission: gameSession.gameResult.mission
      },
      mission: gameSession.mission,
      turn: turnNumber,
      struggleCards: gameSession.struggleCards,
      characterStates: gameSession.characterStates,
      diceRolls: gameSession.diceRolls,
      nodeActivations: gameSession.nodeActivations
    };

    if (format === 'csv') {
      const csvData = generateCSV(exportData, true);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="game-log-${gameSessionId}-turn-${turn}.csv"`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="game-log-${gameSessionId}-turn-${turn}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting game log by turn:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to export game log by turn' 
    });
  }
}

// Helper function to generate CSV
function generateCSV(data: any, includeTurns: boolean): string {
  const csvRows: string[] = [];
  
  // Game Session Info
  csvRows.push('Section,Field,Value');
  csvRows.push(`Game Session,ID,${data.gameSession.id}`);
  csvRows.push(`Game Session,Current Tier,${data.gameSession.currentTier}`);
  csvRows.push(`Game Session,Is Active,${data.gameSession.isActive}`);
  csvRows.push(`Game Session,Started At,${data.gameSession.startedAt}`);
  csvRows.push(`Game Session,Completed At,${data.gameSession.completedAt || 'N/A'}`);
  
  // Game Result Info
  csvRows.push(`Game Result,ID,${data.gameResult.id}`);
  csvRows.push(`Game Result,Result,${data.gameResult.result}`);
  csvRows.push(`Game Result,Mode,${data.gameResult.mode}`);
  csvRows.push(`Game Result,Rounds Played,${data.gameResult.roundsPlayed}`);
  csvRows.push(`Game Result,Duration Minutes,${data.gameResult.durationMinutes || 'N/A'}`);
  csvRows.push(`Game Result,Location,${data.gameResult.location || 'N/A'}`);
  csvRows.push(`Game Result,Player 1,${data.gameResult.player1.name || data.gameResult.player1.username}`);
  csvRows.push(`Game Result,Player 2,${data.gameResult.player2.name || data.gameResult.player2.username}`);
  csvRows.push(`Game Result,Winner,${data.gameResult.winner ? (data.gameResult.winner.name || data.gameResult.winner.username) : 'N/A'}`);
  
  // Mission Info
  csvRows.push(`Mission,Name,${data.mission.name}`);
  csvRows.push(`Mission,Description,${data.mission.description || 'N/A'}`);
  
  // Struggle Cards
  csvRows.push('');
  csvRows.push('Struggle Cards');
  csvRows.push('Tier,Card Name,Selected By,Is Active,Is Completed,Winner,Selected At,Completed At');
  data.struggleCards.forEach((card: any) => {
    csvRows.push(`${card.tier},${card.cardName},${card.selectedBy || 'N/A'},${card.isActive},${card.isCompleted},${card.winnerId || 'N/A'},${card.selectedAt},${card.completedAt || 'N/A'}`);
  });
  
  // Character States
  csvRows.push('');
  csvRows.push('Character States');
  csvRows.push('Character,Player,Stamina,Durability,Force,Hanker,Status,Damage Dealt,Damage Taken,Abilities Used,Objectives Secured,Is MVP,Updated At');
  data.characterStates.forEach((state: any) => {
    csvRows.push(`${state.character.name},${state.player.name || state.player.username},${state.currentStamina},${state.currentDurability},${state.currentForce || 'N/A'},${state.currentHanker || 'N/A'},${state.status},${state.damageDealt},${state.damageTaken},${state.abilitiesUsed},${state.objectivesSecured},${state.isMVP},${state.updatedAt}`);
  });
  
  // Dice Rolls
  csvRows.push('');
  csvRows.push('Dice Rolls');
  csvRows.push('Character,Player,Dice Type,Dice Count,Dice Results,Action,Target Character,Final Result,Rolled At');
  data.diceRolls.forEach((roll: any) => {
    csvRows.push(`${roll.character.name},${roll.player.name || roll.player.username},${roll.diceType},${roll.diceCount},"${roll.diceResults.join(',')}",${roll.action || 'N/A'},${roll.targetCharacter ? roll.targetCharacter.name : 'N/A'},${roll.finalResult || 'N/A'},${roll.rolledAt}`);
  });
  
  // Node Activations
  csvRows.push('');
  csvRows.push('Node Activations');
  csvRows.push('Character,Player,Node Path,Node Name,Activation Type,Trigger Action,Target Character,Damage Dealt,Conditions Applied,Activated At');
  data.nodeActivations.forEach((activation: any) => {
    csvRows.push(`${activation.character.name},${activation.player.name || activation.player.username},${activation.nodePath},${activation.nodeName},${activation.activationType},${activation.triggerAction || 'N/A'},${activation.targetCharacter ? activation.targetCharacter.name : 'N/A'},${activation.damageDealt || 'N/A'},"${activation.conditionsApplied.join(',')}",${activation.activatedAt}`);
  });
  
  return csvRows.join('\n');
}
