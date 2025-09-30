import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createInboxMessage } from './inbox-api.js';

const prisma = new PrismaClient();

// ===== PUBLIC GAMES API =====

export async function getPublicGames(req: Request, res: Response) {
  try {
    const { page = '1', limit = '20', missionId, location, dateFrom, dateTo } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {
      isPublic: true,
      status: 'SCHEDULED'
    };

    if (missionId) {
      whereClause.missionId = missionId;
    }

    if (location) {
      whereClause.location = {
        contains: location as string,
        mode: 'insensitive'
      };
    }

    if (dateFrom || dateTo) {
      whereClause.scheduledDate = {};
      if (dateFrom) {
        whereClause.scheduledDate.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        whereClause.scheduledDate.lte = new Date(dateTo as string);
      }
    }

    const [games, total] = await Promise.all([
      prisma.scheduledGame.findMany({
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
          mission: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          registrations: {
            where: { 
              status: { in: ['APPROVED', 'PENDING', 'WAITLIST'] }
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatarUrl: true
                }
              }
            }
          },
          _count: {
            select: {
              registrations: {
                where: { status: 'APPROVED' }
              }
            }
          }
        },
        orderBy: { scheduledDate: 'asc' },
        skip,
        take: Number(limit)
      }),
      prisma.scheduledGame.count({
        where: whereClause
      })
    ]);

    res.json({
      ok: true,
      games,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching public games:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch public games'
    });
  }
}

export async function createPublicGame(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { missionId, scheduledDate, location, address, notes, maxPlayers = 2 } = req.body;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    if (!missionId || !scheduledDate || !location) {
      return res.status(400).json({
        ok: false,
        error: 'Mission ID, scheduled date, and location are required'
      });
    }

    // Verify mission exists
    const mission = await prisma.mission.findUnique({
      where: { id: missionId }
    });

    if (!mission) {
      return res.status(404).json({
        ok: false,
        error: 'Mission not found'
      });
    }

    // Create challenge first (required for ScheduledGame)
    const challenge = await prisma.challenge.create({
      data: {
        challengerId: userId,
        challengedId: userId, // Self-challenge for public games
        status: 'ACCEPTED',
        skillLevel: 'INTERMEDIATE',
        missionId,
        location,
        description: `Public game: ${notes || 'Join us for a game!'}`
      }
    });

    // Create public scheduled game
    const game = await prisma.scheduledGame.create({
      data: {
        challengeId: challenge.id,
        player1Id: userId,
        player2Id: userId, // Will be updated when someone joins
        scheduledDate: new Date(scheduledDate),
        location,
        address,
        missionId,
        notes,
        isPublic: true,
        maxPlayers: Number(maxPlayers)
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
            description: true
          }
        }
      }
    });

    res.status(201).json({
      ok: true,
      game
    });
  } catch (error) {
    console.error('Error creating public game:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to create public game'
    });
  }
}

