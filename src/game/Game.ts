import * as THREE from 'three';
import { GameRenderer } from './renderer';
import { Ocean } from './ocean';
import { Ship } from './ship';
import { PlayerCharacter } from './character';
import { ShipInterior } from './shipInterior';
import { CrewNPCSystem } from './crewNPC';
import { DamageSystem } from './damageSystem';
import { InputHandler } from './input';
import { WorldGenerator } from './world';
import { CannonballSystem } from './cannonball';
import { EnemyManager } from './enemy';
import { SHIP_CONFIGS, WIND, WORLD } from './constants';
import type { ShipState, CrewRole, GameState, GameScreen, EnemyShip } from '@/types/game';

export class Game {
  private renderer: GameRenderer;
  private ocean: Ocean;
  private playerShipModel: Ship | null = null;
  private playerCharacter: PlayerCharacter | null = null;
  private shipInterior: ShipInterior | null = null;
  private crewSystem: CrewNPCSystem | null = null;
  private damageSystem: DamageSystem | null = null;
  private input: InputHandler;
  private world: WorldGenerator;
  private cannonballs: CannonballSystem;
  private enemies: EnemyManager;

  private state: GameState;
  private isRunning = false;
  private damageVignette = 0;
  private screenShake = 0;
  private goldPopup: { amount: number; timer: number } | null = null;
  private onStateChange: ((state: GameState) => void) | null = null;
  private animFrameId: number = 0;
  private menuCameraAngle = 0;
  private controllingShip = false;
  private nearStation: { id: string; label: string } | null = null;
  private shipGroup: THREE.Group;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new GameRenderer(canvas);
    this.ocean = new Ocean(this.renderer.scene);
    this.input = new InputHandler();
    this.world = new WorldGenerator(this.renderer.scene);
    this.cannonballs = new CannonballSystem(this.renderer.scene);
    this.cannonballs.setOnHitCallback((_id, pos) => {
      this.cannonballs.createSplash(pos);
    });
    this.enemies = new EnemyManager(this.renderer.scene);
    this.enemies.setOnDestroyed((_enemy) => {
      this.state.score += 500;
      this.state.shipsSunk += 1;
    });

    this.shipGroup = new THREE.Group();
    this.renderer.scene.add(this.shipGroup);

