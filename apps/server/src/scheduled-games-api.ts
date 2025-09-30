import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createInboxMessage } from './inbox-api';

const prisma = new PrismaClient();

// ===== SCHEDULED GAMES API =====

export async function getScheduledGames(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const whereClause: any = {
      OR: [
        { player1Id: userId },
        { player2Id: userId }
      ]
    };

    if (status) {
      whereClause.status = status;
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
              thumbnailUrl: true,
              description: true
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
          challenge: {
            select: {
              id: true,
              skillLevel: true,
              language: true
            }
          },
          reminders: {
            where: { userId },
            select: {
              id: true,
              type: true,
              reminderTime: true,
              isSent: true
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
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching scheduled games:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch scheduled games' 
    });
  }
}

export async function createScheduledGame(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const {
      challengeId,
      scheduledDate,
      location,
      address,
      missionId,
      player1StrikeTeamId,
      player2StrikeTeamId,
      notes
    } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!challengeId || !scheduledDate) {
      return res.status(400).json({ 
        ok: false, 
        error: 'ChallengeId and scheduledDate are required' 
      });
    }

    // Check if challenge exists and is accepted
    const challenge = await prisma.challenge.findFirst({
      where: {
        id: challengeId,
        status: 'ACCEPTED',
        OR: [
          { challengerId: userId },
          { challengedId: userId }
        ]
      },
      include: {
        challenger: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        challenged: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    if (!challenge) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Challenge not found or not accepted' 
      });
    }

    // Check if game is already scheduled for this challenge
    const existingGame = await prisma.scheduledGame.findUnique({
      where: { challengeId }
    });

    if (existingGame) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Game is already scheduled for this challenge' 
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
          userId: challenge.challengerId
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
          userId: challenge.challengedId
        }
      });

      if (!strikeTeam) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Player 2 strike team not found or access denied' 
        });
      }
    }

    const game = await prisma.scheduledGame.create({
      data: {
        challengeId,
        player1Id: challenge.challengerId,
        player2Id: challenge.challengedId,
        scheduledDate: new Date(scheduledDate),
        location,
        address,
        missionId,
        player1StrikeTeamId,
        player2StrikeTeamId,
        notes
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
            thumbnailUrl: true,
            description: true
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
        challenge: {
          select: {
            id: true,
            skillLevel: true,
            language: true
          }
        }
      }
    });

    // Send inbox messages to both players
    const otherPlayerId = userId === challenge.challengerId ? challenge.challengedId : challenge.challengerId;
    
    await Promise.all([
      createInboxMessage(
        challenge.challengerId,
        userId,
        'game_scheduled',
        'Game Scheduled',
        `Your game has been scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
        {
          gameId: game.id,
          scheduledDate: game.scheduledDate
        }
      ),
      createInboxMessage(
        challenge.challengedId,
        userId,
        'game_scheduled',
        'Game Scheduled',
        `Your game has been scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
        {
          gameId: game.id,
          scheduledDate: game.scheduledDate
        }
      )
    ]);

    res.status(201).json({
      ok: true,
      game
    });
  } catch (error) {
    console.error('Error creating scheduled game:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to create scheduled game' 
    });
  }
}

export async function updateScheduledGame(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const {
      scheduledDate,
      location,
      address,
      missionId,
      player1StrikeTeamId,
      player2StrikeTeamId,
      notes,
      status
    } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const game = await prisma.scheduledGame.findFirst({
      where: {
        id,
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ]
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game not found or access denied' 
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
    if (location !== undefined) updateData.location = location;
    if (address !== undefined) updateData.address = address;
    if (missionId !== undefined) updateData.missionId = missionId;
    if (player1StrikeTeamId !== undefined) updateData.player1StrikeTeamId = player1StrikeTeamId;
    if (player2StrikeTeamId !== undefined) updateData.player2StrikeTeamId = player2StrikeTeamId;
    if (notes !== undefined) updateData.notes = notes;

    if (status) {
      updateData.status = status;
      
      // Set appropriate timestamp based on status
      switch (status) {
        case 'CONFIRMED':
          updateData.confirmedAt = new Date();
          break;
        case 'IN_PROGRESS':
          updateData.startedAt = new Date();
          break;
        case 'COMPLETED':
          updateData.completedAt = new Date();
          break;
        case 'CANCELLED':
          updateData.cancelledAt = new Date();
          break;
      }
    }

    const updatedGame = await prisma.scheduledGame.update({
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
        mission: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
            description: true
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
        challenge: {
          select: {
            id: true,
            skillLevel: true,
            language: true
          }
        }
      }
    });

    // Send inbox message to the other player if status changed
    if (status) {
      const otherPlayerId = userId === game.player1Id ? game.player2Id : game.player1Id;
      
      await createInboxMessage(
        otherPlayerId,
        userId,
        'game_updated',
        'Game Updated',
        `The game status has been updated to ${status}`,
        {
          gameId: game.id,
          status,
          scheduledDate: updatedGame.scheduledDate
        }
      );
    }

    res.json({
      ok: true,
      game: updatedGame
    });
  } catch (error) {
    console.error('Error updating scheduled game:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to update scheduled game' 
    });
  }
}

