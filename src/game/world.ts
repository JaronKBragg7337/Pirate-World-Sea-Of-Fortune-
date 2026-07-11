import * as THREE from 'three';
import { COLORS, WORLD } from './constants';
import { ISLAND_NAMES } from './constants';
import type { Island, LootCrate } from '@/types/game';

export class WorldGenerator {
  public islands: Island[] = [];
  public lootCrates: LootCrate[] = [];
  private islandMeshes: Map<string, THREE.Group> = new Map();
  private lootMeshes: Map<string, THREE.Mesh> = new Map();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.generateIslands();
    this.generateLootCrates();
  }

  private generateIslands() {
    const usedNames = new Set<string>();

    for (let i = 0; i < WORLD.islandCount; i++) {
      const angle = (i / WORLD.islandCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 300 + Math.random() * 800;
      const size = 30 + Math.random() * 80;
      
      // Pick unique name
      let name = ISLAND_NAMES[i % ISLAND_NAMES.length];
      let attempts = 0;
      while (usedNames.has(name) && attempts < 20) {
        name = ISLAND_NAMES[Math.floor(Math.random() * ISLAND_NAMES.length)];
        attempts++;
      }
      usedNames.add(name);

      const island: Island = {
        id: `island_${i}`,
        position: {
          x: Math.cos(angle) * distance,
          y: 0,
          z: Math.sin(angle) * distance,
        },
        size,
        name,
        hasHarbor: Math.random() > 0.3,
      };

      this.islands.push(island);
      this.createIslandMesh(island);
    }
  }

  private createIslandMesh(island: Island) {
    const group = new THREE.Group();
    group.position.set(island.position.x, 0, island.position.z);

    // Main island body (rocky base)
    const baseGeom = new THREE.ConeGeometry(island.size, island.size * 0.6, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x6B5B3E,
      roughness: 0.95,
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = -island.size * 0.2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Beach ring
    const beachGeom = new THREE.RingGeometry(island.size * 0.8, island.size, 32);
    const beachMat = new THREE.MeshStandardMaterial({
      color: 0xF0E68C,
      roughness: 1,
    });
    const beach = new THREE.Mesh(beachGeom, beachMat);
    beach.rotation.x = -Math.PI / 2;
    beach.position.y = 0.1;
    group.add(beach);

    // Vegetation (palm trees)
    const treeCount = Math.floor(island.size / 5);
    for (let i = 0; i < treeCount; i++) {
      const tree = this.createPalmTree();
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * island.size * 0.4;
      tree.position.set(
        Math.cos(angle) * dist,
        island.size * 0.05,
        Math.sin(angle) * dist
      );
      tree.scale.setScalar(0.5 + Math.random() * 0.5);
      group.add(tree);
    }

    // Harbor dock if applicable
    if (island.hasHarbor) {
      const dock = this.createDock();
      dock.position.set(island.size * 0.9, 0, 0);
      group.add(dock);
    }

    // Name label (floating text)
    const labelSprite = this.createTextSprite(island.name);
    labelSprite.position.set(0, island.size * 0.5, 0);
    group.add(labelSprite);

    this.scene.add(group);
    this.islandMeshes.set(island.id, group);
  }

  private createPalmTree(): THREE.Group {
    const group = new THREE.Group();

    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.3, 0.4, 6, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B6914 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 3;
    trunk.castShadow = true;
    group.add(trunk);

    // Palm fronds
    const frondGeom = new THREE.ConeGeometry(1.5, 3, 4);
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x2ECC71 });
    for (let i = 0; i < 6; i++) {
      const frond = new THREE.Mesh(frondGeom, frondMat);
      const angle = (i / 6) * Math.PI * 2;
      frond.position.set(Math.cos(angle) * 0.8, 5.5, Math.sin(angle) * 0.8);
      frond.rotation.z = Math.cos(angle) * 0.6;
      frond.rotation.x = Math.sin(angle) * 0.6;
      group.add(frond);
    }

    return group;
  }

  private createDock(): THREE.Group {
    const group = new THREE.Group();

    const plankGeom = new THREE.BoxGeometry(8, 0.3, 3);
    const plankMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark });
    
    for (let i = 0; i < 5; i++) {
      const plank = new THREE.Mesh(plankGeom, plankMat);
      plank.position.set(i * 3, 0.5, 0);
      group.add(plank);
    }

    // Posts
    const postGeom = new THREE.CylinderGeometry(0.15, 0.15, 4, 6);
    const postMat = new THREE.MeshStandardMaterial({ color: COLORS.wood });
    
    [-1, 1].forEach(side => {
      for (let i = 0; i < 3; i++) {
        const post = new THREE.Mesh(postGeom, postMat);
        post.position.set(i * 6, 0, side * 1.5);
        group.add(post);
      }
    });

    return group;
  }

  private createTextSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(40, 10, 1);
    return sprite;
  }

  private generateLootCrates() {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 600;
      const crate: LootCrate = {
        id: `loot_${i}`,
        position: {
          x: Math.cos(angle) * dist,
          y: 0.5,
          z: Math.sin(angle) * dist,
        },
        contents: {
          gold: 20 + Math.floor(Math.random() * 80),
          cannonballs: 5 + Math.floor(Math.random() * 15),
          repairs: Math.floor(Math.random() * 5),
        },
      };
      this.lootCrates.push(crate);
      this.createLootMesh(crate);
    }
  }

  private createLootMesh(crate: LootCrate) {
    const group = new THREE.Group();
    group.position.set(crate.position.x, crate.position.y, crate.position.z);

    // Crate body
    const crateGeom = new THREE.BoxGeometry(1.5, 1.2, 1.5);
    const crateMat = new THREE.MeshStandardMaterial({
      color: COLORS.wood,
      roughness: 0.8,
    });
    const mesh = new THREE.Mesh(crateGeom, crateMat);
    mesh.castShadow = true;
    group.add(mesh);

    // Iron bands
    const bandGeom = new THREE.BoxGeometry(1.55, 0.15, 1.55);
    const bandMat = new THREE.MeshStandardMaterial({
      color: COLORS.ironDark,
      metalness: 0.6,
    });
    const band1 = new THREE.Mesh(bandGeom, bandMat);
    band1.position.y = 0.3;
    group.add(band1);
    const band2 = new THREE.Mesh(bandGeom, bandMat);
    band2.position.y = -0.3;
    group.add(band2);

    // Glow effect
    const glowGeom = new THREE.SphereGeometry(2, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: COLORS.gold,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    group.add(glow);

    this.scene.add(group);
    this.lootMeshes.set(crate.id, group.children[0] as THREE.Mesh);

    // Animate glow
    const animate = () => {
      if (glow.parent) {
        glow.scale.setScalar(1 + Math.sin(performance.now() * 0.002) * 0.2);
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  public getNearbyIsland(position: THREE.Vector3, radius: number): Island | null {
    for (const island of this.islands) {
      const dx = island.position.x - position.x;
      const dz = island.position.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius + island.size) {
        return island;
      }
    }
    return null;
  }

  public collectLoot(crateId: string): LootCrate | null {
    const idx = this.lootCrates.findIndex(c => c.id === crateId);
    if (idx === -1) return null;

    const crate = this.lootCrates[idx];
    this.lootCrates.splice(idx, 1);

    const mesh = this.lootMeshes.get(crateId);
    if (mesh?.parent) {
      this.scene.remove(mesh.parent);
    }
    this.lootMeshes.delete(crateId);

    return crate;
  }

  public getNearbyLoot(position: THREE.Vector3, radius: number): LootCrate | null {
    for (const crate of this.lootCrates) {
      const dx = crate.position.x - position.x;
      const dz = crate.position.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius) return crate;
    }
    return null;
  }

  public dispose() {
    this.islandMeshes.forEach(group => this.scene.remove(group));
    this.islandMeshes.clear();
    this.lootMeshes.clear();
  }
}