export async function registerForGame(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { notes } = req.body;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    // Check if game exists and is public
    const game = await prisma.scheduledGame.findFirst({
      where: {
        id,
        isPublic: true,
        status: 'SCHEDULED'
      },
      include: {
        registrations: {
          where: { status: 'APPROVED' },
          select: { userId: true }
        }
      }
    });

    if (!game) {
      return res.status(404).json({
        ok: false,
        error: 'Public game not found or not available for registration'
      });
    }

    // Check if user is already registered
    const existingRegistration = await prisma.gameRegistration.findFirst({
      where: {
        gameId: id,
        userId
      }
    });

    if (existingRegistration) {
      return res.status(400).json({
        ok: false,
        error: 'You are already registered for this game'
      });
    }

    // Check current player count
    const currentPlayerCount = game.registrations.filter(r => r.status === 'APPROVED').length + 
                               (game.player1Id === game.player2Id ? 1 : 2);
    
    // Determine registration status
    let registrationStatus = 'PENDING';
    let waitlistPosition = null;
    
    if (currentPlayerCount >= game.maxPlayers!) {
      // Game is full, add to waitlist
      registrationStatus = 'WAITLIST';
      
      // Get next waitlist position
      const lastWaitlistPosition = await prisma.gameRegistration.findFirst({
        where: {
          gameId: id,
          status: 'WAITLIST',
          waitlistPosition: { not: null }
        },
        orderBy: { waitlistPosition: 'desc' }
      });
      
      waitlistPosition = lastWaitlistPosition ? lastWaitlistPosition.waitlistPosition! + 1 : 1;
    }

    // Create registration
    const registration = await prisma.gameRegistration.create({
      data: {
        gameId: id,
        userId,
        notes,
        status: registrationStatus,
        waitlistPosition
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            email: true
          }
        }
      }
    });

    // Send inbox message to game host
    const messageContent = registrationStatus === 'WAITLIST' 
      ? `${registration.user.name || registration.user.username} has been added to the waitlist for your public game "${game.mission?.name || 'Untitled Game'}" on ${new Date(game.scheduledDate).toLocaleString()} (Position #${waitlistPosition}).`
      : `${registration.user.name || registration.user.username} wants to join your public game "${game.mission?.name || 'Untitled Game'}" on ${new Date(game.scheduledDate).toLocaleString()}. Click to approve or reject.`;
    
    await createInboxMessage({
      recipientId: game.player1Id,
      type: 'GAME_REGISTRATION',
      title: registrationStatus === 'WAITLIST' ? 'New Waitlist Registration' : 'New Game Registration',
      content: messageContent,
      metadata: {
        gameId: id,
        registrationId: registration.id,
        playerName: registration.user.name || registration.user.username,
        gameDate: game.scheduledDate,
        missionName: game.mission?.name || 'Untitled Game',
        status: registrationStatus,
        waitlistPosition
      }
    });

    res.status(201).json({
      ok: true,
      registration
    });
  } catch (error) {
    console.error('Error registering for game:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to register for game'
    });
  }
}

export async function getGameRegistrations(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    // Check if user owns the game
    const game = await prisma.scheduledGame.findFirst({
      where: {
        id,
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ]
      }
    });

    if (!game) {
      return res.status(404).json({
        ok: false,
        error: 'Game not found or access denied'
      });
    }

    const registrations = await prisma.gameRegistration.findMany({
      where: { gameId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            email: true
          }
        }
      },
      orderBy: { registeredAt: 'desc' }
    });

    res.json({
      ok: true,
      registrations
    });
  } catch (error) {
    console.error('Error fetching game registrations:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch game registrations'
    });
  }
}

export async function updateRegistrationStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { id, registrationId } = req.params;
    const { status, notes } = req.body;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    // Check if user owns the game
    const game = await prisma.scheduledGame.findFirst({
      where: {
        id,
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ]
      }
    });

    if (!game) {
      return res.status(404).json({
        ok: false,
        error: 'Game not found or access denied'
      });
    }

    // Update registration status
    const updateData: any = { status };
    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectedAt = new Date();
    }
    if (notes) {
      updateData.notes = notes;
    }

    const registration = await prisma.gameRegistration.update({
      where: { id: registrationId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            email: true
          }
        }
      }
    });

    // If approved, check if we need to update player2 and send confirmation
    if (status === 'APPROVED') {
      const approvedRegistrations = await prisma.gameRegistration.count({
        where: {
          gameId: id,
          status: 'APPROVED'
        }
      });

      // If this is the first approved registration and game doesn't have player2 yet
      if (approvedRegistrations === 1 && game.player1Id === game.player2Id) {
        await prisma.scheduledGame.update({
          where: { id },
          data: { player2Id: registration.userId }
        });
      }

      // Send confirmation message to the registered player
      await createInboxMessage({
        recipientId: registration.userId,
        type: 'GAME_APPROVED',
        title: 'Game Registration Approved',
        content: `Your registration for the game "${game.mission?.name || 'Untitled Game'}" on ${new Date(game.scheduledDate).toLocaleString()} has been approved! You can now set up reminders and add it to your calendar.`,
        metadata: {
          gameId: id,
          registrationId: registration.id,
          gameDate: game.scheduledDate,
          missionName: game.mission?.name || 'Untitled Game',
          location: game.location
        }
      });
    } else if (status === 'REJECTED') {
      // Send rejection message to the registered player
      await createInboxMessage({
        recipientId: registration.userId,
        type: 'GAME_REJECTED',
        title: 'Game Registration Rejected',
        content: `Your registration for the game "${game.mission?.name || 'Untitled Game'}" on ${new Date(game.scheduledDate).toLocaleString()} has been rejected.`,
        metadata: {
          gameId: id,
          registrationId: registration.id,
          gameDate: game.scheduledDate,
          missionName: game.mission?.name || 'Untitled Game'
        }
      });
    }

    res.json({
      ok: true,
      registration
    });
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to update registration status'
    });
  }
}