export async function addGameReminder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { type, reminderTime } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!type || !reminderTime) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Type and reminderTime are required' 
      });
    }

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

    // Check if reminder already exists
    const existingReminder = await prisma.gameReminder.findFirst({
      where: {
        gameId: id,
        userId,
        type: type as any
      }
    });

    if (existingReminder) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Reminder of this type already exists' 
      });
    }

    const reminder = await prisma.gameReminder.create({
      data: {
        gameId: id,
        userId,
        type: type as any,
        reminderTime: new Date(reminderTime)
      }
    });

    res.status(201).json({
      ok: true,
      reminder
    });
  } catch (error) {
    console.error('Error adding game reminder:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to add game reminder' 
    });
  }
}

export async function removeGameReminder(req: Request, res: Response) {
  try {
    const { id, reminderId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const reminder = await prisma.gameReminder.findFirst({
      where: {
        id: reminderId,
        gameId: id,
        userId
      }
    });

    if (!reminder) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Reminder not found or access denied' 
      });
    }

    await prisma.gameReminder.delete({
      where: { id: reminderId }
    });

    res.json({
      ok: true,
      message: 'Reminder removed successfully'
    });
  } catch (error) {
    console.error('Error removing game reminder:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to remove game reminder' 
    });
  }
}

export async function generateCalendarEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { format = 'ics' } = req.query; // 'ics', 'google', 'outlook'

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const game = await prisma.scheduledGame.findFirst({
      where: {
        id,
        OR: [
          { player1Id: userId },
          { player2Id: userId }
        ]
      },
      include: {
        player1: {
          select: {
            name: true,
            username: true
          }
        },
        player2: {
          select: {
            name: true,
            username: true
          }
        },
        mission: {
          select: {
            name: true
          }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Game not found or access denied' 
      });
    }

    const eventData = {
      title: `Shatterpoint Game - ${game.mission?.name || 'Mission'}`,
      description: `Game between ${game.player1.name || game.player1.username} and ${game.player2.name || game.player2.username}`,
      startDate: game.scheduledDate,
      endDate: new Date(game.scheduledDate.getTime() + 3 * 60 * 60 * 1000), // 3 hours duration
      location: game.location || game.address || 'TBD',
      attendees: [
        game.player1.name || game.player1.username,
        game.player2.name || game.player2.username
      ]
    };

    if (format === 'ics') {
      // Generate ICS format
      const icsContent = generateICS(eventData);
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="shatterpoint-game-${id}.ics"`);
      res.send(icsContent);
    } else if (format === 'google') {
      // Generate Google Calendar URL
      const googleUrl = generateGoogleCalendarURL(eventData);
      res.json({
        ok: true,
        url: googleUrl
      });
    } else if (format === 'outlook') {
      // Generate Outlook Calendar URL
      const outlookUrl = generateOutlookCalendarURL(eventData);
      res.json({
        ok: true,
        url: outlookUrl
      });
    } else {
      res.status(400).json({ 
        ok: false, 
        error: 'Invalid format. Use ics, google, or outlook' 
      });
    }
  } catch (error) {
    console.error('Error generating calendar event:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to generate calendar event' 
    });
  }
}

// Helper functions for calendar generation
function generateICS(eventData: any): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ShPoint//Shatterpoint Game//EN
BEGIN:VEVENT
UID:${eventData.startDate.getTime()}@shpoint.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(eventData.startDate)}
DTEND:${formatDate(eventData.endDate)}
SUMMARY:${eventData.title}
DESCRIPTION:${eventData.description}
LOCATION:${eventData.location}
END:VEVENT
END:VCALENDAR`;
}

function generateGoogleCalendarURL(eventData: any): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventData.title,
    dates: `${formatDateForURL(eventData.startDate)}/${formatDateForURL(eventData.endDate)}`,
    details: eventData.description,
    location: eventData.location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateOutlookCalendarURL(eventData: any): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: eventData.title,
    startdt: eventData.startDate.toISOString(),
    enddt: eventData.endDate.toISOString(),
    body: eventData.description,
    location: eventData.location
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function formatDateForURL(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
