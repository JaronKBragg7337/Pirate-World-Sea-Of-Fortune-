import * as THREE from 'three';
import { GameRenderer } from './renderer';
import { Ocean } from './ocean';
import { Ship } from './ship';
import { CameraController } from './camera';
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
  private camera: CameraController;
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

  constructor(canvas: HTMLCanvasElement) {
    // Initialize renderer
    this.renderer = new GameRenderer(canvas);

    // Initialize ocean
    this.ocean = new Ocean(this.renderer.scene);

    // Initialize camera
    this.camera = new CameraController(this.renderer.camera);

    // Initialize input
    this.input = new InputHandler();

    // Initialize world
    this.world = new WorldGenerator(this.renderer.scene);

    // Initialize cannonball system
    this.cannonballs = new CannonballSystem(this.renderer.scene);
    this.cannonballs.setOnHitCallback((_id, pos) => {
      this.cannonballs.createSplash(pos);
    });

    // Initialize enemies
    this.enemies = new EnemyManager(this.renderer.scene);
    this.enemies.setOnDestroyed((_enemy) => {
      this.state.score += 500;
      this.state.shipsSunk += 1;
    });

    // Spawn initial enemies
    this.spawnEnemies();

    // Initial state
    this.state = this.createInitialState();

    // Setup input handlers
    this.setupInput();

    // Create default ship for menu view
    this.selectShip('sloop');

    // Start the render loop immediately for menu backdrop
    this.startRenderLoop();
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
      const pos = new THREE.Vector3(
        Math.cos(angle) * dist,
        0,
        Math.sin(angle) * dist
      );
      this.enemies.spawnEnemy(types[i % types.length], pos);
    }
  }

  private setupInput() {
    this.input.onKey('KeyQ', () => this.fireCannons('left'));
    this.input.onKey('KeyE', () => this.fireCannons('right'));
  }

  private startRenderLoop() {
    const loop = () => {
      this.animFrameId = requestAnimationFrame(loop);
      const delta = this.renderer.getDelta();
      const time = this.renderer.getElapsed();

      // Always update ocean (it's the backdrop)
      this.ocean.update(time);

      // Always update visual model (sails bobbing, etc.)
      if (this.playerShipModel) {
        this.playerShipModel.updateSails(this.state.wind.direction, this.state.playerShip.sailLevel);
      }

      if (this.isRunning) {
        // Gameplay mode - full physics
        this.updateShipPhysics(delta, time);
        this.cannonballs.update(delta, 0);

        const playerPos = new THREE.Vector3(
          this.state.playerShip.position.x,
          this.state.playerShip.position.y,
          this.state.playerShip.position.z
        );
        this.enemies.update(delta, playerPos, time);
        this.updateCamera(delta);

        if (this.damageVignette > 0) {
          this.damageVignette = Math.max(0, this.damageVignette - delta);
        }

        if (this.goldPopup) {
          this.goldPopup.timer -= delta;
          if (this.goldPopup.timer <= 0) this.goldPopup = null;
        }
      } else {
        // Menu/Hub mode - cinematic camera orbiting the ship
        this.menuCameraAngle += delta * 0.1;
        const camX = Math.sin(this.menuCameraAngle) * 60;
        const camZ = Math.cos(this.menuCameraAngle) * 60;
        const shipPos = this.state.playerShip.position;
        const waveHeight = this.ocean.getWaveHeight(shipPos.x, shipPos.z, time);

        // Smoothly move camera
        this.renderer.camera.position.lerp(
          new THREE.Vector3(shipPos.x + camX, 25, shipPos.z + camZ),
          delta * 2
        );
        this.renderer.camera.lookAt(shipPos.x, waveHeight + 5, shipPos.z);

        // Gentle ship rocking in menu
        if (this.playerShipModel) {
          this.playerShipModel.mesh.position.set(shipPos.x, waveHeight, shipPos.z);
          this.playerShipModel.mesh.rotation.x = Math.sin(time * 0.8) * 0.03;
          this.playerShipModel.mesh.rotation.z = Math.cos(time * 0.6) * 0.02;
        }
      }

      // Time of day (slow cycle)
      this.renderer.setTimeOfDay((time * 0.008) % 1);

      // Always render
      this.renderer.render();
    };
    loop();
  }

  public setOnStateChange(cb: (state: GameState) => void) {
    this.onStateChange = cb;
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public selectShip(shipType: string) {
    this.state.selectedShipType = shipType;
    const config = SHIP_CONFIGS[shipType];

    // Remove old ship
    if (this.playerShipModel) {
      this.renderer.scene.remove(this.playerShipModel.mesh);
      this.playerShipModel.dispose();
    }

    // Create new ship
    this.playerShipModel = new Ship(config);
    this.renderer.scene.add(this.playerShipModel.mesh);

    // Update state
    this.state.playerShip.maxHull = config.hull;
    this.state.playerShip.hull = config.hull;
    this.state.playerShip.crew = this.generateCrew(config.crewCapacity);
  }

  public setScreen(screen: GameScreen) {
    this.state.screen = screen;
    if (screen === 'playing') {
      this.isRunning = true;
      // Reset camera to follow the ship
      const ship = this.state.playerShip;
      this.camera.reset(new THREE.Vector3(ship.position.x, ship.position.y, ship.position.z));
    } else if (screen === 'menu' || screen === 'harbor') {
      this.isRunning = false;
    }
    this.onStateChange?.({ ...this.state });
  }

  public setCrewRole(crewId: string, role: CrewRole) {
    const member = this.state.playerShip.crew.find(c => c.id === crewId);
    if (member) {
      member.role = role;
      this.playerShipModel?.updateCrewVisuals(this.state.playerShip.crew.map(c => c.role));
      this.onStateChange?.({ ...this.state });
    }
  }

  public fireCannons(side: 'left' | 'right') {
    if (!this.isRunning) return;
    const ship = this.state.playerShip;
    if (ship.cannonCooldown > 0) return;
    if (ship.cannonballs <= 0) return;

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

  private updateShipPhysics(delta: number, time: number) {
    const ship = this.state.playerShip;
    const config = SHIP_CONFIGS[this.state.selectedShipType];
    const wind = this.state.wind;

    // Calculate wind effect on speed
    const windDiff = Math.abs(wind.direction - ship.heading);
    const windEffect = Math.cos(windDiff);

    let targetSpeed = 0;
    if (this.input.isForward()) {
      targetSpeed = config.maxSpeed * ship.sailLevel;
      if (windEffect > 0.7) {
        targetSpeed *= WIND.withWindBonus;
      } else if (windEffect < -0.5) {
        targetSpeed *= WIND.againstWindPenalty;
      }
    } else if (this.input.isBackward()) {
      targetSpeed = -config.maxSpeed * 0.3;
    }

    ship.speed = THREE.MathUtils.lerp(ship.speed, targetSpeed, delta * 2);

    let turnInput = 0;
    if (this.input.isLeft()) turnInput = 1;
    if (this.input.isRight()) turnInput = -1;

    // Mobile virtual joystick (from on-screen controls)
    const mobileJoy = this.input.getMobileJoystick();
    if (mobileJoy) {
      turnInput = -mobileJoy.x; // Left/right steers
    }

    // Mobile sail controls
    const sailDelta = this.input.getMobileSailDelta();
    if (sailDelta !== 0) {
      ship.sailLevel = Math.max(0, Math.min(1, ship.sailLevel + sailDelta * delta * 2));
    }

    // Legacy screen-wide touch joystick
    const joystick = this.input.getTouchJoystick();
    if (joystick && !mobileJoy) {
      turnInput = -joystick.x;
      if (joystick.y < -0.3) {
        ship.sailLevel = Math.min(1, ship.sailLevel + delta * 0.5);
      } else if (joystick.y > 0.3) {
        ship.sailLevel = Math.max(0, ship.sailLevel - delta * 0.5);
      }
    }

    const turnSpeed = config.turnRate * (ship.speed / config.maxSpeed + 0.2) * delta;
    ship.heading += turnInput * turnSpeed;

    ship.position.x += Math.sin(ship.heading) * ship.speed * delta;
    ship.position.z += Math.cos(ship.heading) * ship.speed * delta;

    const waveHeight = this.ocean.getWaveHeight(ship.position.x, ship.position.z, time);
    ship.position.y = waveHeight;

    const rockX = Math.sin(time * 1.5 + ship.position.x) * 0.08;
    const rockZ = Math.cos(time * 1.2 + ship.position.z) * 0.05;
    ship.rotation.x = rockX + (ship.speed / config.maxSpeed) * 0.03;
    ship.rotation.z = rockZ + turnInput * 0.05;
    ship.rotation.y = ship.heading;

    if (this.playerShipModel) {
      this.playerShipModel.mesh.position.set(ship.position.x, ship.position.y, ship.position.z);
      this.playerShipModel.mesh.rotation.set(ship.rotation.x, ship.rotation.y, ship.rotation.z);
    }

    if (ship.cannonCooldown > 0) {
      ship.cannonCooldown -= delta;
    }

    const repairCrew = ship.crew.filter(c => c.role === 'repairs').length;
    if (repairCrew > 0 && ship.hull < ship.maxHull) {
      const repairRate = (repairCrew / ship.crew.length) * 20 * delta;
      ship.hull = Math.min(ship.maxHull, ship.hull + repairRate);
    }

    const playerPos = new THREE.Vector3(ship.position.x, ship.position.y, ship.position.z);
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

    const hit = this.enemies.checkPlayerHit(playerPos, config.size * 0.3);
    if (hit) {
      ship.hull -= hit.damage;
      this.state.damageTaken += hit.damage;
      this.damageVignette = 1.0;
      this.screenShake = 0.5;
      if (ship.hull <= 0) {
        this.shipSunk();
      }
      this.onStateChange?.({ ...this.state });
    }

    const nearbyEnemies = this.enemies.getEnemiesInRange(playerPos, 100);
    this.state.isInCombat = nearbyEnemies.length > 0;
  }

  private shipSunk() {
    this.state.playerShip.hull = this.state.playerShip.maxHull * 0.5;
    this.state.playerShip.position = { x: 0, y: 0, z: 0 };
    this.state.screen = 'harbor';
    this.isRunning = false;
    this.onStateChange?.({ ...this.state });
  }

  private updateCamera(delta: number) {
    const ship = this.state.playerShip;
    const pos = new THREE.Vector3(ship.position.x, ship.position.y, ship.position.z);

    const wheel = this.input.consumeWheelDelta();
    if (wheel !== 0) {
      this.camera.setDistance(50 - wheel * 10);
    }

    if (this.screenShake > 0) {
      const shake = this.screenShake * 2;
      pos.x += (Math.random() - 0.5) * shake;
      pos.y += (Math.random() - 0.5) * shake;
      pos.z += (Math.random() - 0.5) * shake;
      this.screenShake = Math.max(0, this.screenShake - delta * 3);
    }

    this.camera.followTarget(pos, ship.heading, delta);
  }

  public getDamageVignette(): number {
    return this.damageVignette;
  }

  public getGoldPopup() {
    return this.goldPopup;
  }

  public getInput() {
    return this.input;
  }

  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
    this.input.dispose();
    this.ocean.dispose();
    this.playerShipModel?.dispose();
    this.world.dispose();
    this.cannonballs.dispose();
    this.enemies.dispose();
    this.renderer.dispose();
  }
}
