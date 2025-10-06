/**
 * 🚀 Nowe API endpoints używające bazy danych zamiast plików JSON
 * 
 * Zoptymalizowane dla szybkiego ładowania z indeksami i relacjami
 */

import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

// ===== CHARACTERS API =====

/**
 * GET /api/v2/characters — lista wszystkich postaci z bazy danych
 */
export async function getCharacters(req: Request, res: Response) {
  try {
    const { 
      page = 1, 
      limit = 50, 
      faction, 
      unitType, 
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {
      isActive: true
    };

    if (faction) {
      where.faction = faction;
    }

    if (unitType) {
      where.unitType = unitType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { characterNames: { contains: search as string, mode: 'insensitive' } },
        { faction: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    // Get characters with pagination
    const [characters, total] = await Promise.all([
      prisma.character.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          abilities: {
            orderBy: { order: 'asc' }
          },
          stances: true,
          _count: {
            select: {
              characterCollections: true
            }
          }
        }
      }),
      prisma.character.count({ where })
    ]);

    res.json({
      ok: true,
      items: characters,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });

  } catch (error: any) {
    console.error('❌ Error fetching characters:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

/**
 * GET /api/v2/characters/:id — szczegóły pojedynczej postaci
 */
export async function getCharacterById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const character = await prisma.character.findUnique({
      where: { slug: id },
      include: {
        abilities: {
          orderBy: { order: 'asc' }
        },
        stances: true,
        characterCollections: {
          where: { userId: req.user?.id },
          take: 1
        },
        setCharacters: {
          include: {
            set: true
          }
        },
        createdByUser: {
          select: { name: true, email: true }
        },
        updatedByUser: {
          select: { name: true, email: true }
        }
      }
    });

    if (!character) {
      return res.status(404).json({ ok: false, error: 'Character not found' });
    }

    res.json({
      ok: true,
      character
    });

  } catch (error: any) {
    console.error('❌ Error fetching character:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

/**
 * GET /api/v2/characters/:id/abilities — umiejętności postaci
 */
export async function getCharacterAbilities(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const abilities = await prisma.characterAbility.findMany({
      where: { 
        character: { slug: id }
      },
      orderBy: { order: 'asc' }
    });

    res.json({
      ok: true,
      abilities
    });

  } catch (error: any) {
    console.error('❌ Error fetching character abilities:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

/**
 * GET /api/v2/characters/:id/stance — stance postaci
 */
export async function getCharacterStance(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // First find the character by slug
    const character = await prisma.character.findUnique({
      where: { slug: id }
    });

    if (!character) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Character not found' 
      });
    }

    const stance = await prisma.characterStance.findFirst({
      where: { 
        characterId: character.id
      }
    });

    if (!stance) {
      return res.status(404).json({ ok: false, error: 'Stance not found' });
    }

    res.json({
      ok: true,
      stance
    });

  } catch (error: any) {
    console.error('❌ Error fetching character stance:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

/**
 * PUT /api/v2/characters/:id/stance — aktualizacja stance postaci (Admin/Editor only)
 */
export async function updateCharacterStance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const stanceData = req.body;

    // First find the character by slug
    const character = await prisma.character.findUnique({
      where: { slug: id }
    });

    if (!character) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Character not found' 
      });
    }

    // Update or create stance
    const stance = await prisma.characterStance.upsert({
      where: { 
        characterId: character.id
      },
      update: {
        attackDice: stanceData.attackDice || 0,
        defenseDice: stanceData.defenseDice || 0,
        meleeExpertise: stanceData.meleeExpertise || 0,
        rangedExpertise: stanceData.rangedExpertise || 0,
        tree: stanceData.tree || []
      },
      create: {
        characterId: character.id,
        attackDice: stanceData.attackDice || 0,
        defenseDice: stanceData.defenseDice || 0,
        meleeExpertise: stanceData.meleeExpertise || 0,
        rangedExpertise: stanceData.rangedExpertise || 0,
        tree: stanceData.tree || []
      }
    });

    res.json({
      ok: true,
      message: 'Stance updated successfully',
      stance
    });

  } catch (error: any) {
    console.error('❌ Error updating character stance:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

/**
 * POST /api/v2/characters — tworzenie nowej postaci (Admin/Editor only)
 */
export async function createCharacter(req: Request, res: Response) {
  try {
    const {
      name,
      faction,
      unitType,
      squadPoints,
      stamina,
      durability,
      force,
      hanker,
      boxSetCode,
      characterNames,
      numberOfCharacters,
      era,
      period,
      tags,
      factions,
      portraitUrl,
      imageUrl,
      abilities,
      stance
    } = req.body;

    // Create character
    const character = await prisma.character.create({
      data: {
        slug: createSlug(name),
        name,
        faction,
        unitType,
        squadPoints,
        stamina,
        durability,
        force,
        hanker,
        boxSetCode,
        characterNames,
        numberOfCharacters,
        era: era || [],
        period: period || [],
        tags: tags || [],
        factions: factions || [],
        portraitUrl,
        imageUrl,
        createdBy: req.user?.id,
        updatedBy: req.user?.id,
        version: 1
      }
    });

    // Create abilities if provided
    if (abilities && Array.isArray(abilities)) {
      for (let i = 0; i < abilities.length; i++) {
        const ability = abilities[i];
        await prisma.characterAbility.create({
          data: {
            characterId: character.id,
            name: ability.name,
            type: ability.type,
            symbol: ability.symbol,
            trigger: ability.trigger,
            isAction: ability.isAction || false,
            forceCost: ability.forceCost || 0,
            damageCost: ability.damageCost || 0,
            description: ability.description,
            tags: ability.tags || [],
            order: i
          }
        });
      }
    }

    // Create stance if provided
    if (stance) {
      await prisma.characterStance.create({
        data: {
          characterId: character.id,
          attackDice: stance.attackDice || 0,
          defenseDice: stance.defenseDice || 0,
          meleeExpertise: stance.meleeExpertise || 0,
          rangedExpertise: stance.rangedExpertise || 0,
          tree: stance.tree || []
        }
      });
    }

    // Return created character with relations
    const createdCharacter = await prisma.character.findUnique({
      where: { id: character.id },
      include: {
        abilities: {
          orderBy: { order: 'asc' }
        },
        stances: true
      }
    });

    res.status(201).json({
      ok: true,
      character: createdCharacter
    });

  } catch (error: any) {
    console.error('❌ Error creating character:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

/**
 * PUT /api/v2/characters/:id — aktualizacja postaci (Admin/Editor only)
 */
export async function updateCharacter(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove abilities and stance from update data (handled separately)
    const { abilities, stance, ...characterData } = updateData;

    // Update or create character
    const character = await prisma.character.upsert({
      where: { slug: id },
      update: {
        ...characterData,
        updatedBy: req.user?.id,
        version: { increment: 1 },
        updatedAt: new Date()
      },
      create: {
        id: id,
        slug: id,
        name: characterData.name || 'Unknown Character',
        faction: characterData.faction || 'Unknown',
        unitType: characterData.unitType || 'Primary',
        squadPoints: characterData.squadPoints || 0,
        stamina: characterData.stamina || 0,
        durability: characterData.durability || 0,
        force: characterData.force || null,
        hanker: characterData.hanker || null,
        boxSetCode: characterData.boxSetCode || null,
        characterNames: characterData.characterNames || [],
        numberOfCharacters: characterData.numberOfCharacters || 1,
        era: characterData.era || null,
        period: characterData.period || [],
        tags: characterData.tags || [],
        portraitUrl: characterData.portraitUrl || null,
        imageUrl: characterData.imageUrl || null,
        abilities: characterData.abilities || [],
        version: 1,
        createdBy: req.user?.id,
        updatedBy: req.user?.id
      }
    });

    // Update abilities if provided
    if (abilities && Array.isArray(abilities)) {
      // Delete existing abilities
      await prisma.characterAbility.deleteMany({
        where: { characterId: character.id }
      });

      // Create new abilities
      for (let i = 0; i < abilities.length; i++) {
        const ability = abilities[i];
        await prisma.characterAbility.create({
          data: {
            characterId: character.id,
            name: ability.name,
            type: ability.type,
            symbol: ability.symbol,
            trigger: ability.trigger,
            isAction: ability.isAction || false,
            forceCost: ability.forceCost || 0,
            damageCost: ability.damageCost || 0,
            description: ability.description,
            tags: ability.tags || [],
            order: i
          }
        });
      }
    }

    // Update stance if provided
    if (stance) {
      await prisma.characterStance.upsert({
        where: { characterId: character.id },
        update: {
          attackDice: stance.attackDice || 0,
          defenseDice: stance.defenseDice || 0,
          meleeExpertise: stance.meleeExpertise || 0,
          rangedExpertise: stance.rangedExpertise || 0,
          tree: stance.tree || []
        },
        create: {
          characterId: character.id,
          attackDice: stance.attackDice || 0,
          defenseDice: stance.defenseDice || 0,
          meleeExpertise: stance.meleeExpertise || 0,
          rangedExpertise: stance.rangedExpertise || 0,
          tree: stance.tree || []
        }
      });
    }

    // Return updated character with relations
    const updatedCharacter = await prisma.character.findUnique({
      where: { id: character.id },
      include: {
        abilities: {
          orderBy: { order: 'asc' }
        },
        stances: true
      }
    });

    res.json({
      ok: true,
      character: updatedCharacter
    });

  } catch (error: any) {
    console.error('❌ Error updating character:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

/**
 * DELETE /api/v2/characters/:id — usuwanie postaci (Admin only)
 */
export async function deleteCharacter(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Soft delete - set isActive to false
    const character = await prisma.character.update({
      where: { slug: id },
      data: {
        isActive: false,
        updatedBy: req.user?.id,
        version: { increment: 1 },
        updatedAt: new Date()
      }
    });

    res.json({
      ok: true,
      message: 'Character deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting character:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

// ===== SETS API =====

/**
 * GET /api/v2/sets — lista wszystkich setów
 */
export async function getSets(req: Request, res: Response) {
  try {
    const { 
      page = 1, 
      limit = 50, 
      type, 
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {
      isActive: true
    };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    // Get sets with pagination
    const [sets, total] = await Promise.all([
      prisma.set.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          characters: {
            include: {
              character: true
            }
          },
          _count: {
            select: {
              setCollections: true
            }
          }
        }
      }),
      prisma.set.count({ where })
    ]);

    res.json({
      ok: true,
      items: sets,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });

  } catch (error: any) {
    console.error('❌ Error fetching sets:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

// ===== MISSIONS API =====

/**
 * GET /api/v2/missions — lista wszystkich misji
 */
export async function getMissions(req: Request, res: Response) {
  try {
    const { 
      page = 1, 
      limit = 50, 
      source, 
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {
      isActive: true
    };

    if (source) {
      where.source = source;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    // Get missions with pagination
    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          objectives: {
            orderBy: { key: 'asc' }
          },
          struggles: {
            orderBy: { index: 'asc' }
          },
          _count: {
            select: {
              missionCollections: true
            }
          }
        }
      }),
      prisma.mission.count({ where })
    ]);

    res.json({
      ok: true,
      items: missions,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });

  } catch (error: any) {
    console.error('❌ Error fetching missions:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

// ===== HELPER FUNCTIONS =====

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}
