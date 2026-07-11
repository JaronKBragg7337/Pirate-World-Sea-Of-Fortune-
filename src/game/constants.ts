import type { ShipConfig } from '@/types/game';

// Color palette matching design doc
export const COLORS = {
  oceanDeep: 0x1A3C5A,
  oceanSurface: 0x2E6B8E,
  oceanShallow: 0x4A9BC7,
  foam: 0xFFFFFF,
  gold: 0xD4A843,
  wood: 0x8B4513,
  woodDark: 0x5D4037,
  iron: 0xC0C0C0,
  ironDark: 0x555555,
  white: 0xFFFFFF,
  textSecondary: 0xA3B8CC,
  success: 0x2ECC71,
  danger: 0xE74C3C,
  skyDay: 0x87CEEB,
  sunset: 0xFF8C42,
  night: 0x0F1F2E,
} as const;

// Ship configurations by tier
export const SHIP_CONFIGS: Record<string, ShipConfig> = {
  sloop: {
    name: 'Sloop',
    hull: 1000,
    maxSpeed: 18,
    turnRate: 1.2,
    cannonsPerSide: 2,
    cannonReload: 8,
    crewCapacity: 4,
    size: 15,
    description: 'Fast and nimble. Perfect for beginners.',
  },
  cutter: {
    name: 'Cutter',
    hull: 1500,
    maxSpeed: 20,
    turnRate: 1.5,
    cannonsPerSide: 3,
    cannonReload: 7,
    crewCapacity: 6,
    size: 20,
    description: 'Swift escort vessel.',
  },
  brigantine: {
    name: 'Brigantine',
    hull: 3000,
    maxSpeed: 16,
    turnRate: 0.9,
    cannonsPerSide: 5,
    cannonReload: 9,
    crewCapacity: 12,
    size: 30,
    description: 'Balanced warship with crew stations.',
  },
  galleon: {
    name: 'Galleon',
    hull: 5000,
    maxSpeed: 12,
    turnRate: 0.5,
    cannonsPerSide: 8,
    cannonReload: 12,
    crewCapacity: 20,
    size: 40,
    description: 'Heavy British naval vessel.',
  },
  manowar: {
    name: "Man o' War",
    hull: 8000,
    maxSpeed: 10,
    turnRate: 0.4,
    cannonsPerSide: 12,
    cannonReload: 15,
    crewCapacity: 30,
    size: 50,
    description: 'The ultimate warship.',
  },
};

// Wind configuration
export const WIND = {
  baseSpeed: 8,
  maxSpeed: 20,
  noGoZoneAngle: Math.PI / 6, // 30 degrees - can't sail directly into wind
  withWindBonus: 1.4,
  againstWindPenalty: 0.1,
  changeInterval: 60000, // Wind changes every 60 seconds
};

// Physics
export const PHYSICS = {
  gravity: -9.81,
  waterLevel: 0,
  cannonballSpeed: 80,
  cannonballGravity: 15,
  cannonDamage: 150,
  rammingDamage: 500,
  sinkSpeed: 0.5,
  buoyancyFactor: 2.5,
  waveHeight: 1.5,
  waveSpeed: 0.8,
  waveFrequency: 0.1,
};

// World
export const WORLD = {
  size: 5000,
  chunkSize: 500,
  islandCount: 12,
  enemyCount: 8,
  lootSpawnRate: 0.3,
};

// Crew names for random generation
export const CREW_NAMES = [
  'Blackbeard', 'Calico Jack', 'Anne Bonny', 'Henry Morgan',
  'Bartholomew', 'Mary Read', 'Charles Vane', 'Edward Low',
  'Samuel Bellamy', 'William Kidd', 'Thomas Tew', 'Howell Davis',
  'John Rackham', 'Stede Bonnet', 'Francis Drake', 'Jack Ward',
  'Ned Low', 'Christopher Moody', 'Edward England', 'Richard Worley',
  'Old Salt', 'One-Eye', 'Peg Leg Pete', 'Salty Sam',
  'Crusty Jim', 'Barnacle Bill', 'Davy Jones', 'Hook Hand Harry',
  'Mad Dog', 'Scarface', 'Bloody Mary', 'Cannonball Carl',
];

// Island names
export const ISLAND_NAMES = [
  'Tortuga', 'Port Royal', 'Nassau', 'Havana',
  'Barbados', 'Jamaica', 'Martinique', 'Guadeloupe',
  'Dominica', 'St. Lucia', 'Antigua', 'Nevis',
];

// Renown thresholds
export const RENOWN_THRESHOLDS = {
  sloop: 0,
  cutter: 500,
  brigantine: 1500,
  galleon: 4000,
  manowar: 8000,
};

// Input key mappings
export const KEY_MAP = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  fireLeft: 'KeyQ',
  fireRight: 'KeyE',
  anchor: 'KeyF',
  crewPanel: 'KeyC',
  map: 'KeyM',
  pause: 'Escape',
} as const;
