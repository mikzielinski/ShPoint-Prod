import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== ACCESS REQUESTS API =====

export async function createAccessRequest(req: Request, res: Response) {
  try {
    const { email, name, message } = req.body;

    if (!email) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Email is required' 
      });
    }

    // Validate Gmail email
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Only Gmail addresses are accepted' 
      });
    }

    // Check if email already exists in users
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ 
        ok: false, 
        error: 'This email is already registered' 
      });
    }

    // Check if request already exists
    const existingRequest = await prisma.accessRequest.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return res.status(400).json({ 
          ok: false, 
          error: 'Access request is already pending for this email' 
        });
      } else if (existingRequest.status === 'APPROVED') {
        return res.status(400).json({ 
          ok: false, 
          error: 'Access has already been approved for this email' 
        });
      } else if (existingRequest.status === 'REJECTED') {
        // Allow resubmission after rejection
        const updatedRequest = await prisma.accessRequest.update({
          where: { id: existingRequest.id },
          data: {
            name: name || null,
            message: message || null,
            status: 'PENDING',
            requestedAt: new Date(),
            reviewedAt: null,
            reviewedBy: null,
            reviewNotes: null
          }
        });

        return res.status(201).json({
          ok: true,
          message: 'Access request resubmitted successfully',
          request: updatedRequest
        });
      }
    }

    // Create new access request
    const accessRequest = await prisma.accessRequest.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        message: message || null
      }
    });

    res.status(201).json({
      ok: true,
      message: 'Access request submitted successfully',
      request: accessRequest
    });
  } catch (error) {
    console.error('Error creating access request:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to submit access request' 
    });
  }
}

export async function getAccessRequests(req: Request, res: Response) {
  try {
    const userId = (req as any).dbUser?.id;
    const { status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Admin access required' 
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    let whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.accessRequest.findMany({
        where: whereClause,
        include: {
          reviewedByUser: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.accessRequest.count({
        where: whereClause
      })
    ]);

    res.json({
      ok: true,
      requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch access requests' 
    });
  }
}

export async function updateAccessRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).dbUser?.id;
    const { status, reviewNotes } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Admin access required' 
      });
    }

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Valid status (APPROVED or REJECTED) is required' 
      });
    }

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id }
    });

    if (!accessRequest) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Access request not found' 
      });
    }

    const updatedRequest = await prisma.accessRequest.update({
      where: { id },
      data: {
        status: status as any,
        reviewedAt: new Date(),
        reviewedBy: userId,
        reviewNotes: reviewNotes || null
      },
      include: {
        reviewedByUser: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        }
      }
    });

    res.json({
      ok: true,
      message: `Access request ${status.toLowerCase()} successfully`,
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error updating access request:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to update access request' 
    });
  }
}

export async function deleteAccessRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).dbUser?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Admin access required' 
      });
    }

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id }
    });

    if (!accessRequest) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Access request not found' 
      });
    }

    await prisma.accessRequest.delete({
      where: { id }
    });

    res.json({
      ok: true,
      message: 'Access request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting access request:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to delete access request' 
    });
  }
}

export async function inviteUserFromRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).dbUser?.id;

    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Admin access required' 
      });
    }

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id }
    });

    if (!accessRequest) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Access request not found' 
      });
    }

    if (accessRequest.status !== 'PENDING') {
      return res.status(400).json({ 
        ok: false, 
        error: 'Can only invite from pending requests' 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: accessRequest.email }
    });

    if (existingUser) {
      return res.status(400).json({ 
        ok: false, 
        error: 'User with this email already exists' 
      });
    }

    // Create user invitation
    const invitation = await prisma.userInvitation.create({
      data: {
        email: accessRequest.email,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Update access request status
    const updatedRequest = await prisma.accessRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: userId,
        reviewNotes: 'Invitation sent'
      },
      include: {
        reviewedByUser: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        }
      }
    });

    res.json({
      ok: true,
      message: 'User invitation sent successfully',
      invitation,
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error inviting user from request:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to invite user from request' 
    });
  }
}
