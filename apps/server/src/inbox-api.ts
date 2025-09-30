import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== INBOX API =====

export async function getInboxMessages(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const whereClause: any = {
      recipientId: userId
    };

    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }

    const [messages, total] = await Promise.all([
      prisma.inboxMessage.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.inboxMessage.count({
        where: whereClause
      })
    ]);

    // Get unread count
    const unreadCount = await prisma.inboxMessage.count({
      where: {
        recipientId: userId,
        isRead: false
      }
    });

    res.json({
      ok: true,
      messages,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch inbox messages' 
    });
  }
}

export async function markMessageAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const message = await prisma.inboxMessage.findFirst({
      where: {
        id,
        recipientId: userId
      }
    });

    if (!message) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Message not found' 
      });
    }

    if (!message.isRead) {
      await prisma.inboxMessage.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }

    res.json({
      ok: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to mark message as read' 
    });
  }
}

export async function markAllMessagesAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    await prisma.inboxMessage.updateMany({
      where: {
        recipientId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      ok: true,
      message: 'All messages marked as read'
    });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to mark all messages as read' 
    });
  }
}

export async function deleteMessage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const message = await prisma.inboxMessage.findFirst({
      where: {
        id,
        recipientId: userId
      }
    });

    if (!message) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Message not found' 
      });
    }

    await prisma.inboxMessage.delete({
      where: { id }
    });

    res.json({
      ok: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to delete message' 
    });
  }
}

// Helper function to create inbox messages
export async function createInboxMessage(
  recipientId: string,
  senderId: string | null,
  type: string,
  title: string,
  content: string,
  data?: any
) {
  try {
    const message = await prisma.inboxMessage.create({
      data: {
        recipientId,
        senderId,
        type,
        title,
        content,
        data: data ? JSON.stringify(data) : null
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    return message;
  } catch (error) {
    console.error('Error creating inbox message:', error);
    throw error;
  }
}
