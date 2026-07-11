import * as THREE from 'three';

export interface HullDamage {
  id: string;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  size: number;
  belowWaterline: boolean;
  mesh: THREE.Mesh;
  leakParticles: THREE.Points | null;
  repairProgress: number;
  repaired: boolean;
}

export class DamageSystem {
  public damages: HullDamage[] = [];
  private scene: THREE.Group;
  private waterlineY: number = 0;
  private nextId: number = 0;

  constructor(scene: THREE.Group) {
    this.scene = scene;
  }

  public addDamage(position: THREE.Vector3, normal: THREE.Vector3): HullDamage {
    const id = `damage_${this.nextId++}`;
    const belowWaterline = position.y < this.waterlineY;
    const size = 0.3 + Math.random() * 0.5;

    // Create damage hole (dark circle on hull)
    const holeGeom = new THREE.CircleGeometry(size, 8);
    const holeMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 1,
      side: THREE.DoubleSide,
    });
    const holeMesh = new THREE.Mesh(holeGeom, holeMat);
    holeMesh.position.copy(position);
    holeMesh.lookAt(position.clone().add(normal));
    this.scene.add(holeMesh);

    // Create splintered wood around hole
    const splinterGeom = new THREE.RingGeometry(size, size * 1.6, 8);
    const splinterMat = new THREE.MeshStandardMaterial({
      color: 0x5C3A1E,
      roughness: 0.95,
      side: THREE.DoubleSide,
    });
    const splinters = new THREE.Mesh(splinterGeom, splinterMat);
    splinters.position.copy(position);
    splinters.lookAt(position.clone().add(normal));
    splinters.position.add(normal.clone().multiplyScalar(0.01));
    this.scene.add(splinters);

    // Water leak particles if below waterline
    let leakParticles: THREE.Points | null = null;
    if (belowWaterline) {
      leakParticles = this.createLeakParticles(position, normal, size);
      this.scene.add(leakParticles);
    }

    const damage: HullDamage = {
      id,
      position: position.clone(),
      normal: normal.clone(),
      size,
      belowWaterline,
      mesh: holeMesh,
      leakParticles,
      repairProgress: 0,
      repaired: false,
    };

    this.damages.push(damage);
    return damage;
  }

  private createLeakParticles(position: THREE.Vector3, normal: THREE.Vector3, size: number): THREE.Points {
    const count = 50;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      // Start from hole
      positions[i * 3] = position.x + (Math.random() - 0.5) * size;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * size;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * size;

      // Spray inward
      const spread = 0.5;
      velocities.push(new THREE.Vector3(
        -normal.x * (2 + Math.random() * 2) + (Math.random() - 0.5) * spread,
        -normal.y * (1 + Math.random()) + Math.random() * 0.5,
        -normal.z * (2 + Math.random() * 2) + (Math.random() - 0.5) * spread
      ));
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x4A9BC7,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geom, mat);
    points.userData = { velocities, position: position.clone() };
    return points;
  }

  public update(delta: number, _time: number) {
    // Animate leak particles
    for (const damage of this.damages) {
      if (damage.repaired || !damage.leakParticles) continue;

      const particles = damage.leakParticles;
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const velocities = particles.userData.velocities as THREE.Vector3[];
      const origin = particles.userData.position as THREE.Vector3;

      for (let i = 0; i < velocities.length; i++) {
        // Update position
        positions[i * 3] += velocities[i].x * delta;
        positions[i * 3 + 1] += velocities[i].y * delta;
        positions[i * 3 + 2] += velocities[i].z * delta;

        // Gravity
        velocities[i].y -= 3 * delta;

        // Reset if too far or below floor
        const dx = positions[i * 3] - origin.x;
        const dy = positions[i * 3 + 1] - origin.y;
        const dz = positions[i * 3 + 2] - origin.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > 3 || positions[i * 3 + 1] < -2) {
          positions[i * 3] = origin.x + (Math.random() - 0.5) * damage.size;
          positions[i * 3 + 1] = origin.y + (Math.random() - 0.5) * damage.size;
          positions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * damage.size;

          const spread = 0.5;
          velocities[i].set(
            -damage.normal.x * (2 + Math.random() * 2) + (Math.random() - 0.5) * spread,
            -damage.normal.y * (1 + Math.random()) + Math.random() * 0.5,
            -damage.normal.z * (2 + Math.random() * 2) + (Math.random() - 0.5) * spread
          );
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
    }
  }

  public repairDamage(damageId: string, amount: number): boolean {
    const damage = this.damages.find(d => d.id === damageId);
    if (!damage || damage.repaired) return false;

    damage.repairProgress += amount;

    if (damage.repairProgress >= 1) {
      damage.repaired = true;

      // Visual: patch the hole with lighter wood
      const patchGeom = new THREE.CircleGeometry(damage.size * 1.2, 8);
      const patchMat = new THREE.MeshStandardMaterial({
        color: 0x8B6B4A,
        roughness: 0.9,
        side: THREE.DoubleSide,
      });
      const patch = new THREE.Mesh(patchGeom, patchMat);
      patch.position.copy(damage.position);
      patch.lookAt(damage.position.clone().add(damage.normal));
      patch.position.add(damage.normal.clone().multiplyScalar(0.02));
      this.scene.add(patch);

      // Remove leak particles
      if (damage.leakParticles) {
        this.scene.remove(damage.leakParticles);
        damage.leakParticles.geometry.dispose();
        (damage.leakParticles.material as THREE.Material).dispose();
        damage.leakParticles = null;
      }

      // Fade out hole
      damage.mesh.material = new THREE.MeshStandardMaterial({
        color: 0x5C3A1E,
        roughness: 0.9,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      });

      return true;
    }

    return false;
  }

  public getActiveDamages(): HullDamage[] {
    return this.damages.filter(d => !d.repaired);
  }

  public getFloodingLevel(): number {
    const activeBelowWater = this.damages.filter(d => !d.repaired && d.belowWaterline);
    return Math.min(1, activeBelowWater.length * 0.15);
  }

  public checkHit(position: THREE.Vector3): HullDamage | null {
    return this.damages.find(d => !d.repaired && d.position.distanceTo(position) < 1) || null;
  }

  public dispose() {
    for (const damage of this.damages) {
      this.scene.remove(damage.mesh);
      damage.mesh.geometry.dispose();
      (damage.mesh.material as THREE.Material).dispose();
      if (damage.leakParticles) {
        this.scene.remove(damage.leakParticles);
        damage.leakParticles.geometry.dispose();
        (damage.leakParticles.material as THREE.Material).dispose();
      }
    }
    this.damages = [];
  }
}
