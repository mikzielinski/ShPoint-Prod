import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== COMMENTS API =====

export async function getComments(req: Request, res: Response) {
  try {
    const { type, entityId, page = 1, limit = 20 } = req.query;
    
    if (!type || !entityId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Type and entityId are required' 
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          type: type as any,
          entityId: entityId as string,
          isDeleted: false,
          parentId: null // Only top-level comments
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true
            }
          },
          likes: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true
                }
              }
            }
          },
          replies: {
            where: { isDeleted: false },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatarUrl: true
                }
              },
              likes: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      username: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          _count: {
            select: {
              likes: true,
              replies: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.comment.count({
        where: {
          type: type as any,
          entityId: entityId as string,
          isDeleted: false,
          parentId: null
        }
      })
    ]);

    res.json({
      ok: true,
      comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch comments' 
    });
  }
}

export async function createComment(req: Request, res: Response) {
  try {
    const { type, entityId, content, parentId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!type || !entityId || !content) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Type, entityId, and content are required' 
      });
    }

    // Validate parent comment exists if parentId provided
    if (parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: parentId,
          type: type as any,
          entityId: entityId as string,
          isDeleted: false
        }
      });

      if (!parentComment) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Parent comment not found' 
        });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        type: type as any,
        entityId: entityId as string,
        content: content.trim(),
        authorId: userId,
        parentId: parentId || null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            replies: true
          }
        }
      }
    });

    res.status(201).json({
      ok: true,
      comment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to create comment' 
    });
  }
}

export async function updateComment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    if (!content) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Content is required' 
      });
    }

    const comment = await prisma.comment.findFirst({
      where: {
        id,
        authorId: userId,
        isDeleted: false
      }
    });

    if (!comment) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Comment not found or access denied' 
      });
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            replies: true
          }
        }
      }
    });

    res.json({
      ok: true,
      comment: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to update comment' 
    });
  }
}

export async function deleteComment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    const comment = await prisma.comment.findFirst({
      where: {
        id,
        authorId: userId,
        isDeleted: false
      }
    });

    if (!comment) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Comment not found or access denied' 
      });
    }

    // Soft delete the comment
    await prisma.comment.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    });

    res.json({
      ok: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to delete comment' 
    });
  }
}

export async function likeComment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Check if comment exists
    const comment = await prisma.comment.findFirst({
      where: {
        id,
        isDeleted: false
      }
    });

    if (!comment) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Comment not found' 
      });
    }

    // Check if already liked
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: id,
          userId
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.commentLike.delete({
        where: {
          commentId_userId: {
            commentId: id,
            userId
          }
        }
      });

      res.json({
        ok: true,
        liked: false,
        message: 'Comment unliked'
      });
    } else {
      // Like
      await prisma.commentLike.create({
        data: {
          commentId: id,
          userId
        }
      });

      res.json({
        ok: true,
        liked: true,
        message: 'Comment liked'
      });
    }
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to like comment' 
    });
  }
}
