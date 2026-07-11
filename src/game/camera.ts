import * as THREE from 'three';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private offset: THREE.Vector3 = new THREE.Vector3(0, 5, -8);
  private currentPos: THREE.Vector3 = new THREE.Vector3();
  private distance: number = 12;
  private height: number = 6;
  private pitch: number = 0.3;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentPos.copy(camera.position);
  }

  public followCharacter(position: THREE.Vector3, rotation: number, delta: number) {
    // Orbit around character
    const offsetX = Math.sin(rotation) * Math.cos(this.pitch) * this.distance;
    const offsetY = Math.sin(this.pitch) * this.height;
    const offsetZ = Math.cos(rotation) * Math.cos(this.pitch) * this.distance;

    const desiredPos = position.clone().add(new THREE.Vector3(offsetX, offsetY, offsetZ));
    this.currentPos.lerp(desiredPos, delta * 4);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(position.clone().add(new THREE.Vector3(0, 2, 0)));
  }

  public setDistance(dist: number) {
    this.distance = Math.max(4, Math.min(20, dist));
  }

  public setPitch(p: number) {
    this.pitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, p));
  }

  public getPitch(): number {
    return this.pitch;
  }

  public reset(position: THREE.Vector3) {
    this.currentPos.copy(position).add(this.offset);
    this.camera.position.copy(this.currentPos);
  }
}
