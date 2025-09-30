import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== DICE ROLLS API =====

export async function logDiceRoll(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const {
      gameSessionId,
      characterId,
      diceType,
      diceCount,
      diceResults,
      action,
      targetCharacterId,
      modifiers,
      finalResult
    } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!gameSessionId || !characterId || !diceType || !diceCount || !diceResults) {
      return res.status(400).json({ 
        ok: false, 
        error: 'GameSessionId, characterId, diceType, diceCount, and diceResults are required' 
      });
    }

    // Validate game session exists and user has access
    const gameSession = await prisma.gameSession.findFirst({
      where: {
        id: gameSessionId,
        gameResult: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ]
        }
      }
    });

    if (!gameSession) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game session not found or access denied' 
      });
    }

    // Validate character belongs to user
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        strikeTeamCharacters: {
          some: {
            strikeTeam: {
              userId: userId
            }
          }
        }
      }
    });

    if (!character) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Character not found or access denied' 
      });
    }

    const diceRoll = await prisma.diceRoll.create({
      data: {
        gameSessionId,
        characterId,
        playerId: userId,
        diceType: diceType as any,
        diceCount,
        diceResults: diceResults as any[],
        action,
        targetCharacterId,
        modifiers: modifiers ? JSON.stringify(modifiers) : null,
        finalResult
      },
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
      }
    });

    res.status(201).json({
      ok: true,
      diceRoll
    });
  } catch (error) {
    console.error('Error logging dice roll:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to log dice roll' 
    });
  }
}

export async function getDiceRolls(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { gameSessionId, characterId, diceType, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    let whereClause: any = {
      gameSession: {
        gameResult: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ]
        }
      }
    };

    if (gameSessionId) {
      whereClause.gameSessionId = gameSessionId;
    }

    if (characterId) {
      whereClause.characterId = characterId;
    }

    if (diceType) {
      whereClause.diceType = diceType;
    }

    const [diceRolls, total] = await Promise.all([
      prisma.diceRoll.findMany({
        where: whereClause,
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
        orderBy: { rolledAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.diceRoll.count({
        where: whereClause
      })
    ]);

    res.json({
      ok: true,
      diceRolls,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching dice rolls:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch dice rolls' 
    });
  }
}

// ===== NODE ACTIVATION API =====

export async function logNodeActivation(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const {
      gameSessionId,
      characterId,
      nodePath,
      nodeName,
      nodeEffects,
      activationType = 'MANUAL',
      triggerAction,
      targetCharacterId,
      effectsApplied,
      damageDealt,
      conditionsApplied = []
    } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!gameSessionId || !characterId || !nodePath || !nodeName || !nodeEffects) {
      return res.status(400).json({ 
        ok: false, 
        error: 'GameSessionId, characterId, nodePath, nodeName, and nodeEffects are required' 
      });
    }

    // Validate game session exists and user has access
    const gameSession = await prisma.gameSession.findFirst({
      where: {
        id: gameSessionId,
        gameResult: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ]
        }
      }
    });

    if (!gameSession) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game session not found or access denied' 
      });
    }

    // Validate character belongs to user
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        strikeTeamCharacters: {
          some: {
            strikeTeam: {
              userId: userId
            }
          }
        }
      }
    });

    if (!character) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Character not found or access denied' 
      });
    }

    const nodeActivation = await prisma.nodeActivation.create({
      data: {
        gameSessionId,
        characterId,
        playerId: userId,
        nodePath,
        nodeName,
        nodeEffects: JSON.stringify(nodeEffects),
        activationType,
        triggerAction,
        targetCharacterId,
        effectsApplied: effectsApplied ? JSON.stringify(effectsApplied) : null,
        damageDealt,
        conditionsApplied
      },
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
      }
    });

    res.status(201).json({
      ok: true,
      nodeActivation
    });
  } catch (error) {
    console.error('Error logging node activation:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to log node activation' 
    });
  }
}

export async function getNodeActivations(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { gameSessionId, characterId, activationType, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    let whereClause: any = {
      gameSession: {
        gameResult: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ]
        }
      }
    };

    if (gameSessionId) {
      whereClause.gameSessionId = gameSessionId;
    }

    if (characterId) {
      whereClause.characterId = characterId;
    }

    if (activationType) {
      whereClause.activationType = activationType;
    }

    const [nodeActivations, total] = await Promise.all([
      prisma.nodeActivation.findMany({
        where: whereClause,
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
        orderBy: { activatedAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.nodeActivation.count({
        where: whereClause
      })
    ]);

    res.json({
      ok: true,
      nodeActivations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching node activations:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch node activations' 
    });
  }
}

export async function updateNodeActivation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const {
      effectsApplied,
      damageDealt,
      conditionsApplied
    } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const nodeActivation = await prisma.nodeActivation.findFirst({
      where: {
        id,
        playerId: userId
      }
    });

    if (!nodeActivation) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Node activation not found or access denied' 
      });
    }

    const updateData: any = {};

    if (effectsApplied !== undefined) {
      updateData.effectsApplied = JSON.stringify(effectsApplied);
    }

    if (damageDealt !== undefined) {
      updateData.damageDealt = damageDealt;
    }

    if (conditionsApplied !== undefined) {
      updateData.conditionsApplied = conditionsApplied;
    }

    const updatedNodeActivation = await prisma.nodeActivation.update({
      where: { id },
      data: updateData,
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
      }
    });

    res.json({
      ok: true,
      nodeActivation: updatedNodeActivation
    });
  } catch (error) {
    console.error('Error updating node activation:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to update node activation' 
    });
  }
}

export async function deleteNodeActivation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const nodeActivation = await prisma.nodeActivation.findFirst({
      where: {
        id,
        playerId: userId
      }
    });

    if (!nodeActivation) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Node activation not found or access denied' 
      });
    }

    await prisma.nodeActivation.delete({
      where: { id }
    });

    res.json({
      ok: true,
      message: 'Node activation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting node activation:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to delete node activation' 
    });
  }
}
