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

    // Try to find character in database first
    let character = await prisma.character.findUnique({
      where: { slug: id },
      include: {
        abilities: {
          orderBy: { order: 'asc' }
        },
        stances: true,
        characterCollections: true,
        setCharacters: {
          include: {
            set: true
          }
        }
      }
    });

    // If not found in database, try to load from JSON and sync to database
    if (!character) {
      console.log(`Character ${id} not found in database, attempting to load from JSON...`);
      
      try {
        const fs = await import('fs');
        const path = await import('path');
        
        // Try to load character data from JSON files
        let dataPath = path.join(process.cwd(), 'characters_assets', id, 'data.json');
        if (!fs.existsSync(dataPath)) {
          dataPath = path.join(process.cwd(), '../client/characters_assets', id, 'data.json');
        }
        
        if (fs.existsSync(dataPath)) {
          const characterData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          
          // Use the sync function to create character in database
          const { syncCharacterToDatabase } = await import('./index.js');
          await syncCharacterToDatabase(id, characterData);
          
          // Try to get the character again from database
          character = await prisma.character.findUnique({
            where: { slug: id },
            include: {
              abilities: {
                orderBy: { order: 'asc' }
              },
              stances: true,
              characterCollections: true,
              setCharacters: {
                include: {
                  set: true
                }
              }
            }
          });
          
          console.log(`Successfully synced character ${id} from JSON to database`);
        }
      } catch (syncError) {
        console.error(`Failed to sync character ${id} from JSON:`, syncError);
      }
    }

    if (!character) {
      return res.status(404).json({ ok: false, error: 'Character not found in database or JSON files' });
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
    let character = await prisma.character.findUnique({
      where: { slug: id }
    });

    // If character not found in database, try to sync from JSON
    if (!character) {
      console.log(`Character ${id} not found in database for stance, attempting to load from JSON...`);
      
      try {
        const fs = await import('fs');
        const path = await import('path');
        
        // Try to load character data from JSON files
        let dataPath = path.join(process.cwd(), 'characters_assets', id, 'data.json');
        if (!fs.existsSync(dataPath)) {
          dataPath = path.join(process.cwd(), '../client/characters_assets', id, 'data.json');
        }
        
        if (fs.existsSync(dataPath)) {
          const characterData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          
          // Use the sync function to create character in database
          const { syncCharacterToDatabase } = await import('./index.js');
          await syncCharacterToDatabase(id, characterData);
          
          // Try to get the character again from database
          character = await prisma.character.findUnique({
            where: { slug: id }
          });
          
          console.log(`Successfully synced character ${id} from JSON for stance`);
        }
      } catch (syncError) {
        console.error(`Failed to sync character ${id} from JSON for stance:`, syncError);
      }
    }

    if (!character) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Character not found in database or JSON files' 
      });
    }

    const stance = await prisma.characterStance.findFirst({
      where: { 
        characterId: character.id
      }
    });

    if (!stance) {
      return res.status(404).json({ ok: false, error: 'Stance not found in database' });
    }

    console.log('🔍 Database stance.tree type:', typeof stance.tree);
    console.log('🔍 Database stance.tree:', JSON.stringify(stance.tree, null, 2));

    // Convert database stance to frontend-compatible format
    // Check if tree contains full sides array (new format) or just tree data (old format)
    let frontendStance;
    
    // Type guard for tree as array with id property
    const isNewFormat = Array.isArray(stance.tree) && 
                        stance.tree.length > 0 && 
                        typeof stance.tree[0] === 'object' && 
                        stance.tree[0] !== null &&
                        'id' in stance.tree[0];
    
    if (isNewFormat) {
      // New format: tree contains full sides array
      console.log('🔍 Stance tree contains full sides array (new format)');
      frontendStance = {
        sides: stance.tree as any[]
      };
    } else {
      // Old format: tree is just tree data, construct sides from individual fields
      console.log('🔍 Stance tree is old format, constructing sides');
      frontendStance = {
        sides: [
          {
            id: "A",
            name: "Primary",
            attack: {
              melee: {
                dice: stance.attackDice,
                expertise: []
              },
              ranged: {
                dice: 0,
                expertise: []
              }
            },
            defense: {
              dice: stance.defenseDice
            },
            tree: stance.tree || []
          }
        ]
      };
    }

    console.log('🔍 Returning stance to frontend:', JSON.stringify(frontendStance, null, 2));

    res.json({
      ok: true,
      stance: frontendStance
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
    
    console.log('🔍 updateCharacterStance - characterId:', id);
    console.log('🔍 updateCharacterStance - stanceData:', JSON.stringify(stanceData, null, 2));

    // First find the character by slug
    const character = await prisma.character.findUnique({
      where: { slug: id }
    });

    if (!character) {
      console.log('❌ Character not found:', id);
      return res.status(404).json({ 
        ok: false, 
        error: 'Character not found' 
      });
    }

    console.log('✅ Character found:', character.id, character.name);

    // Handle both old and new stance formats
    // Old format: { attackDice, defenseDice, meleeExpertise: [], rangedExpertise: [], tree: {} }
    // New format: { sides: [...] }
    
    let stanceUpdateData;
    
    if (stanceData.sides && Array.isArray(stanceData.sides)) {
      // New format with sides array - extract from first side
      console.log('🔍 Processing NEW stance format (sides array)');
      const firstSide = stanceData.sides[0];
      stanceUpdateData = {
        attackDice: firstSide?.attack?.melee?.dice || 0,
        defenseDice: firstSide?.attack?.melee?.defense || 0,
        meleeExpertise: 0,  // Will be in tree
        rangedExpertise: 0, // Will be in tree
        tree: stanceData.sides  // Store full sides array as JSON
      };
    } else {
      // Old format - direct fields
      console.log('🔍 Processing OLD stance format (direct fields)');
      stanceUpdateData = {
        attackDice: stanceData.attackDice || 0,
        defenseDice: stanceData.defenseDice || 0,
        meleeExpertise: 0,  // meleeExpertise should be Int, not array
        rangedExpertise: 0, // rangedExpertise should be Int, not array
        tree: stanceData.tree || {}  // Store tree as JSON
      };
    }

    console.log('🔍 Processed stance data:', JSON.stringify(stanceUpdateData, null, 2));

    // Update or create stance
    const stance = await prisma.characterStance.upsert({
      where: { 
        characterId: character.id
      },
      update: stanceUpdateData,
      create: {
        characterId: character.id,
        ...stanceUpdateData
      }
    });

    console.log('✅ Stance upserted successfully:', stance.id);

    res.json({
      ok: true,
      message: 'Stance updated successfully',
      characterId: character.slug
    });

  } catch (error: any) {
    console.error('❌ Error updating character stance:', {
      characterId: req.params.id,
      error: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      code: error.code,
      meta: error.meta
    });
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
    
    console.log('🔍 updateCharacter - characterId:', id);
    console.log('🔍 updateCharacter - updateData keys:', Object.keys(updateData));

    // Remove abilities and stance from update data (handled separately)
    const { abilities, stance, ...characterData } = updateData;
    
    // Normalize unit_type: ensure it's a string, not an array
    if (characterData.unitType) {
      if (Array.isArray(characterData.unitType)) {
        characterData.unitType = characterData.unitType[0];
        console.log('🔧 Normalized unitType from array to:', characterData.unitType);
      }
    }
    
    // Normalize unit_type field (some parts of frontend use unit_type, some unitType)
    if (characterData.unit_type) {
      if (Array.isArray(characterData.unit_type)) {
        characterData.unitType = characterData.unit_type[0];
      } else {
        characterData.unitType = characterData.unit_type;
      }
      delete characterData.unit_type;
      console.log('🔧 Normalized unit_type to unitType:', characterData.unitType);
    }

    // Update or create character
    const character = await prisma.character.upsert({
      where: { slug: id },
      update: {
        name: characterData.name,
        faction: characterData.faction,
        unitType: characterData.unitType,
        squadPoints: characterData.squadPoints,
        stamina: characterData.stamina,
        durability: characterData.durability,
        force: characterData.force,
        hanker: characterData.hanker,
        boxSetCode: characterData.boxSetCode,
        characterNames: characterData.characterNames,
        numberOfCharacters: characterData.numberOfCharacters,
        era: characterData.era,
        period: characterData.period,
        tags: characterData.tags,
        factions: characterData.factions,
        portraitUrl: characterData.portraitUrl,
        imageUrl: characterData.imageUrl,
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
        characterNames: characterData.characterNames || '',
        numberOfCharacters: characterData.numberOfCharacters || 1,
        era: characterData.era || [],
        period: characterData.period || [],
        tags: characterData.tags || [],
        factions: characterData.factions || [],
        portraitUrl: characterData.portraitUrl || null,
        imageUrl: characterData.imageUrl || null,
        version: 1,
        createdBy: req.user?.id,
        updatedBy: req.user?.id
      }
    });

    console.log('✅ Character upserted:', character.id, character.name);

    // Update abilities if provided
    if (abilities && Array.isArray(abilities)) {
      console.log('🔍 Updating abilities, count:', abilities.length);
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
      console.log('✅ Abilities updated');
    }

    // Update stance if provided
    if (stance) {
      console.log('🔍 Updating stance');
      await prisma.characterStance.upsert({
        where: { characterId: character.id },
        update: {
          attackDice: stance.attackDice || 0,
          defenseDice: stance.defenseDice || 0,
          meleeExpertise: stance.meleeExpertise || 0,
          rangedExpertise: stance.rangedExpertise || 0,
          tree: stance.sides || stance.tree || []  // Support both 'sides' and 'tree'
        },
        create: {
          characterId: character.id,
          attackDice: stance.attackDice || 0,
          defenseDice: stance.defenseDice || 0,
          meleeExpertise: stance.meleeExpertise || 0,
          rangedExpertise: stance.rangedExpertise || 0,
          tree: stance.sides || stance.tree || []  // Support both 'sides' and 'tree'
        }
      });
      console.log('✅ Stance updated');
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

    console.log('✅ updateCharacter completed successfully');

    res.json({
      ok: true,
      characterId: character.slug,
      character: updatedCharacter
    });

  } catch (error: any) {
    console.error('❌ Error updating character:', {
      characterId: req.params.id,
      error: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      code: error.code,
      meta: error.meta
    });
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

// User type is extended in index.ts - no need to redeclare here
