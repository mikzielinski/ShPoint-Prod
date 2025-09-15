export interface Set {
  id: string;
  name: string;
  code: string; // SWPXX
  type: 'Core Set' | 'Squad Pack' | 'Terrain Pack' | 'Duel Pack' | 'Mission Pack';
  image?: string;
  characters?: Array<{
    role: 'Primary' | 'Secondary' | 'Supporting';
    name: string;
  }>;
  description?: string;
  product_url?: string;
}

// Real data from Atomic Mass Games
export const setsData: Set[] = [
  {
    id: 'swp01',
    name: 'Star Wars: Shatterpoint Core Set',
    code: 'SWP01',
    type: 'Core Set',
    description: 'The essential starter set for Star Wars: Shatterpoint',
    product_url: 'https://www.atomicmassgames.com/character/star-wars-shatterpoint-core-set/',
    characters: [
      { role: 'Primary', name: 'General Anakin Skywalker' },
      { role: 'Secondary', name: 'Captain Rex (CC-7567)' },
      { role: 'Supporting', name: '501st Clone Troopers' },
      { role: 'Primary', name: 'Ahsoka Tano, Jedi no more' },
      { role: 'Secondary', name: 'Bo-Katan Kryze' },
      { role: 'Supporting', name: 'Clan Kryze Mandalorians' },
      { role: 'Primary', name: 'Asajj Ventress, Sith Assassin' },
      { role: 'Secondary', name: 'Kalani (Super Tactical Droid)' },
      { role: 'Supporting', name: 'B1 Battle Droids' },
      { role: 'Primary', name: 'Darth Maul (Lord Maul)' },
      { role: 'Secondary', name: 'Gar Saxon' },
      { role: 'Supporting', name: 'Shadow Collective Commandos' }
    ]
  },
  {
    id: 'swp03',
    name: 'Twice the Pride Squad Pack',
    code: 'SWP03',
    type: 'Squad Pack',
    description: 'Count Dooku and his allies',
    product_url: 'https://www.atomicmassgames.com/character/twice-the-pride-squad-pack/',
    characters: [
      { role: 'Primary', name: 'Count Dooku, Separatist Leader' },
      { role: 'Secondary', name: 'Jango Fett, Bounty Hunter' },
      { role: 'Supporting', name: 'IG-100 MagnaGuards' }
    ]
  },
  {
    id: 'swp04',
    name: 'Plans and Preparations Squad Pack',
    code: 'SWP04',
    type: 'Squad Pack',
    description: 'Luminara Unduli and her allies',
    product_url: 'https://www.atomicmassgames.com/character/plans-and-preparations-squad-pack/',
    characters: [
      { role: 'Primary', name: 'Jedi Master Luminara Unduli' },
      { role: 'Secondary', name: 'Barriss Offee, Jedi Padawan' },
      { role: 'Supporting', name: 'Republic Clone Commandos' }
    ]
  },
  {
    id: 'swp05',
    name: 'Appetite for Destruction Squad Pack',
    code: 'SWP05',
    type: 'Squad Pack',
    description: 'General Grievous and his allies',
    product_url: 'https://www.atomicmassgames.com/character/appetite-for-destruction-squad-pack/',
    characters: [
      { role: 'Primary', name: 'General Grievous' },
      { role: 'Secondary', name: 'Kraken (Super Tactical Droid)' },
      { role: 'Supporting', name: 'B2 Battle Droids' }
    ]
  },
  {
    id: 'swp06',
    name: 'Hello There Squad Pack',
    code: 'SWP06',
    type: 'Squad Pack',
    description: 'General Obi-Wan Kenobi and his allies',
    product_url: 'https://www.atomicmassgames.com/character/hello-there-squad-pack/',
    characters: [
      { role: 'Primary', name: 'General Obi-Wan Kenobi' },
      { role: 'Secondary', name: 'Clone Commander Cody' },
      { role: 'Supporting', name: '212th Clone Troopers' }
    ]
  },
  {
    id: 'swp07',
    name: 'Witches of Dathomir Squad Pack',
    code: 'SWP07',
    type: 'Squad Pack',
    description: 'Mother Talzin and the Nightsisters',
    product_url: 'https://www.atomicmassgames.com/character/witches-of-dathomir-squad-pack/',
    characters: [
      { role: 'Primary', name: 'Mother Talzin' },
      { role: 'Secondary', name: 'Savage Opress' },
      { role: 'Supporting', name: 'Nightsister Acolytes' }
    ]
  },
  {
    id: 'swp08',
    name: 'This Party\'s Over Squad Pack',
    code: 'SWP08',
    type: 'Squad Pack',
    description: 'Mace Windu and his allies',
    product_url: 'https://www.atomicmassgames.com/character/this-partys-over-squad-pack/',
    characters: [
      { role: 'Primary', name: 'Jedi Master Mace Windu' },
      { role: 'Secondary', name: 'CT-411 Commander Ponds' },
      { role: 'Supporting', name: 'ARF Clone Troopers' }
    ]
  },
  {
    id: 'swp09',
    name: 'Fistful of Credits Squad Pack',
    code: 'SWP09',
    type: 'Squad Pack',
    description: 'Cad Bane and the bounty hunters',
    product_url: 'https://www.atomicmassgames.com/character/fistful-of-credits-squad-pack/',
    characters: [
      { role: 'Primary', name: 'Cad Bane, Notorious Hunter' },
      { role: 'Secondary', name: 'Aurra Sing' },
      { role: 'Supporting', name: 'Bounty Hunters (Chadra-Fan, Todo 360, Devaronian)' }
    ]
  },
  {
    id: 'swp10',
    name: 'That\'s Good Business Squad Pack',
    code: 'SWP10',
    type: 'Squad Pack',
    description: 'Hondo Ohnaka and his pirates',
    product_url: 'https://www.atomicmassgames.com/character/thats-good-business-squad-pack/',
    characters: [
      { role: 'Primary', name: 'Hondo, Honest Businessman' },
      { role: 'Secondary', name: 'Gwarm' },
      { role: 'Supporting', name: 'Weequay Pirates' }
    ]
  },
  {
    id: 'swp11',
    name: 'Lead By Example Squad Pack',
    code: 'SWP11',
    type: 'Squad Pack',
    description: 'Plo Koon and the Wolfpack',
    product_url: 'https://www.atomicmassgames.com/character/lead-by-example-squad-pack/',
    characters: [
      { role: 'Primary', name: 'Jedi Master Plo Koon' },
      { role: 'Secondary', name: 'Clone Commander Wolffe' },
      { role: 'Supporting', name: '104th Wolfpack Troopers' }
    ]
  },
  {
    id: 'swp16',
    name: 'This Is the Way Squad Pack',
    code: 'SWP16',
    type: 'Squad Pack',
    description: 'The Armorer and her Mandalorians',
    product_url: 'https://www.atomicmassgames.com/character/this-is-the-way-squad-pack/',
    characters: [
      { role: 'Primary', name: 'The Armorer' },
      { role: 'Secondary', name: 'Paz Vizsla' },
      { role: 'Supporting', name: 'Covert Mandalorians' }
    ]
  },
  {
    id: 'swp21',
    name: 'Fear and Dead Men Squad Pack',
    code: 'SWP21',
    type: 'Squad Pack',
    description: 'Darth Vader and the Empire',
    product_url: 'https://www.atomicmassgames.com/character/fear-and-dead-men-squad-pack/',
    characters: [
      { role: 'Primary', name: 'Darth Vader' },
      { role: 'Secondary', name: 'Commander (Imperial Officer)' },
      { role: 'Supporting', name: 'Stormtroopers' }
    ]
  },
  {
    id: 'swp22',
    name: 'Fearless and Inventive Squad Pack',
    code: 'SWP22',
    type: 'Squad Pack',
    description: 'Luke Skywalker and the Rebellion',
    product_url: 'https://www.atomicmassgames.com/character/fearless-and-inventive-squad-pack/',
    characters: [
      { role: 'Primary', name: 'Luke Skywalker (Jedi Knight)' },
      { role: 'Secondary', name: 'Leia Organa (Boushh Disguise)' },
      { role: 'Supporting', name: 'Lando Calrissian & R2-D2' }
    ]
  },
  {
    id: 'swp24',
    name: 'Certified Guild Squad Pack',
    code: 'SWP24',
    type: 'Squad Pack',
    description: 'Din Djarin and his allies',
    product_url: 'https://www.atomicmassgames.com/character/certified-guild-squad-pack/',
    characters: [
      { role: 'Primary', name: 'Din Djarin (The Mandalorian)' },
      { role: 'Secondary', name: 'IG-11' },
      { role: 'Supporting', name: 'Greef Karga' }
    ]
  }
];
