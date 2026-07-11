import * as THREE from 'three';
import { COLORS } from './constants';

export class GameRenderer {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private clock: THREE.Clock;

  constructor(canvas: HTMLCanvasElement) {
    this.clock = new THREE.Clock();

    // Renderer setup - mobile optimized
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.setClearColor(COLORS.skyDay);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.oceanDeep, 0.0008);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      3000
    );
    this.camera.position.set(0, 20, 50);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(
      COLORS.skyDay,
      COLORS.oceanDeep,
      0.6
    );
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sunLight.position.set(100, 200, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    this.scene.add(this.sunLight);

    // Window resize handler
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  public getDelta(): number {
    return this.clock.getDelta();
  }

  public getElapsed(): number {
    return this.clock.getElapsedTime();
  }

  public setTimeOfDay(time: number) {
    // time: 0-1, where 0=noon, 0.5=sunset, 0.75=midnight, 1=noon
    const sunAngle = time * Math.PI * 2;
    this.sunLight.position.set(
      Math.cos(sunAngle) * 200,
      Math.sin(sunAngle) * 200,
      50
    );
    this.sunLight.intensity = Math.max(0.1, Math.sin(sunAngle) * 1.2);

    if (time > 0.4 && time < 0.6) {
      // Sunset
      this.renderer.setClearColor(COLORS.sunset);
      this.hemiLight.color.setHex(COLORS.sunset);
    } else if (time > 0.6 || time < 0.1) {
      // Night
      this.renderer.setClearColor(COLORS.night);
      this.hemiLight.color.setHex(0x111122);
      this.hemiLight.groundColor.setHex(0x0a0a1a);
    } else {
      // Day
      this.renderer.setClearColor(COLORS.skyDay);
      this.hemiLight.color.setHex(COLORS.skyDay);
      this.hemiLight.groundColor.setHex(COLORS.oceanDeep);
    }
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
