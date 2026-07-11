import * as THREE from 'three';

export interface ShipStation {
  id: string;
  type: 'helm' | 'cannon_left' | 'cannon_right' | 'repair' | 'crow_nest';
  position: THREE.Vector3;
  label: string;
  interactable: boolean;
}

export class ShipInterior {
  public deckMesh: THREE.Mesh;
  public railings: THREE.Group;
  public stations: ShipStation[] = [];
  public belowDeck: THREE.Mesh;
  public stairs: THREE.Group;
  private deckWidth: number = 10;
  private deckLength: number = 36;

  constructor(scene: THREE.Group) {
    this.railings = new THREE.Group();
    this.stairs = new THREE.Group();
    this.deckMesh = this.createDeck();
    this.belowDeck = this.createBelowDeck();
    this.createRailings();
    this.createPlankDetails();
    this.createMasts();
    this.createStairs();
    this.setupStations();

    scene.add(this.deckMesh);
    scene.add(this.belowDeck);
    scene.add(this.railings);
    scene.add(this.stairs);
  }

  private createDeck(): THREE.Mesh {
    // Main deck with plank texture
    const geom = new THREE.BoxGeometry(this.deckLength, 0.2, this.deckWidth);
    
    // Create plank pattern using vertex colors
    const colors = new Float32Array(geom.attributes.position.count * 3);
    const posAttr = geom.attributes.position;
    
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Alternate plank colors
      const plankIndex = Math.floor((x + this.deckLength / 2) / 1.5);
      const isDarkPlank = plankIndex % 2 === 0;
      const baseR = isDarkPlank ? 0.35 : 0.42;
      const baseG = isDarkPlank ? 0.22 : 0.28;
      const baseB = isDarkPlank ? 0.1 : 0.12;
      // Add slight variation
      const variation = (Math.sin(x * 3) * Math.cos(z * 5)) * 0.03;
      colors[i * 3] = baseR + variation;
      colors[i * 3 + 1] = baseG + variation;
      colors[i * 3 + 2] = baseB + variation;
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
    });

    const deck = new THREE.Mesh(geom, mat);
    deck.position.y = 0;
    deck.receiveShadow = true;
    return deck;
  }

  private createBelowDeck(): THREE.Mesh {
    const geom = new THREE.BoxGeometry(this.deckLength - 2, 0.2, this.deckWidth - 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.95,
    });
    const deck = new THREE.Mesh(geom, mat);
    deck.position.y = -2.5;
    deck.receiveShadow = true;
    return deck;
  }

  private createRailings() {
    const postHeight = 1.2;
    const postGeom = new THREE.CylinderGeometry(0.06, 0.08, postHeight, 6);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const railGeom = new THREE.BoxGeometry(0.1, 0.08, 0.08);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });

    // Side railings
    [-1, 1].forEach(side => {
      const z = (this.deckWidth / 2 - 0.3) * side;
      for (let x = -this.deckLength / 2 + 1; x < this.deckLength / 2; x += 2.5) {
        // Post
        const post = new THREE.Mesh(postGeom, postMat);
        post.position.set(x, postHeight / 2, z);
        this.railings.add(post);

        // Horizontal rail
        if (x + 2.5 < this.deckLength / 2) {
          const rail = new THREE.Mesh(railGeom, railMat);
          rail.position.set(x + 1.25, postHeight - 0.1, z);
          rail.scale.set(25, 1, 1);
          this.railings.add(rail);
        }
      }
    });

    // Front railing (curved)
    for (let angle = -Math.PI / 4; angle <= Math.PI / 4; angle += 0.3) {
      const x = Math.sin(angle) * (this.deckWidth / 2 - 0.3);
      const z = Math.cos(angle) * 3 - this.deckLength / 2 + 2;
      const post = new THREE.Mesh(postGeom, postMat);
      post.position.set(x, postHeight / 2, z);
      this.railings.add(post);
    }
  }

  private createPlankDetails() {
    // Nail heads scattered on planks
    const nailGeom = new THREE.SphereGeometry(0.02, 4, 4);
    const nailMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });

    for (let i = 0; i < 60; i++) {
      const nail = new THREE.Mesh(nailGeom, nailMat);
      nail.position.set(
        (Math.random() - 0.5) * (this.deckLength - 2),
        0.11,
        (Math.random() - 0.5) * (this.deckWidth - 2)
      );
      nail.rotation.x = Math.random() * 0.2;
      this.railings.add(nail);
    }
  }

  private createMasts() {
    // Main mast
    const mastPositions = [
      { x: 0, y: 12, height: 24 },
      { x: -6, y: 10, height: 20 },
      { x: 8, y: 8, height: 16 },
    ];

    mastPositions.forEach((m, i) => {
      const mastGeom = new THREE.CylinderGeometry(0.12 + i * 0.02, 0.18 + i * 0.02, m.height, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
      const mast = new THREE.Mesh(mastGeom, mastMat);
      mast.position.set(m.x, m.height / 2, 0);
      mast.castShadow = true;
      this.railings.add(mast);

      // Yardarms
      const yardWidth = 8 - i;
      const yardGeom = new THREE.CylinderGeometry(0.06, 0.08, yardWidth, 6);
      const yardMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });

      [m.height * 0.7, m.height * 0.4].forEach(yH => {
        const yard = new THREE.Mesh(yardGeom, yardMat);
        yard.rotation.z = Math.PI / 2;
        yard.position.set(m.x, yH, 0);
        this.railings.add(yard);

        // Sail
        const sailGeom = new THREE.PlaneGeometry(yardWidth * 0.85, m.height * 0.2, 4, 4);
        const sailMat = new THREE.MeshStandardMaterial({
          color: 0xf5f5dc,
          side: THREE.DoubleSide,
          roughness: 0.95,
        });
        const sail = new THREE.Mesh(sailGeom, sailMat);
        sail.position.set(m.x, yH + m.height * 0.08, 0);
        sail.castShadow = true;
        this.railings.add(sail);
      });
    });
  }

  private createStairs() {
    // Stairs to below deck (near main mast)
    const stairCount = 6;
    const stairGeom = new THREE.BoxGeometry(1.5, 0.08, 0.4);
    const stairMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });

    for (let i = 0; i < stairCount; i++) {
      const stair = new THREE.Mesh(stairGeom, stairMat);
      stair.position.set(3, -i * 0.4, 2 + i * 0.35);
      this.stairs.add(stair);
    }

    // Stair railing
    const railGeom = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 4);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    
    [-1, 1].forEach(side => {
      const rail = new THREE.Mesh(railGeom, railMat);
      rail.position.set(3 + side * 0.8, -0.5, 3);
      rail.rotation.z = side * -0.3;
      rail.rotation.x = -0.5;
      this.stairs.add(rail);
    });
  }

  private setupStations() {
    // Helm (rear of ship)
    this.stations.push({
      id: 'helm',
      type: 'helm',
      position: new THREE.Vector3(0, 0.3, this.deckLength / 2 - 3),
      label: 'Helm - Steer the Ship',
      interactable: true,
    });

    // Left cannons
    for (let i = 0; i < 4; i++) {
      this.stations.push({
        id: `cannon_left_${i}`,
        type: 'cannon_left',
        position: new THREE.Vector3(-4.5, 0.4, -8 + i * 5),
        label: 'Fire Port Cannons',
        interactable: true,
      });
    }

    // Right cannons
    for (let i = 0; i < 4; i++) {
      this.stations.push({
        id: `cannon_right_${i}`,
        type: 'cannon_right',
        position: new THREE.Vector3(4.5, 0.4, -8 + i * 5),
        label: 'Fire Starboard Cannons',
        interactable: true,
      });
    }

    // Crow's nest
    this.stations.push({
      id: 'crow_nest',
      type: 'crow_nest',
      position: new THREE.Vector3(0, 16, 0),
      label: 'Crow\'s Nest - Scout',
      interactable: true,
    });
  }

  public getDeckHeight(): number {
    return 0.1; // Top of deck
  }

  public getBelowDeckHeight(): number {
    return -2.4;
  }

  public getNearestStation(pos: THREE.Vector3, maxDist: number = 2): ShipStation | null {
    let nearest: ShipStation | null = null;
    let nearDist = maxDist;

    for (const station of this.stations) {
      const d = pos.distanceTo(station.position);
      if (d < nearDist) {
        nearDist = d;
        nearest = station;
      }
    }

    return nearest;
  }

  public createCannonModels(group: THREE.Group) {
    // Add cannon meshes at station positions
    this.stations.filter(s => s.type.startsWith('cannon')).forEach(station => {
      const cannonGeom = new THREE.CylinderGeometry(0.12, 0.14, 1.8, 8);
      const cannonMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.4 });
      const cannon = new THREE.Mesh(cannonGeom, cannonMat);

      const isLeft = station.type === 'cannon_left';
      cannon.rotation.x = Math.PI / 2;
      cannon.rotation.z = isLeft ? -Math.PI / 2 : Math.PI / 2;
      cannon.position.copy(station.position);
      cannon.castShadow = true;
      group.add(cannon);

      // Cannon base
      const baseGeom = new THREE.BoxGeometry(0.6, 0.3, 0.8);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
      const base = new THREE.Mesh(baseGeom, baseMat);
      base.position.set(station.position.x, 0.15, station.position.z);
      group.add(base);
    });

    // Helm wheel
    const helmStation = this.stations.find(s => s.type === 'helm');
    if (helmStation) {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.copy(helmStation.position);

      // Wheel rim
      const rimGeom = new THREE.TorusGeometry(0.6, 0.06, 8, 12);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 });
      const rim = new THREE.Mesh(rimGeom, rimMat);
      wheelGroup.add(rim);

      // Spokes
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const spokeGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 4);
        const spoke = new THREE.Mesh(spokeGeom, rimMat);
        spoke.rotation.z = Math.PI / 2;
        spoke.rotation.y = angle;
        wheelGroup.add(spoke);
      }

      // Stand
      const standGeom = new THREE.CylinderGeometry(0.08, 0.1, 1.2, 6);
      const standMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
      const stand = new THREE.Mesh(standGeom, standMat);
      stand.position.y = -0.6;
      wheelGroup.add(stand);

      group.add(wheelGroup);
    }
  }

  public getBounds() {
    return {
      halfWidth: this.deckWidth / 2 - 0.5,
      halfLength: this.deckLength / 2 - 0.5,
    };
  }
}
