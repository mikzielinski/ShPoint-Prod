import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createInboxMessage } from './inbox-api.js';

const prisma = new PrismaClient();

// ===== CHALLENGES API =====

export async function getChallenges(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { type = 'all', page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    let whereClause: any = {};

    switch (type) {
      case 'sent':
        whereClause.challengerId = userId;
        break;
      case 'received':
        whereClause.challengedId = userId;
        break;
      case 'pending':
        whereClause = {
          OR: [
            { challengerId: userId, status: 'PENDING' },
            { challengedId: userId, status: 'PENDING' }
          ]
        };
        break;
      case 'active':
        whereClause = {
          OR: [
            { challengerId: userId, status: 'ACCEPTED' },
            { challengedId: userId, status: 'ACCEPTED' }
          ]
        };
        break;
      default: // 'all'
        whereClause = {
          OR: [
            { challengerId: userId },
            { challengedId: userId }
          ]
        };
    }

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where: whereClause,
        include: {
          challenger: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          challenged: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          challengerStrikeTeam: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          scheduledGame: {
            include: {
              mission: {
                select: {
                  id: true,
                  name: true,
                  thumbnailUrl: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.challenge.count({
        where: whereClause
      })
    ]);

    res.json({
      ok: true,
      challenges,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch challenges' 
    });
  }
}

export async function createChallenge(req: Request, res: Response) {
  try {
    console.log('🔍 Creating challenge with data:', req.body);
    
    const userId = (req as any).user?.id;
    const {
      challengedId,
      preferredMissions = [],
      challengerStrikeTeamId,
      language = 'en',
      location,
      address,
      reservationCost,
      description
    } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!challengedId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'ChallengedId is required' 
      });
    }

    if (challengedId === userId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Cannot challenge yourself' 
      });
    }

    // Check if challenged user exists
    const challengedUser = await prisma.user.findUnique({
      where: { id: challengedId }
    });

    if (!challengedUser) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Challenged user not found' 
      });
    }

    // Check if there's already a pending challenge between these users
    const existingChallenge = await prisma.challenge.findFirst({
      where: {
        OR: [
          {
            challengerId: userId,
            challengedId,
            status: 'PENDING'
          },
          {
            challengerId: challengedId,
            challengedId: userId,
            status: 'PENDING'
          }
        ]
      }
    });

    if (existingChallenge) {
      return res.status(400).json({ 
        ok: false, 
        error: 'There is already a pending challenge between these users' 
      });
    }

    // Clean up empty strings to null for optional fields
    const cleanChallengerStrikeTeamId = challengerStrikeTeamId && challengerStrikeTeamId.trim() !== '' ? challengerStrikeTeamId : null;
    
    // Validate strike team if provided
    if (cleanChallengerStrikeTeamId) {
      const strikeTeam = await prisma.strikeTeam.findFirst({
        where: {
          id: cleanChallengerStrikeTeamId,
          userId
        }
      });

      if (!strikeTeam) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Strike team not found or access denied' 
        });
      }
    }

    const challenge = await prisma.challenge.create({
      data: {
        challengerId: userId,
        challengedId,
        preferredMissions,
        challengerStrikeTeamId: cleanChallengerStrikeTeamId,
        language,
        location: location || null,
        address: address || null,
        reservationCost: reservationCost ? parseFloat(reservationCost) : null,
        description: description || null
      },
      include: {
        challenger: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        challenged: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        challengerStrikeTeam: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    // Send inbox message to challenged user
    const challengerName = challenge.challenger.name || challenge.challenger.username || 'Unknown User';
    await createInboxMessage(
      challengedId,
      userId,
      'challenge',
      'New Challenge Received',
      `You have received a new challenge from ${challengerName}`,
      {
        challengeId: challenge.id,
        preferredMissions: challenge.preferredMissions
      }
    );

    res.status(201).json({
      ok: true,
      challenge
    });
  } catch (error) {
    console.error('❌ Error creating challenge:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to create challenge',
      details: error.message 
    });
  }
}

