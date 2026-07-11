export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ShipConfig {
  name: string;
  hull: number;
  maxSpeed: number;
  turnRate: number;
  cannonsPerSide: number;
  cannonReload: number;
  crewCapacity: number;
  size: number;
  description: string;
}

export interface CrewMember {
  id: string;
  name: string;
  role: CrewRole;
  skill: number;
  portrait?: string;
}

export type CrewRole = 'idle' | 'cannons' | 'repairs' | 'sails';

export interface ShipState {
  position: Vec3;
  rotation: Vec3;
  velocity: Vec3;
  hull: number;
  maxHull: number;
  speed: number;
  heading: number;
  sailLevel: number;
  cannonCooldown: number;
  crew: CrewMember[];
  gold: number;
  cannonballs: number;
  repairs: number;
}

export interface WindState {
  direction: number;
  speed: number;
}

export type GameScreen = 'menu' | 'shipSelect' | 'harbor' | 'playing' | 'paused';

export interface GameState {
  screen: GameScreen;
  playerShip: ShipState;
  wind: WindState;
  renown: number;
  score: number;
  selectedShipType: string;
  isInCombat: boolean;
  damageTaken: number;
  shipsSunk: number;
}

export interface CannonBall {
  id: string;
  position: Vec3;
  velocity: Vec3;
  ownerId: string;
  createdAt: number;
}

export interface EnemyShip {
  id: string;
  type: 'british_patrol' | 'skeleton_galleon' | 'merchant';
  position: Vec3;
  rotation: number;
  hull: number;
  maxHull: number;
  speed: number;
  heading: number;
  state: 'patrol' | 'chase' | 'flee' | 'sink';
  lastFired: number;
}

export interface Island {
  id: string;
  position: Vec3;
  size: number;
  name: string;
  hasHarbor: boolean;
}

export interface LootCrate {
  id: string;
  position: Vec3;
  contents: { gold: number; cannonballs: number; repairs: number };
}