export async function cancelRegistration(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { id, registrationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    // Check if registration belongs to user or user owns the game
    const registration = await prisma.gameRegistration.findFirst({
      where: {
        id: registrationId,
        gameId: id,
        OR: [
          { userId },
          {
            game: {
              OR: [
                { player1Id: userId },
                { player2Id: userId }
              ]
            }
          }
        ]
      }
    });

    if (!registration) {
      return res.status(404).json({
        ok: false,
        error: 'Registration not found or access denied'
      });
    }

    await prisma.gameRegistration.update({
      where: { id: registrationId },
      data: { status: 'CANCELLED' }
    });

    res.json({
      ok: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to cancel registration'
    });
  }
}

export async function approveRegistrationFromInbox(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { registrationId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    // Find registration and verify user owns the game
    const registration = await prisma.gameRegistration.findFirst({
      where: {
        id: registrationId,
        game: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ]
        }
      },
      include: {
        game: {
          include: {
            mission: {
              select: {
                name: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!registration) {
      return res.status(404).json({
        ok: false,
        error: 'Registration not found or access denied'
      });
    }

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const updateData: any = { status };
    
    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
    } else {
      updateData.rejectedAt = new Date();
    }

    const updatedRegistration = await prisma.gameRegistration.update({
      where: { id: registrationId },
      data: updateData
    });

    // If approved, check if we need to update player2
    if (status === 'APPROVED') {
      const approvedRegistrations = await prisma.gameRegistration.count({
        where: {
          gameId: registration.gameId,
          status: 'APPROVED'
        }
      });

      // If this is the first approved registration and game doesn't have player2 yet
      if (approvedRegistrations === 1 && registration.game.player1Id === registration.game.player2Id) {
        await prisma.scheduledGame.update({
          where: { id: registration.gameId },
          data: { player2Id: registration.userId }
        });
      }

      // Send confirmation message to the registered player
      await createInboxMessage({
        recipientId: registration.userId,
        type: 'GAME_APPROVED',
        title: 'Game Registration Approved',
        content: `Your registration for the game "${registration.game.mission?.name || 'Untitled Game'}" on ${new Date(registration.game.scheduledDate).toLocaleString()} has been approved! You can now set up reminders and add it to your calendar.`,
        metadata: {
          gameId: registration.gameId,
          registrationId: registration.id,
          gameDate: registration.game.scheduledDate,
          missionName: registration.game.mission?.name || 'Untitled Game',
          location: registration.game.location
        }
      });
    } else {
      // Send rejection message to the registered player
      await createInboxMessage({
        recipientId: registration.userId,
        type: 'GAME_REJECTED',
        title: 'Game Registration Rejected',
        content: `Your registration for the game "${registration.game.mission?.name || 'Untitled Game'}" on ${new Date(registration.game.scheduledDate).toLocaleString()} has been rejected.`,
        metadata: {
          gameId: registration.gameId,
          registrationId: registration.id,
          gameDate: registration.game.scheduledDate,
          missionName: registration.game.mission?.name || 'Untitled Game'
        }
      });
    }

    res.json({
      ok: true,
      registration: updatedRegistration,
      action
    });
  } catch (error) {
    console.error('Error updating registration from inbox:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to update registration'
    });
  }
}

export default {
  getPublicGames,
  createPublicGame,
  registerForGame,
  getGameRegistrations,
  updateRegistrationStatus,
  cancelRegistration,
  approveRegistrationFromInbox
};