export async function respondToChallenge(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Action must be "accept" or "decline"' 
      });
    }

    const challenge = await prisma.challenge.findFirst({
      where: {
        id,
        challengedId: userId,
        status: 'PENDING'
      },
      include: {
        challenger: {
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
        error: 'Challenge not found or already responded to' 
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (action === 'accept') {
      updateData.status = 'ACCEPTED';
      updateData.acceptedAt = new Date();
    } else {
      updateData.status = 'DECLINED';
      updateData.declinedAt = new Date();
    }

    const updatedChallenge = await prisma.challenge.update({
      where: { id },
      data: updateData,
      include: {
        challenger: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        challenged: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        challengerStrikeTeam: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    // Send inbox message to challenger
    const actionText = action === 'accept' ? 'accepted' : 'declined';
    await createInboxMessage(
      challenge.challengerId,
      userId,
      'challenge_response',
      `Challenge ${actionText}`,
      `Your challenge has been ${actionText}`,
      {
        challengeId: challenge.id,
        action
      }
    );

    res.json({
      ok: true,
      challenge: updatedChallenge,
      message: `Challenge ${actionText} successfully`
    });
  } catch (error) {
    console.error('Error responding to challenge:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to respond to challenge' 
    });
  }
}

export async function cancelChallenge(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const challenge = await prisma.challenge.findFirst({
      where: {
        id,
        challengerId: userId,
        status: { in: ['PENDING', 'ACCEPTED'] }
      },
      include: {
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
        error: 'Challenge not found or cannot be cancelled' 
      });
    }

    const updatedChallenge = await prisma.challenge.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Send inbox message to challenged user
    await createInboxMessage(
      challenge.challengedId,
      userId,
      'challenge_cancelled',
      'Challenge Cancelled',
      'A challenge you were involved in has been cancelled',
      {
        challengeId: challenge.id
      }
    );

    res.json({
      ok: true,
      challenge: updatedChallenge,
      message: 'Challenge cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling challenge:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to cancel challenge' 
    });
  }
}

export async function acceptChallenge(req: Request, res: Response) {
  try {
    const { challengeId, scheduledDate, location, mission } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!challengeId || !scheduledDate || !location) {
      return res.status(400).json({
        ok: false,
        error: 'challengeId, scheduledDate, and location are required'
      });
    }

    // Find the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        challenger: {
          select: { id: true, name: true, username: true, email: true }
        },
        challenged: {
          select: { id: true, name: true, username: true, email: true }
        }
      }
    });

    if (!challenge) {
      return res.status(404).json({
        ok: false,
        error: 'Challenge not found'
      });
    }

    if (challenge.challengedId !== userId) {
      return res.status(403).json({
        ok: false,
        error: 'You can only accept challenges sent to you'
      });
    }

    if (challenge.status !== 'PENDING') {
      return res.status(400).json({
        ok: false,
        error: 'Challenge is no longer pending'
      });
    }

    // Update challenge status to ACCEPTED
    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: { 
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    // Create a scheduled game
    const scheduledGame = await prisma.scheduledGame.create({
      data: {
        player1Id: challenge.challengerId,
        player2Id: challenge.challengedId,
        scheduledDate: new Date(scheduledDate),
        location,
        status: 'SCHEDULED',
        challengeId: challengeId,
        notes: `Challenge game between ${challenge.challenger.name || challenge.challenger.username || 'Unknown'} and ${challenge.challenged.name || challenge.challenged.username || 'Unknown'}. Mission: ${mission || 'TBD'}`
      }
    });

    // Send notification to challenger
    await prisma.inboxMessage.create({
      data: {
        recipientId: challenge.challengerId,
        senderId: challenge.challengedId,
        type: 'CHALLENGE_ACCEPTED',
        title: 'Challenge Accepted!',
        content: `Your challenge has been accepted by ${challenge.challenged.name || challenge.challenged.username || 'Unknown User'}!`,
        data: JSON.stringify({
          challengeId: challengeId,
          gameId: scheduledGame.id,
          scheduledDate: scheduledDate,
          location: location,
          mission: mission,
          challengerName: challenge.challenger.name,
          challengedName: challenge.challenged.name
        })
      }
    });

    res.json({
      ok: true,
      challenge: updatedChallenge,
      game: scheduledGame,
      message: 'Challenge accepted and game scheduled successfully'
    });

  } catch (error) {
    console.error('Error accepting challenge:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to accept challenge' 
    });
  }
}

export async function rejectChallenge(req: Request, res: Response) {
  try {
    const { challengeId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!challengeId) {
      return res.status(400).json({
        ok: false,
        error: 'challengeId is required'
      });
    }

    // Find the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        challenger: {
          select: { id: true, name: true, username: true, email: true }
        },
        challenged: {
          select: { id: true, name: true, username: true, email: true }
        }
      }
    });

    if (!challenge) {
      return res.status(404).json({
        ok: false,
        error: 'Challenge not found'
      });
    }

    if (challenge.challengedId !== userId) {
      return res.status(403).json({
        ok: false,
        error: 'You can only reject challenges sent to you'
      });
    }

    if (challenge.status !== 'PENDING') {
      return res.status(400).json({
        ok: false,
        error: 'Challenge is no longer pending'
      });
    }

    // Update challenge status to DECLINED
    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: { 
        status: 'DECLINED',
        declinedAt: new Date()
      }
    });

    // Send notification to challenger
    await prisma.inboxMessage.create({
      data: {
        recipientId: challenge.challengerId,
        senderId: challenge.challengedId,
        type: 'CHALLENGE_REJECTED',
        title: 'Challenge Rejected',
        content: `Your challenge has been rejected by ${challenge.challenged.name}.`,
        data: JSON.stringify({
          challengeId: challengeId,
          challengerName: challenge.challenger.name,
          challengedName: challenge.challenged.name
        })
      }
    });

    res.json({
      ok: true,
      challenge: updatedChallenge,
      message: 'Challenge rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting challenge:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to reject challenge' 
    });
  }
}

export async function getAvailablePlayers(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { language = 'en', page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Get users who are not the current user and don't have pending challenges
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        status: 'ACTIVE',
        // Exclude users with pending challenges from/to current user
        NOT: {
          OR: [
            {
              challengesSent: {
                some: {
                  challengedId: userId,
                  status: 'PENDING'
                }
              }
            },
            {
              challengesReceived: {
                some: {
                  challengerId: userId,
                  status: 'PENDING'
                }
              }
            }
          ]
        }
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.user.count({
      where: {
        id: { not: userId },
        status: 'ACTIVE',
        NOT: {
          OR: [
            {
              challengesSent: {
                some: {
                  challengedId: userId,
                  status: 'PENDING'
                }
              }
            },
            {
              challengesReceived: {
                some: {
                  challengerId: userId,
                  status: 'PENDING'
                }
              }
            }
          ]
        }
      }
    });

    console.log('🔍 Available players query result:', users.length, 'users');
    console.log('🔍 Current user ID:', userId);
    
    // If no users found, let's check total users in database
    const totalUsers = await prisma.user.count();
    console.log('🔍 Total users in database:', totalUsers);
    
    if (users.length === 0 && totalUsers > 1) {
      console.log('🔍 No available players found, but database has users. Checking why...');
      const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, username: true, status: true }
      });
      console.log('🔍 All users in database:', allUsers);
    }
    
    res.json({
      ok: true,
      players: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching available players:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch available players' 
    });
  }
}
