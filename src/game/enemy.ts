import * as THREE from 'three';
import { SHIP_CONFIGS, PHYSICS } from './constants';
import type { EnemyShip } from '@/types/game';

export class EnemyManager {
  private enemies: Map<string, { data: EnemyShip; mesh: THREE.Group }> = new Map();
  private scene: THREE.Scene;
  private onDestroyed: ((enemy: EnemyShip) => void) | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setOnDestroyed(cb: (enemy: EnemyShip) => void) {
    this.onDestroyed = cb;
  }

  public spawnEnemy(type: EnemyShip['type'], position: THREE.Vector3): EnemyShip {
    const id = `enemy_${Date.now()}_${Math.random()}`;
    const configKey = type === 'british_patrol' ? 'sloop' : type === 'skeleton_galleon' ? 'galleon' : 'sloop';
    const config = SHIP_CONFIGS[configKey];

    const enemy: EnemyShip = {
      id,
      type,
      position: { x: position.x, y: position.y, z: position.z },
      rotation: Math.random() * Math.PI * 2,
      hull: config.hull,
      maxHull: config.hull,
      speed: 0,
      heading: Math.random() * Math.PI * 2,
      state: 'patrol',
      lastFired: 0,
    };

    const mesh = this.createEnemyMesh(type, config.size);
    mesh.position.copy(position);
    this.scene.add(mesh);

    this.enemies.set(id, { data: enemy, mesh });
    return enemy;
  }

  private createEnemyMesh(type: EnemyShip['type'], size: number): THREE.Group {
    const group = new THREE.Group();

    // Hull
    const hullLength = size;
    const hullWidth = size * 0.25;
    const hullGeom = new THREE.BoxGeometry(hullLength, size * 0.15, hullWidth);
    const hullColor = type === 'british_patrol' ? 0x8B0000 : type === 'skeleton_galleon' ? 0x2F2F2F : 0x8B4513;
    const hullMat = new THREE.MeshStandardMaterial({ color: hullColor });
    const hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.y = size * 0.08;
    hull.castShadow = true;
    group.add(hull);

    // Deck
    const deckGeom = new THREE.BoxGeometry(hullLength * 0.9, 0.2, hullWidth * 0.9);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xA0522D });
    const deck = new THREE.Mesh(deckGeom, deckMat);
    deck.position.y = size * 0.16;
    group.add(deck);

    // Mast
    const mastGeom = new THREE.CylinderGeometry(0.15, 0.2, size * 0.8, 6);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
    const mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(0, size * 0.5, 0);
    group.add(mast);

    // Sails
    const sailGeom = new THREE.PlaneGeometry(size * 0.25, size * 0.3, 4, 4);
    const sailColor = type === 'british_patrol' ? 0xFFFFFF : type === 'skeleton_galleon' ? 0x444444 : 0xF5F5DC;
    const sailMat = new THREE.MeshStandardMaterial({ color: sailColor, side: THREE.DoubleSide });
    const sail = new THREE.Mesh(sailGeom, sailMat);
    sail.position.set(0, size * 0.55, 0);
    group.add(sail);

    // Flag
    const flagGeom = new THREE.PlaneGeometry(1.5, 1, 2, 2);
    const flagColor = type === 'british_patrol' ? 0x0000FF : type === 'skeleton_galleon' ? 0x00FF00 : 0xFF0000;
    const flagMat = new THREE.MeshStandardMaterial({ color: flagColor, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(0, size * 0.9, 0);
    group.add(flag);

    return group;
  }

  public update(delta: number, playerPos: THREE.Vector3, time: number) {
    const toRemove: string[] = [];

    this.enemies.forEach(({ data, mesh }) => {
      if (data.state === 'sink') {
        // Sinking animation
        mesh.rotation.z += delta * 0.3;
        mesh.position.y -= delta * 2;
        if (mesh.position.y < -10) {
          toRemove.push(data.id);
        }
        return;
      }

      // Distance to player
      const dx = playerPos.x - data.position.x;
      const dz = playerPos.z - data.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // AI State machine
      if (data.type === 'merchant') {
        // Merchants flee from player
        if (dist < 150) {
          data.state = 'flee';
          data.heading = Math.atan2(-dx, -dz);
        } else {
          data.state = 'patrol';
          data.heading += delta * 0.1;
        }
      } else {
        // Combat ships
        if (dist < 200 && dist > 50) {
          data.state = 'chase';
          data.heading = Math.atan2(dx, dz);
        } else if (dist <= 50) {
          data.state = 'chase';
          // Circle around player for broadside
          data.heading = Math.atan2(dx, dz) + Math.PI / 2;
          // Try to fire
          if (performance.now() - data.lastFired > 6000) {
            data.lastFired = performance.now();
            // Fire at player (simplified)
          }
        } else {
          data.state = 'patrol';
          data.heading += delta * 0.05;
        }
      }

      // Movement
      const targetSpeed = data.state === 'flee' ? 12 : data.state === 'chase' ? 10 : 5;
      data.speed = THREE.MathUtils.lerp(data.speed, targetSpeed, delta);

      const turnRate = 0.5 * delta;
      data.rotation = THREE.MathUtils.lerp(data.rotation, data.heading, turnRate);

      data.position.x += Math.sin(data.rotation) * data.speed * delta;
      data.position.z += Math.cos(data.rotation) * data.speed * delta;

      // Buoyancy
      const waveHeight = Math.sin(data.position.x * 0.05 + time) * Math.cos(data.position.z * 0.05 + time * 0.8) * PHYSICS.waveHeight;
      data.position.y = waveHeight;

      // Update mesh
      mesh.position.set(data.position.x, data.position.y, data.position.z);
      mesh.rotation.y = data.rotation;

      // Rocking
      mesh.rotation.x = Math.sin(time * 1.5) * 0.05;
      mesh.rotation.z = Math.cos(time * 1.2) * 0.03;
    });

    toRemove.forEach(id => this.removeEnemy(id));
  }

  public takeDamage(enemyId: string, damage: number) {
    const entry = this.enemies.get(enemyId);
    if (!entry) return;

    entry.data.hull -= damage;
    if (entry.data.hull <= 0) {
      entry.data.state = 'sink';
      this.onDestroyed?.(entry.data);
    }
  }

  public getEnemiesInRange(position: THREE.Vector3, radius: number): EnemyShip[] {
    const result: EnemyShip[] = [];
    this.enemies.forEach(({ data }) => {
      const dx = data.position.x - position.x;
      const dz = data.position.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius) result.push(data);
    });
    return result;
  }

  public checkPlayerHit(playerPos: THREE.Vector3, playerRadius: number): { enemy: EnemyShip; damage: number } | null {
    for (const [, { data }] of this.enemies) {
      if (data.state === 'sink') continue;
      const dx = data.position.x - playerPos.x;
      const dz = data.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < playerRadius + 10) {
        // Random chance to hit
        if (Math.random() < 0.3 && performance.now() - data.lastFired > 5000) {
          data.lastFired = performance.now();
          return { enemy: data, damage: 100 };
        }
      }
    }
    return null;
  }

  private removeEnemy(id: string) {
    const entry = this.enemies.get(id);
    if (entry) {
      this.scene.remove(entry.mesh);
      this.enemies.delete(id);
    }
  }

  public dispose() {
    this.enemies.forEach((_, id) => this.removeEnemy(id));
  }
}
