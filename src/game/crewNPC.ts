import * as THREE from 'three';
import type { ShipStation } from './shipInterior';

interface CrewState {
  id: string;
  name: string;
  role: 'idle' | 'cannons' | 'repairs' | 'sails';
  assignedStation: string | null;
  position: THREE.Vector3;
  targetPos: THREE.Vector3 | null;
  animationTime: number;
  state: 'walking' | 'working' | 'idle';
  workAnim: number;
}

const CREW_NAMES = [
  'Jack Sparrow', 'Anne Bonny', 'Blackbeard', 'Calico Jack',
  'Mary Read', 'Henry Morgan', 'Bartholomew', 'Ned Low',
  'Old Salt', 'One-Eye', 'Peg Leg Pete', 'Salty Sam',
  'Crusty Jim', 'Barnacle Bill', 'Scarface', 'Mad Dog',
];

export class CrewNPCSystem {
  private crew: Map<string, CrewState> = new Map();
  private meshes: Map<string, THREE.Group> = new Map();
  private scene: THREE.Group;
  private stations: ShipStation[];
  private hatMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Group, stations: ShipStation[]) {
    this.scene = scene;
    this.stations = stations;
    this.hatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });

    // Spawn 8 crew members
    for (let i = 0; i < 8; i++) {
      this.spawnCrewMember(i);
    }
  }

  private spawnCrewMember(index: number) {
    const id = `crew_${index}`;
    const name = CREW_NAMES[index % CREW_NAMES.length];
    const role = index < 2 ? 'cannons' : index < 4 ? 'repairs' : index < 6 ? 'sails' : 'idle';

    // Find station for role
    let station: ShipStation | undefined;
    if (role === 'cannons') {
      const cannons = this.stations.filter(s => s.type.startsWith('cannon'));
      station = cannons[index % cannons.length];
    } else if (role === 'repairs') {
      station = this.stations.find(s => s.type === 'repair') || this.stations[0];
    } else if (role === 'sails') {
      station = this.stations.find(s => s.type === 'helm');
    }

    const startPos = station
      ? new THREE.Vector3(station.position.x + (Math.random() - 0.5) * 2, 0.3, station.position.z + (Math.random() - 0.5) * 2)
      : new THREE.Vector3((Math.random() - 0.5) * 6, 0.3, (Math.random() - 0.5) * 20);

    const crew: CrewState = {
      id,
      name,
      role,
      assignedStation: station?.id || null,
      position: startPos.clone(),
      targetPos: null,
      animationTime: Math.random() * 100,
      state: 'idle',
      workAnim: 0,
    };

    const mesh = this.createCrewMesh(name, role);
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    this.crew.set(id, crew);
    this.meshes.set(id, mesh);
  }

  private createCrewMesh(_name: string, role: string): THREE.Group {
    const group = new THREE.Group();

    // Body (slightly different colors per role)
    const roleColors: Record<string, number> = {
      cannons: 0x8B0000,
      repairs: 0x2E5C1E,
      sails: 0x1E3C5C,
      idle: 0x5C3A1E,
    };
    const color = roleColors[role] || 0x5C3A1E;
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });

    const bodyGeom = new THREE.CapsuleGeometry(0.3, 0.7, 4, 8);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.65;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeom = new THREE.SphereGeometry(0.22, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.7 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.35;
    group.add(head);

    // Bandana/hat
    const bandanaGeom = new THREE.TorusGeometry(0.24, 0.06, 4, 8);
    const bandana = new THREE.Mesh(bandanaGeom, this.hatMat);
    bandana.position.y = 1.45;
    bandana.rotation.x = Math.PI / 2;
    group.add(bandana);

    // Belt
    const beltGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 8);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
    const belt = new THREE.Mesh(beltGeom, beltMat);
    belt.position.y = 0.45;
    group.add(belt);

    // Tools based on role
    if (role === 'repairs') {
      // Hammer
      const handleGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
      const handle = new THREE.Mesh(handleGeom, handleMat);
      handle.position.set(0.35, 0.6, 0.2);
      handle.rotation.z = -0.5;
      group.add(handle);

      const headGeom = new THREE.BoxGeometry(0.12, 0.06, 0.08);
      const headMat = new THREE.MeshStandardMaterial({ color: 0x555, metalness: 0.6 });
      const hammerHead = new THREE.Mesh(headGeom, headMat);
      hammerHead.position.set(0.42, 0.75, 0.2);
      group.add(hammerHead);
    } else if (role === 'cannons') {
      // Powder bag
      const bagGeom = new THREE.SphereGeometry(0.1, 6, 6);
      const bagMat = new THREE.MeshStandardMaterial({ color: 0xC4A35A });
      const bag = new THREE.Mesh(bagGeom, bagMat);
      bag.position.set(0.35, 0.5, 0.15);
      group.add(bag);
    }

    return group;
  }

  public update(delta: number, _time: number, shipPos: THREE.Vector3, shipRot: number) {
    this.crew.forEach((crew) => {
      const mesh = this.meshes.get(crew.id);
      if (!mesh) return;

      crew.animationTime += delta;

      // AI behavior
      if (crew.state === 'idle') {
        // Pick a random spot to walk to
        if (Math.random() < delta * 0.3) {
          const station = this.stations.find(s => s.id === crew.assignedStation);
          if (station) {
            crew.targetPos = new THREE.Vector3(
              station.position.x + (Math.random() - 0.5) * 3,
              0.3,
              station.position.z + (Math.random() - 0.5) * 3
            );
          } else {
            crew.targetPos = new THREE.Vector3(
              (Math.random() - 0.5) * 8,
              0.3,
              (Math.random() - 0.5) * 30
            );
          }
          crew.state = 'walking';
        }
      }

      if (crew.state === 'walking' && crew.targetPos) {
        const dir = new THREE.Vector3().subVectors(crew.targetPos, crew.position);
        const dist = dir.length();

        if (dist < 0.3) {
          crew.state = 'working';
          crew.targetPos = null;
          crew.workAnim = 0;
        } else {
          dir.normalize();
          const speed = 1.5;
          crew.position.addScaledVector(dir, speed * delta);

          // Face direction
          mesh.rotation.y = Math.atan2(dir.x, dir.z);

          // Walk bob
          mesh.position.y = crew.position.y + Math.abs(Math.sin(crew.animationTime * 8)) * 0.08;
        }
      }

      if (crew.state === 'working') {
        crew.workAnim += delta;
        mesh.position.y = crew.position.y;

        // Role-specific work animations
        if (crew.role === 'repairs') {
          // Hammering motion
          const hammerCycle = Math.sin(crew.workAnim * 6);
          mesh.rotation.z = hammerCycle * 0.15;
          mesh.position.y = crew.position.y + Math.max(0, hammerCycle) * 0.05;
        } else if (crew.role === 'cannons') {
          // Loading motion
          mesh.rotation.x = Math.sin(crew.workAnim * 3) * 0.1;
        } else if (crew.role === 'sails') {
          // Adjusting ropes
          mesh.rotation.y += Math.sin(crew.workAnim * 2) * 0.3 * delta;
        } else {
          // Idle sway
          mesh.rotation.z = Math.sin(crew.workAnim * 1.5) * 0.05;
        }

        // Go back to idle after working
        if (Math.random() < delta * 0.1) {
          crew.state = 'idle';
        }
      }

      // Update world position (relative to ship)
      mesh.position.x = shipPos.x + crew.position.x * Math.cos(shipRot) - crew.position.z * Math.sin(shipRot);
      mesh.position.z = shipPos.z + crew.position.x * Math.sin(shipRot) + crew.position.z * Math.cos(shipRot);

      // Sync local position
      crew.position.x = mesh.position.x - shipPos.x;
      crew.position.z = mesh.position.z - shipPos.z;
    });
  }

  public getCrew(): CrewState[] {
    return Array.from(this.crew.values());
  }

  public getCrewCount(): number {
    return this.crew.size;
  }

  public dispose() {
    this.meshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.meshes.clear();
    this.crew.clear();
  }
}