    this.spawnEnemies();
    this.state = this.createInitialState();
    this.setupInput();
    this.buildShipWorld();
  }

  private createInitialState(): GameState {
    return {
      screen: 'menu',
      playerShip: this.createDefaultShipState(),
      wind: { direction: Math.PI / 4, speed: WIND.baseSpeed },
      renown: 0,
      score: 0,
      selectedShipType: 'sloop',
      isInCombat: false,
      damageTaken: 0,
      shipsSunk: 0,
    };
  }

  private createDefaultShipState(): ShipState {
    const config = SHIP_CONFIGS['sloop'];
    return {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      hull: config.hull,
      maxHull: config.hull,
      speed: 0,
      heading: 0,
      sailLevel: 0.5,
      cannonCooldown: 0,
      crew: this.generateCrew(config.crewCapacity),
      gold: 100,
      cannonballs: 50,
      repairs: 10,
    };
  }

  private generateCrew(count: number) {
    const names = ['Jack', 'Anne', 'Blackbeard', 'Calico', 'Morgan', 'Mary', 'Henry', 'Bartholomew'];
    return Array.from({ length: count }, (_, i) => ({
      id: `crew_${i}`,
      name: names[i % names.length],
      role: 'idle' as CrewRole,
      skill: 0.5 + Math.random() * 0.5,
    }));
  }

  private spawnEnemies() {
    const types: EnemyShip['type'][] = ['british_patrol', 'skeleton_galleon', 'merchant'];
    for (let i = 0; i < WORLD.enemyCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 600;
      const pos = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
      this.enemies.spawnEnemy(types[i % types.length], pos);
    }
  }

  private buildShipWorld() {
    // Build the explorable ship
    this.playerShipModel = new Ship(SHIP_CONFIGS['sloop']);
    this.shipGroup.add(this.playerShipModel.mesh);

    // Ship interior with walkable deck
    this.shipInterior = new ShipInterior(this.playerShipModel.mesh);

    // Add cannon models and helm wheel
    this.shipInterior.createCannonModels(this.playerShipModel.mesh);

    // Player character
    this.playerCharacter = new PlayerCharacter();
    this.renderer.scene.add(this.playerCharacter.mesh);

    // Start at helm position
    const helmStation = this.shipInterior.stations.find(s => s.type === 'helm');
    if (helmStation) {
      this.playerCharacter.setPosition(helmStation.position.clone());
    }

    // Crew NPCs
    this.crewSystem = new CrewNPCSystem(this.playerShipModel.mesh, this.shipInterior.stations);

    // Damage system
    this.damageSystem = new DamageSystem(this.playerShipModel.mesh);
  }

  private setupInput() {
    this.input.onKey('KeyQ', () => this.fireCannons('left'));
    this.input.onKey('KeyE', () => this.fireCannons('right'));
    this.input.onKey('KeyF', () => this.tryInteract());
  }

  private startRenderLoop() {
    const loop = () => {
      this.animFrameId = requestAnimationFrame(loop);
      const delta = this.renderer.getDelta();
      const time = this.renderer.getElapsed();

      this.ocean.update(time);

      if (this.playerShipModel) {
        this.playerShipModel.updateSails(this.state.wind.direction, this.state.playerShip.sailLevel);
      }

      if (this.crewSystem && this.playerShipModel) {
        const shipPos = this.playerShipModel.mesh.position;
        this.crewSystem.update(delta, time, shipPos, this.state.playerShip.heading);
      }

      if (this.damageSystem) {
        this.damageSystem.update(delta, time);
      }

      if (this.isRunning && this.playerCharacter && this.shipInterior) {
        this.updateCharacterGameplay(delta, time);
      }

      if (this.isRunning) {
        this.cannonballs.update(delta, 0);
        const playerPos = new THREE.Vector3(
          this.state.playerShip.position.x,
          this.state.playerShip.position.y,
          this.state.playerShip.position.z
        );
        this.enemies.update(delta, playerPos, time);

        if (this.damageVignette > 0) this.damageVignette = Math.max(0, this.damageVignette - delta);
        if (this.goldPopup) {
          this.goldPopup.timer -= delta;
          if (this.goldPopup.timer <= 0) this.goldPopup = null;
        }
      } else {
        this.menuCameraAngle += delta * 0.1;
        const camX = Math.sin(this.menuCameraAngle) * 60;
        const camZ = Math.cos(this.menuCameraAngle) * 60;
        const shipPos = this.state.playerShip.position;
        const waveHeight = this.ocean.getWaveHeight(shipPos.x, shipPos.z, time);
        this.renderer.camera.position.lerp(new THREE.Vector3(shipPos.x + camX, 25, shipPos.z + camZ), delta * 2);
        this.renderer.camera.lookAt(shipPos.x, waveHeight + 5, shipPos.z);

        if (this.playerShipModel) {
          this.playerShipModel.mesh.position.set(shipPos.x, waveHeight, shipPos.z);
          this.playerShipModel.mesh.rotation.x = Math.sin(time * 0.8) * 0.03;
          this.playerShipModel.mesh.rotation.z = Math.cos(time * 0.6) * 0.02;
        }
      }

      this.renderer.setTimeOfDay((time * 0.008) % 1);
      this.renderer.render();
    };
    loop();
  }

  private updateCharacterGameplay(delta: number, time: number) {
    if (!this.playerCharacter || !this.playerShipModel || !this.shipInterior) return;

    const ship = this.state.playerShip;
    const config = SHIP_CONFIGS[this.state.selectedShipType];

    // Character movement
    let moveX = 0;
    let moveZ = 0;
    if (this.input.isLeft()) moveX = -1;
    if (this.input.isRight()) moveX = 1;
    if (this.input.isForward()) moveZ = -1;
    if (this.input.isBackward()) moveZ = 1;

    // Mobile joystick overrides
    const mobileJoy = this.input.getMobileJoystick();
    if (mobileJoy) {
      moveX = mobileJoy.x;
      moveZ = mobileJoy.y;
    }

    // Camera angle for relative movement
    const camAngle = this.renderer.camera.rotation.y;
    const deckHeight = this.shipInterior.getDeckHeight();

    this.playerCharacter.update(delta, moveX, moveZ, camAngle, ship.heading, deckHeight);

    // Check nearby station
    const charPos = this.playerCharacter.getPosition();
    const nearest = this.shipInterior.getNearestStation(charPos, 2.5);
    if (nearest && nearest.interactable) {
      this.nearStation = { id: nearest.id, label: nearest.label };
    } else {
      this.nearStation = null;
    }

    // Camera follows character
    const charWorldPos = this.playerCharacter.mesh.position.clone();
    const camTarget = charWorldPos.clone().add(new THREE.Vector3(0, 3, 0));
    const camOffset = new THREE.Vector3(
      Math.sin(camAngle) * 8,
      5,
      Math.cos(camAngle) * 8
    );

    if (this.screenShake > 0) {
      camOffset.x += (Math.random() - 0.5) * this.screenShake * 3;
      camOffset.y += (Math.random() - 0.5) * this.screenShake * 2;
      this.screenShake = Math.max(0, this.screenShake - delta * 3);
    }

    this.renderer.camera.position.lerp(charWorldPos.clone().add(camOffset), delta * 5);
    this.renderer.camera.lookAt(camTarget);

    // Ship physics (only when controlling from helm)
    if (this.controllingShip) {
      this.updateShipPhysics(delta, time);
    } else {
      // Ship drifts gently when not controlled
      ship.speed *= 0.995;
    }

    // Cannon cooldown
    if (ship.cannonCooldown > 0) ship.cannonCooldown -= delta;

    // Repair crew
    const repairCrew = ship.crew.filter(c => c.role === 'repairs').length;
    if (repairCrew > 0 && ship.hull < ship.maxHull) {
      ship.hull = Math.min(ship.maxHull, ship.hull + (repairCrew / ship.crew.length) * 15 * delta);
    }

    // Update ship visual position
    const waveHeight = this.ocean.getWaveHeight(ship.position.x, ship.position.z, time);
    ship.position.y = waveHeight;
    ship.rotation.x = Math.sin(time * 1.5 + ship.position.x) * 0.08;
    ship.rotation.z = Math.cos(time * 1.2 + ship.position.z) * 0.05;
    ship.rotation.y = ship.heading;

    this.playerShipModel.mesh.position.set(ship.position.x, ship.position.y, ship.position.z);
    this.playerShipModel.mesh.rotation.set(ship.rotation.x, ship.rotation.y, ship.rotation.z);

    // Enemy damage check
    const playerPos = new THREE.Vector3(ship.position.x, ship.position.y, ship.position.z);
    const hit = this.enemies.checkPlayerHit(playerPos, config.size * 0.3);
    if (hit) {
      ship.hull -= hit.damage;
      this.state.damageTaken += hit.damage;
      this.damageVignette = 1.0;
      this.screenShake = 0.5;

      // Spawn hull damage
      if (this.damageSystem) {
        const hitPos = new THREE.Vector3(
          ship.position.x + (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 4,
          ship.position.z + (Math.random() - 0.5) * 8
        );
        const normal = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        this.damageSystem.addDamage(hitPos, normal);
      }

      if (ship.hull <= 0) this.shipSunk();
      this.onStateChange?.({ ...this.state });
    }

    // Loot collection
    const nearbyLoot = this.world.getNearbyLoot(playerPos, 10);
    if (nearbyLoot) {
      const loot = this.world.collectLoot(nearbyLoot.id);
      if (loot) {
        ship.gold += loot.contents.gold;
        ship.cannonballs += loot.contents.cannonballs;
        ship.repairs += loot.contents.repairs;
        this.goldPopup = { amount: loot.contents.gold, timer: 2 };
        this.onStateChange?.({ ...this.state });
      }
    }

    // Combat check
    this.state.isInCombat = this.enemies.getEnemiesInRange(playerPos, 100).length > 0;

    // Sail controls from mobile
    const sailDelta = this.input.getMobileSailDelta();
    if (sailDelta !== 0) {
      ship.sailLevel = Math.max(0, Math.min(1, ship.sailLevel + sailDelta * delta * 2));
    }
  }

  private updateShipPhysics(delta: number, _time: number) {
    const ship = this.state.playerShip;
    const config = SHIP_CONFIGS[this.state.selectedShipType];
    const wind = this.state.wind;

    const windDiff = Math.abs(wind.direction - ship.heading);
    const windEffect = Math.cos(windDiff);

    let targetSpeed = 0;
    if (this.input.isForward()) {
      targetSpeed = config.maxSpeed * ship.sailLevel;
      if (windEffect > 0.7) targetSpeed *= WIND.withWindBonus;
      else if (windEffect < -0.5) targetSpeed *= WIND.againstWindPenalty;
    } else if (this.input.isBackward()) {
      targetSpeed = -config.maxSpeed * 0.3;
    }

    ship.speed = THREE.MathUtils.lerp(ship.speed, targetSpeed, delta * 2);

    let turnInput = 0;
    if (this.input.isLeft()) turnInput = 1;
    if (this.input.isRight()) turnInput = -1;

    const turnSpeed = config.turnRate * (Math.abs(ship.speed) / config.maxSpeed + 0.2) * delta;
    ship.heading += turnInput * turnSpeed;

    ship.position.x += Math.sin(ship.heading) * ship.speed * delta;
    ship.position.z += Math.cos(ship.heading) * ship.speed * delta;
  }

  private tryInteract() {
    if (!this.nearStation) return;

    const station = this.shipInterior?.stations.find(s => s.id === this.nearStation?.id);
    if (!station) return;

    switch (station.type) {
      case 'helm':
        this.controllingShip = !this.controllingShip;
        break;
      case 'cannon_left':
        this.fireCannons('left');
        break;
      case 'cannon_right':
        this.fireCannons('right');
        break;
    }
  }

  public fireCannons(side: 'left' | 'right') {
    if (!this.isRunning) return;
    const ship = this.state.playerShip;
    if (ship.cannonCooldown > 0 || ship.cannonballs <= 0) return;

    const config = SHIP_CONFIGS[this.state.selectedShipType];
    const repairCrew = ship.crew.filter(c => c.role === 'repairs').length;
    const reloadMultiplier = 1 - (repairCrew / ship.crew.length) * 0.3;

    ship.cannonCooldown = config.cannonReload * reloadMultiplier;
    ship.cannonballs -= config.cannonsPerSide;

    const pos = new THREE.Vector3(ship.position.x, ship.position.y, ship.position.z);
    const dir = ship.heading + (side === 'left' ? -Math.PI / 2 : Math.PI / 2);

    for (let i = 0; i < config.cannonsPerSide; i++) {
      setTimeout(() => {
        this.cannonballs.fire(pos, dir, 15 + Math.random() * 5, side, 'player');
        this.screenShake = 0.3;
      }, i * 100);
    }

    this.onStateChange?.({ ...this.state });
  }

  private shipSunk() {
    this.state.playerShip.hull = this.state.playerShip.maxHull * 0.5;
    this.state.playerShip.position = { x: 0, y: 0, z: 0 };
    this.state.screen = 'harbor';
    this.isRunning = false;
    this.controllingShip = false;
    this.onStateChange?.({ ...this.state });
  }

  // === Public API ===

  public setOnStateChange(cb: (state: GameState) => void) {
    this.onStateChange = cb;
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getNearStation() {
    return this.nearStation;
  }

  public isControllingShip() {
    return this.controllingShip;
  }

  public selectShip(shipType: string) {
    this.state.selectedShipType = shipType;
    const config = SHIP_CONFIGS[shipType];
    this.state.playerShip.maxHull = config.hull;
    this.state.playerShip.hull = config.hull;
    this.state.playerShip.crew = this.generateCrew(config.crewCapacity);
  }

  public setScreen(screen: GameScreen) {
    this.state.screen = screen;
    if (screen === 'playing') {
      this.isRunning = true;
      if (!this.animFrameId) this.startRenderLoop();
    } else if (screen === 'menu' || screen === 'harbor') {
      this.isRunning = false;
      this.controllingShip = false;
    }
    this.onStateChange?.({ ...this.state });
  }

  public setCrewRole(crewId: string, role: CrewRole) {
    const member = this.state.playerShip.crew.find(c => c.id === crewId);
    if (member) {
      member.role = role;
      this.onStateChange?.({ ...this.state });
    }
  }

  public getInput() {
    return this.input;
  }

  public getDamageVignette(): number {
    return this.damageVignette;
  }

  public getGoldPopup() {
    return this.goldPopup;
  }

  public getActiveDamageCount(): number {
    return this.damageSystem?.getActiveDamages().length || 0;
  }

  public getFloodingLevel(): number {
    return this.damageSystem?.getFloodingLevel() || 0;
  }

  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
    this.input.dispose();
    this.ocean.dispose();
    this.playerShipModel?.dispose();
    this.playerCharacter?.dispose();
    this.world.dispose();
    this.cannonballs.dispose();
    this.enemies.dispose();
    this.crewSystem?.dispose();
    this.damageSystem?.dispose();
    this.renderer.dispose();
  }
}
