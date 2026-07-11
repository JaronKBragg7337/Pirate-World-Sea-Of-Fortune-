import * as THREE from 'three';
import { COLORS } from './constants';

export class PlayerCharacter {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public onDeck: boolean = true;
  public atStation: string | null = null;
  private cameraOffset: THREE.Vector3;
  private speed: number = 8;
  private rotation: number = 0;
  private targetRotation: number = 0;
  private model: THREE.Group;

  constructor() {
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3();
    this.cameraOffset = new THREE.Vector3(0, 4, -6);
    this.mesh = new THREE.Group();
    this.mesh.name = 'player';
    this.model = this.createCharacterModel();
    this.mesh.add(this.model);
    this.mesh.position.copy(this.position);
  }

  private createCharacterModel(): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeom = new THREE.CapsuleGeometry(0.35, 0.8, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 0.9 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.75;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeom = new THREE.SphereGeometry(0.25, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xE8A87C, roughness: 0.7 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.55;
    head.castShadow = true;
    group.add(head);

    // Tricorn hat
    const hatBrimGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 6);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
    hatBrim.position.y = 1.75;
    group.add(hatBrim);

    const hatTopGeom = new THREE.CylinderGeometry(0.22, 0.28, 0.2, 6);
    const hatTop = new THREE.Mesh(hatTopGeom, hatMat);
    hatTop.position.y = 1.88;
    group.add(hatTop);

    // Belt
    const beltGeom = new THREE.CylinderGeometry(0.37, 0.37, 0.1, 8);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
    const belt = new THREE.Mesh(beltGeom, beltMat);
    belt.position.y = 0.5;
    group.add(belt);

    // Belt buckle
    const buckleGeom = new THREE.BoxGeometry(0.12, 0.08, 0.05);
    const buckleMat = new THREE.MeshStandardMaterial({ color: COLORS.gold, metalness: 0.8, roughness: 0.2 });
    const buckle = new THREE.Mesh(buckleGeom, buckleMat);
    buckle.position.set(0, 0.5, 0.37);
    group.add(buckle);

    // Boots
    const bootGeom = new THREE.CylinderGeometry(0.12, 0.1, 0.3, 6);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    
    const leftBoot = new THREE.Mesh(bootGeom, bootMat);
    leftBoot.position.set(-0.15, 0.15, 0);
    group.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeom, bootMat);
    rightBoot.position.set(0.15, 0.15, 0);
    group.add(rightBoot);

    // Arms
    const armGeom = new THREE.CapsuleGeometry(0.1, 0.5, 4, 6);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x5C3A1E });
    
    const leftArm = new THREE.Mesh(armGeom, armMat);
    leftArm.position.set(-0.45, 0.9, 0);
    leftArm.rotation.z = 0.2;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, armMat);
    rightArm.position.set(0.45, 0.9, 0);
    rightArm.rotation.z = -0.2;
    group.add(rightArm);

    return group;
  }

  public update(
    delta: number,
    moveX: number,
    moveZ: number,
    cameraAngle: number,
    shipRotation: number,
    deckHeight: number
  ) {
    // Movement relative to camera
    const forward = new THREE.Vector3(Math.sin(cameraAngle), 0, Math.cos(cameraAngle));
    const right = new THREE.Vector3(Math.cos(cameraAngle), 0, -Math.sin(cameraAngle));

    const moveDir = new THREE.Vector3()
      .addScaledVector(forward, -moveZ)
      .addScaledVector(right, moveX);

    if (moveDir.length() > 0.1) {
      moveDir.normalize();
      this.velocity.x = moveDir.x * this.speed;
      this.velocity.z = moveDir.z * this.speed;
      this.targetRotation = Math.atan2(moveDir.x, moveDir.z);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // Smooth rotation
    let rotDiff = this.targetRotation - this.rotation;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    this.rotation += rotDiff * Math.min(1, delta * 10);

    // Update position
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;
    this.position.y = deckHeight + 0.3;

    // Clamp to ship deck bounds (relative to ship center)
    const deckHalfWidth = 5;
    const deckHalfLength = 18;
    const shipSin = Math.sin(shipRotation);
    const shipCos = Math.cos(shipRotation);

    // Transform to ship-local space, clamp, transform back
    const localX = this.position.x * shipCos + this.position.z * shipSin;
    const localZ = -this.position.x * shipSin + this.position.z * shipCos;

    const clampedLocalX = Math.max(-deckHalfWidth, Math.min(deckHalfWidth, localX));
    const clampedLocalZ = Math.max(-deckHalfLength, Math.min(deckHalfLength, localZ));

    this.position.x = clampedLocalX * shipCos - clampedLocalZ * shipSin;
    this.position.z = clampedLocalX * shipSin + clampedLocalZ * shipCos;

    // Update mesh
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;

    // Walk animation
    if (this.velocity.length() > 0.5) {
      const walkCycle = performance.now() * 0.01;
      this.model.position.y = Math.sin(walkCycle) * 0.05;
      this.model.rotation.z = Math.sin(walkCycle * 0.5) * 0.03;
    } else {
      this.model.position.y = 0;
      this.model.rotation.z = 0;
    }
  }

  public setPosition(pos: THREE.Vector3) {
    this.position.copy(pos);
    this.mesh.position.copy(pos);
  }

  public getCameraPosition(): THREE.Vector3 {
    const offset = this.cameraOffset.clone();
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
    return this.position.clone().add(offset);
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public dispose() {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
