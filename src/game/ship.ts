import * as THREE from 'three';
import { COLORS } from './constants';
import type { ShipConfig, CrewRole } from '@/types/game';

export class Ship {
  public mesh: THREE.Group;
  public hullMesh!: THREE.Mesh;
  public sails: THREE.Mesh[] = [];
  public cannons: THREE.Mesh[] = [];
  public crewMarkers: THREE.Mesh[] = [];
  private config: ShipConfig;
  private sailMaterial: THREE.MeshStandardMaterial;
  private crewRoleMaterials: Map<CrewRole, THREE.MeshBasicMaterial>;

  constructor(config: ShipConfig) {
    this.config = config;
    this.mesh = new THREE.Group();
    this.mesh.name = 'ship';

    // Crew role indicator materials
    this.crewRoleMaterials = new Map([
      ['idle', new THREE.MeshBasicMaterial({ color: 0x888888 })],
      ['cannons', new THREE.MeshBasicMaterial({ color: 0xff4444 })],
      ['repairs', new THREE.MeshBasicMaterial({ color: 0x44ff44 })],
      ['sails', new THREE.MeshBasicMaterial({ color: 0x4444ff })],
    ]);

    this.sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5dc,
      side: THREE.DoubleSide,
      roughness: 0.9,
    });

    this.buildHull();
    this.buildDeck();
    this.buildMasts();
    this.buildCannons();
    this.buildDetails();
    this.buildCrewMarkers();
  }

  private buildHull() {
    // Main hull body
    const hullLength = this.config.size;
    const hullWidth = this.config.size * 0.25;
    const hullHeight = this.config.size * 0.15;

    // Hull shape using a custom geometry
    const hullShape = new THREE.Shape();
    hullShape.moveTo(0, -hullWidth / 2);
    hullShape.quadraticCurveTo(hullLength * 0.1, -hullWidth * 0.45, hullLength * 0.3, -hullWidth * 0.4);
    hullShape.lineTo(hullLength * 0.7, -hullWidth * 0.35);
    hullShape.quadraticCurveTo(hullLength * 0.9, -hullWidth * 0.2, hullLength, 0);
    hullShape.quadraticCurveTo(hullLength * 0.9, hullWidth * 0.2, hullLength * 0.7, hullWidth * 0.35);
    hullShape.lineTo(hullLength * 0.3, hullWidth * 0.4);
    hullShape.quadraticCurveTo(hullLength * 0.1, hullWidth * 0.45, 0, hullWidth / 2);
    hullShape.quadraticCurveTo(-hullLength * 0.05, hullWidth * 0.3, -hullLength * 0.1, 0);
    hullShape.quadraticCurveTo(-hullLength * 0.05, -hullWidth * 0.3, 0, -hullWidth / 2);

    const extrudeSettings = {
      steps: 1,
      depth: hullHeight,
      bevelEnabled: true,
      bevelThickness: 0.5,
      bevelSize: 0.3,
      bevelSegments: 2,
    };

    const hullGeom = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    hullGeom.rotateX(Math.PI / 2);
    hullGeom.translate(-hullLength * 0.4, hullHeight / 2, 0);

    const hullMat = new THREE.MeshStandardMaterial({
      color: COLORS.wood,
      roughness: 0.8,
      metalness: 0.1,
    });

    this.hullMesh = new THREE.Mesh(hullGeom, hullMat);
    this.hullMesh.castShadow = true;
    this.hullMesh.receiveShadow = true;
    this.mesh.add(this.hullMesh);

    // Hull stripe decoration
    const stripeGeom = new THREE.BoxGeometry(hullLength * 0.8, 0.3, hullWidth + 0.2);
    const stripeMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark });
    const stripe = new THREE.Mesh(stripeGeom, stripeMat);
    stripe.position.set(0, hullHeight * 0.6, 0);
    this.mesh.add(stripe);
  }

  private buildDeck() {
    const deckLength = this.config.size * 0.8;
    const deckWidth = this.config.size * 0.22;

    const deckGeom = new THREE.BoxGeometry(deckLength, 0.3, deckWidth);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0xA0522D,
      roughness: 0.9,
    });
    const deck = new THREE.Mesh(deckGeom, deckMat);
    deck.position.set(this.config.size * 0.05, this.config.size * 0.16, 0);
    deck.receiveShadow = true;
    this.mesh.add(deck);

    // Railings
    const railHeight = 1.2;
    const railGeom = new THREE.BoxGeometry(deckLength, 0.1, 0.1);
    const railMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark });

    const leftRail = new THREE.Mesh(railGeom, railMat);
    leftRail.position.set(this.config.size * 0.05, this.config.size * 0.16 + railHeight, deckWidth / 2);
    this.mesh.add(leftRail);

    const rightRail = new THREE.Mesh(railGeom, railMat);
    rightRail.position.set(this.config.size * 0.05, this.config.size * 0.16 + railHeight, -deckWidth / 2);
    this.mesh.add(rightRail);
  }

  private buildMasts() {
    const mastCount = this.config.size > 30 ? 3 : this.config.size > 20 ? 2 : 1;
    const mastPositions = mastCount === 3 
      ? [-this.config.size * 0.15, this.config.size * 0.05, this.config.size * 0.25]
      : mastCount === 2
      ? [-this.config.size * 0.1, this.config.size * 0.15]
      : [0];

    mastPositions.forEach((xPos, i) => {
      const mastHeight = this.config.size * (0.8 + i * 0.1);
      const mastGeom = new THREE.CylinderGeometry(0.15, 0.2, mastHeight, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark });
      const mast = new THREE.Mesh(mastGeom, mastMat);
      mast.position.set(xPos, mastHeight / 2 + this.config.size * 0.16, 0);
      mast.castShadow = true;
      this.mesh.add(mast);

      // Yardarms (horizontal beams)
      const yardWidth = this.config.size * 0.3 * (1 - i * 0.1);
      const yardGeom = new THREE.CylinderGeometry(0.08, 0.08, yardWidth, 6);
      const yardMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark });

      const yard1 = new THREE.Mesh(yardGeom, yardMat);
      yard1.rotation.z = Math.PI / 2;
      yard1.position.set(xPos, mastHeight * 0.7, 0);
      this.mesh.add(yard1);

      if (mastCount > 1 || i === 0) {
        const yard2 = new THREE.Mesh(yardGeom, yardMat);
        yard2.rotation.z = Math.PI / 2;
        yard2.position.set(xPos, mastHeight * 0.4, 0);
        this.mesh.add(yard2);
      }

      // Sails
      this.buildSail(xPos, mastHeight * 0.55, yardWidth * 0.8, mastHeight * 0.25);
      if (mastCount > 1 || i === 0) {
        this.buildSail(xPos, mastHeight * 0.25, yardWidth * 0.7, mastHeight * 0.2);
      }
    });
  }

  private buildSail(x: number, y: number, width: number, height: number) {
    const sailGeom = new THREE.PlaneGeometry(width, height, 8, 4);
    const sail = new THREE.Mesh(sailGeom, this.sailMaterial);
    sail.position.set(x, y + this.config.size * 0.16, 0);
    sail.castShadow = true;
    this.mesh.add(sail);
    this.sails.push(sail);
  }

  private buildCannons() {
    const cannonGeom = new THREE.CylinderGeometry(0.1, 0.12, 1.2, 8);
    const cannonMat = new THREE.MeshStandardMaterial({
      color: COLORS.ironDark,
      roughness: 0.4,
      metalness: 0.8,
    });

    const sideOffset = this.config.size * 0.23;
    const spacing = this.config.size / (this.config.cannonsPerSide + 1);

    for (let i = 0; i < this.config.cannonsPerSide; i++) {
      const z = (i + 1) * spacing - this.config.size * 0.4;

      // Left side
      const leftCannon = new THREE.Mesh(cannonGeom, cannonMat);
      leftCannon.rotation.x = Math.PI / 2;
      leftCannon.position.set(z, this.config.size * 0.18, sideOffset + 0.4);
      this.mesh.add(leftCannon);
      this.cannons.push(leftCannon);

      // Right side
      const rightCannon = new THREE.Mesh(cannonGeom, cannonMat);
      rightCannon.rotation.x = Math.PI / 2;
      rightCannon.position.set(z, this.config.size * 0.18, -sideOffset - 0.4);
      this.mesh.add(rightCannon);
      this.cannons.push(rightCannon);
    }
  }

  private buildDetails() {
    // Crow's nest
    const nestGeom = new THREE.CylinderGeometry(0.8, 0.6, 0.8, 6);
    const nestMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark });
    const nest = new THREE.Mesh(nestGeom, nestMat);
    const mastHeight = this.config.size * 0.8;
    nest.position.set(
      this.config.size > 30 ? this.config.size * 0.05 : 0,
      mastHeight * 0.85,
      0
    );
    this.mesh.add(nest);

    // Flag
    const flagGeom = new THREE.PlaneGeometry(1.5, 1, 4, 2);
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0x8B0000,
      side: THREE.DoubleSide,
    });
    const flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(
      this.config.size > 30 ? this.config.size * 0.05 : 0,
      mastHeight + 0.5,
      0
    );
    this.mesh.add(flag);

    // Captain's cabin (rear)
    const cabinGeom = new THREE.BoxGeometry(3, 2.5, this.config.size * 0.15);
    const cabinMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark });
    const cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(-this.config.size * 0.3, this.config.size * 0.18 + 1.25, 0);
    this.mesh.add(cabin);

    // Anchor
    const anchorGeom = new THREE.TorusGeometry(0.4, 0.08, 6, 8);
    const anchorMat = new THREE.MeshStandardMaterial({
      color: COLORS.ironDark,
      metalness: 0.7,
    });
    const anchor = new THREE.Mesh(anchorGeom, anchorMat);
    anchor.position.set(-this.config.size * 0.35, this.config.size * 0.1, 0);
    anchor.rotation.y = Math.PI / 2;
    this.mesh.add(anchor);
  }

  private buildCrewMarkers() {
    // Visual markers for crew positions
    for (let i = 0; i < this.config.crewCapacity; i++) {
      const markerGeom = new THREE.SphereGeometry(0.3, 6, 4);
      const marker = new THREE.Mesh(markerGeom, this.crewRoleMaterials.get('idle')!);
      const angle = (i / this.config.crewCapacity) * Math.PI * 2;
      const radius = this.config.size * 0.08;
      marker.position.set(
        Math.cos(angle) * this.config.size * 0.1,
        this.config.size * 0.2,
        Math.sin(angle) * radius
      );
      marker.visible = false; // Hidden by default, shown in crew view
      this.mesh.add(marker);
      this.crewMarkers.push(marker);
    }
  }

  public updateSails(_windAngle: number, sailLevel: number) {
    // Animate sails based on wind
    const time = performance.now() * 0.001;
    this.sails.forEach((sail, i) => {
      // Subtle billowing animation
      sail.rotation.y = Math.sin(time + i) * 0.1 * sailLevel;
      sail.rotation.z = Math.sin(time * 0.7 + i * 0.5) * 0.05 * sailLevel;
      // Scale based on sail level
      sail.scale.set(1, sailLevel, 1);
    });
  }

  public updateCrewVisuals(crewAssignments: CrewRole[]) {
    crewAssignments.forEach((role, i) => {
      if (i < this.crewMarkers.length) {
        const mat = this.crewRoleMaterials.get(role);
        if (mat) {
          (this.crewMarkers[i].material as THREE.MeshBasicMaterial).color.copy(mat.color);
        }
      }
    });
  }

  public showCrewMarkers(show: boolean) {
    this.crewMarkers.forEach(m => (m.visible = show));
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
