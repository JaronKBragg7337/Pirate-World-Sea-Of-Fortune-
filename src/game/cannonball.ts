import * as THREE from 'three';
import { PHYSICS } from './constants';
import type { CannonBall } from '@/types/game';

export class CannonballSystem {
  private balls: Map<string, { data: CannonBall; mesh: THREE.Mesh }> = new Map();
  private scene: THREE.Scene;
  private onHit: ((id: string, pos: THREE.Vector3) => void) | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setOnHitCallback(cb: (id: string, pos: THREE.Vector3) => void) {
    this.onHit = cb;
  }

  public fire(
    position: THREE.Vector3,
    direction: number,
    elevation: number,
    side: 'left' | 'right',
    ownerId: string
  ) {
    const id = `ball_${Date.now()}_${Math.random()}`;
    const spread = (Math.random() - 0.5) * 0.15;
    const angle = direction + (side === 'left' ? Math.PI / 2 : -Math.PI / 2) + spread;
    const elevRad = elevation * Math.PI / 180;

    const velocity = new THREE.Vector3(
      Math.cos(angle) * Math.cos(elevRad) * PHYSICS.cannonballSpeed,
      Math.sin(elevRad) * PHYSICS.cannonballSpeed * 0.6,
      Math.sin(angle) * Math.cos(elevRad) * PHYSICS.cannonballSpeed
    );

    // Start position - offset from ship side
    const startPos = position.clone();
    startPos.x += Math.cos(angle) * 5;
    startPos.z += Math.sin(angle) * 5;
    startPos.y += 3;

    const mesh = this.createCannonballMesh();
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    const ball: CannonBall = {
      id,
      position: { x: startPos.x, y: startPos.y, z: startPos.z },
      velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
      ownerId,
      createdAt: performance.now(),
    };

    this.balls.set(id, { data: ball, mesh });
    return id;
  }

  private createCannonballMesh(): THREE.Mesh {
    const geom = new THREE.SphereGeometry(0.2, 6, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.6,
      metalness: 0.5,
    });
    return new THREE.Mesh(geom, mat);
  }

  public update(delta: number, waterLevel: number) {
    const toRemove: string[] = [];

    this.balls.forEach(({ data, mesh }) => {
      // Apply gravity
      data.velocity.y += PHYSICS.gravity * delta * 2;

      // Update position
      data.position.x += data.velocity.x * delta;
      data.position.y += data.velocity.y * delta;
      data.position.z += data.velocity.z * delta;

      mesh.position.set(data.position.x, data.position.y, data.position.z);

      // Check lifetime
      if (performance.now() - data.createdAt > 5000) {
        toRemove.push(data.id);
        return;
      }

      // Check water hit
      if (data.position.y < waterLevel) {
        this.onHit?.(data.id, new THREE.Vector3(data.position.x, waterLevel, data.position.z));
        toRemove.push(data.id);
        return;
      }

      // Check out of bounds
      if (Math.abs(data.position.x) > 5000 || Math.abs(data.position.z) > 5000) {
        toRemove.push(data.id);
      }
    });

    toRemove.forEach(id => this.removeBall(id));
  }

  public checkShipHit(shipPos: THREE.Vector3, shipRadius: number): CannonBall | null {
    for (const [, { data }] of this.balls) {
      const dx = data.position.x - shipPos.x;
      const dy = data.position.y - shipPos.y;
      const dz = data.position.z - shipPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < shipRadius && data.ownerId !== 'player') {
        return data;
      }
    }
    return null;
  }

  private removeBall(id: string) {
    const entry = this.balls.get(id);
    if (entry) {
      this.scene.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      (entry.mesh.material as THREE.Material).dispose();
      this.balls.delete(id);
    }
  }

  public createSplash(position: THREE.Vector3) {
    // Simple splash particle
    const particleCount = 15;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 10 + 2,
        (Math.random() - 0.5) * 8
      ));
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
    });

    const points = new THREE.Points(geom, mat);
    this.scene.add(points);

    // Animate splash
    let life = 1.0;
    const animate = () => {
      life -= 0.03;
      if (life <= 0) {
        this.scene.remove(points);
        geom.dispose();
        mat.dispose();
        return;
      }

      const posArray = geom.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        velocities[i].y -= 9.81 * 0.016;
        posArray[i * 3] += velocities[i].x * 0.016;
        posArray[i * 3 + 1] += velocities[i].y * 0.016;
        posArray[i * 3 + 2] += velocities[i].z * 0.016;
      }
      geom.attributes.position.needsUpdate = true;
      mat.opacity = life;
      requestAnimationFrame(animate);
    };
    animate();
  }

  public createHitEffect(position: THREE.Vector3) {
    // Wood splinter effect
    const particleCount = 20;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        Math.random() * 8 + 2,
        (Math.random() - 0.5) * 12
      ));
      // Wood colors
      colors[i * 3] = 0.55 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.27 + Math.random() * 0.1;
      colors[i * 3 + 2] = 0.07;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.3,
      transparent: true,
      opacity: 1,
      vertexColors: true,
    });

    const points = new THREE.Points(geom, mat);
    this.scene.add(points);

    let life = 1.0;
    const animate = () => {
      life -= 0.025;
      if (life <= 0) {
        this.scene.remove(points);
        geom.dispose();
        mat.dispose();
        return;
      }

      const posArray = geom.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        velocities[i].y -= 9.81 * 0.016;
        posArray[i * 3] += velocities[i].x * 0.016;
        posArray[i * 3 + 1] += velocities[i].y * 0.016;
        posArray[i * 3 + 2] += velocities[i].z * 0.016;
      }
      geom.attributes.position.needsUpdate = true;
      mat.opacity = life;
      requestAnimationFrame(animate);
    };
    animate();
  }

  public dispose() {
    this.balls.forEach((_, id) => this.removeBall(id));
  }
}
