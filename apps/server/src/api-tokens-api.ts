import { Request, Response } from 'express';
import { prisma } from './prisma.js';
import crypto from 'crypto';

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Define available scopes based on user role
function getAvailableScopes(userRole: string): string[] {
  const baseScopes = ['read:profile', 'read:characters', 'read:sets', 'read:missions'];
  
  switch (userRole) {
    case 'ADMIN':
      return [
        ...baseScopes,
        'write:characters', 'write:sets', 'write:missions',
        'admin:users', 'admin:invitations', 'admin:access-requests',
        'read:game-results', 'write:game-results', 'delete:game-results',
        'read:comments', 'write:comments', 'delete:comments',
        'read:inbox', 'write:inbox', 'delete:inbox',
        'read:challenges', 'write:challenges', 'delete:challenges'
      ];
    case 'EDITOR':
      return [
        ...baseScopes,
        'write:characters', 'write:sets', 'write:missions',
        'read:game-results', 'write:game-results',
        'read:comments', 'write:comments',
        'read:inbox', 'write:inbox',
        'read:challenges', 'write:challenges'
      ];
    case 'USER':
      return [
        ...baseScopes,
        'read:game-results', 'write:game-results',
        'read:comments', 'write:comments',
        'read:inbox', 'write:inbox',
        'read:challenges', 'write:challenges'
      ];
    default:
      return baseScopes;
  }
}

// Validate scopes for user role
function validateScopes(scopes: string[], userRole: string): { valid: boolean; invalidScopes: string[] } {
  const availableScopes = getAvailableScopes(userRole);
  const invalidScopes = scopes.filter(scope => !availableScopes.includes(scope));
  
  return {
    valid: invalidScopes.length === 0,
    invalidScopes
  };
}

// Get user's API tokens
export async function getUserApiTokens(req: Request, res: Response) {
  try {
    const userId = (req as any).dbUser?.id;
    const userRole = (req as any).dbUser?.role;
    
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'User not authenticated' });
    }

    const tokens = await prisma.apiToken.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        token: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        scopes: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Mask tokens for security (show only first 8 and last 4 characters)
    const maskedTokens = tokens.map(token => ({
      ...token,
      token: token.isActive ? `${token.token.substring(0, 8)}...${token.token.substring(token.token.length - 4)}` : '***'
    }));

    const availableScopes = getAvailableScopes(userRole);

    res.json({ 
      ok: true, 
      tokens: maskedTokens,
      availableScopes 
    });
  } catch (error) {
    console.error('Error fetching API tokens:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch API tokens' });
  }
}

// Create new API token
export async function createApiToken(req: Request, res: Response) {
  try {
    const userId = (req as any).dbUser?.id;
    const userRole = (req as any).dbUser?.role;
    const { name, expiresInDays, scopes = [] } = req.body;
    
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'User not authenticated' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'Token name is required' });
    }

    // Validate scopes
    const scopeValidation = validateScopes(scopes, userRole);
    if (!scopeValidation.valid) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid scopes for your role',
        invalidScopes: scopeValidation.invalidScopes,
        availableScopes: getAvailableScopes(userRole)
      });
    }

    const token = generateToken();
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const apiToken = await prisma.apiToken.create({
      data: {
        name: name.trim(),
        token,
        userId,
        expiresAt,
        scopes: scopes.length > 0 ? scopes : getAvailableScopes(userRole) // Default to all available scopes if none specified
      }
    });

    // Return the full token only once during creation
    res.json({ 
      ok: true, 
      token: {
        id: apiToken.id,
        name: apiToken.name,
        token: apiToken.token, // Full token only shown once
        isActive: apiToken.isActive,
        expiresAt: apiToken.expiresAt,
        scopes: apiToken.scopes,
        createdAt: apiToken.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating API token:', error);
    res.status(500).json({ ok: false, error: 'Failed to create API token' });
  }
}

// Update API token (activate/deactivate)
export async function updateApiToken(req: Request, res: Response) {
  try {
    const userId = (req as any).dbUser?.id;
    const { id } = req.params;
    const { isActive, name } = req.body;
    
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'User not authenticated' });
    }

    // Check if token belongs to user
    const existingToken = await prisma.apiToken.findFirst({
      where: { id, userId }
    });

    if (!existingToken) {
      return res.status(404).json({ ok: false, error: 'Token not found' });
    }

    const updateData: any = {};
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (name && typeof name === 'string' && name.trim().length > 0) {
      updateData.name = name.trim();
    }

    const updatedToken = await prisma.apiToken.update({
      where: { id },
      data: updateData
    });

    res.json({ ok: true, token: updatedToken });
  } catch (error) {
    console.error('Error updating API token:', error);
    res.status(500).json({ ok: false, error: 'Failed to update API token' });
  }
}

// Delete API token
export async function deleteApiToken(req: Request, res: Response) {
  try {
    const userId = (req as any).dbUser?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'User not authenticated' });
    }

    // Check if token belongs to user
    const existingToken = await prisma.apiToken.findFirst({
      where: { id, userId }
    });

    if (!existingToken) {
      return res.status(404).json({ ok: false, error: 'Token not found' });
    }

    await prisma.apiToken.delete({
      where: { id }
    });

    res.json({ ok: true, message: 'Token deleted successfully' });
  } catch (error) {
    console.error('Error deleting API token:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete API token' });
  }
}

// Middleware to authenticate API tokens
export async function authenticateApiToken(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!apiToken || !apiToken.isActive) {
      return res.status(401).json({ ok: false, error: 'Invalid or inactive API token' });
    }

    // Check if token is expired
    if (apiToken.expiresAt && new Date() > apiToken.expiresAt) {
      return res.status(401).json({ ok: false, error: 'API token has expired' });
    }

    // Update last used timestamp
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() }
    });

    // Add user info and token scopes to request
    (req as any).dbUser = {
      id: apiToken.user.id,
      email: apiToken.user.email,
      role: apiToken.user.role,
      name: apiToken.user.name,
      username: apiToken.user.username
    };
    
    (req as any).tokenScopes = apiToken.scopes;

    next();
  } catch (error) {
    console.error('Error authenticating API token:', error);
    res.status(500).json({ ok: false, error: 'Authentication error' });
  }
}

// Middleware to check if token has required scope
export function requireScope(requiredScope: string) {
  return (req: Request, res: Response, next: any) => {
    const tokenScopes = (req as any).tokenScopes;
    
    if (!tokenScopes || !tokenScopes.includes(requiredScope)) {
      return res.status(403).json({ 
        ok: false, 
        error: `Insufficient permissions. Required scope: ${requiredScope}` 
      });
    }
    
    next();
  };
}
