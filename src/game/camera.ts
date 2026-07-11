import * as THREE from 'three';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3 = new THREE.Vector3();
  private offset: THREE.Vector3 = new THREE.Vector3(0, 25, -50);
  private currentPos: THREE.Vector3 = new THREE.Vector3();
  private lookAtPos: THREE.Vector3 = new THREE.Vector3();
  private distance: number = 50;
  private height: number = 25;
  private isAiming: boolean = false;
  private aimTarget: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentPos.copy(camera.position);
  }

  public followTarget(position: THREE.Vector3, rotation: number, delta: number) {
    this.target.copy(position);

    if (this.isAiming) {
      // Aiming mode - side view of ship
      const sideOffset = new THREE.Vector3(
        Math.cos(rotation + Math.PI / 2) * 30,
        15,
        Math.sin(rotation + Math.PI / 2) * 30
      );
      const aimPos = position.clone().add(sideOffset);
      this.currentPos.lerp(aimPos, delta * 3);
      this.lookAtPos.lerp(this.aimTarget, delta * 5);
    } else {
      // Normal follow mode
      const rotOffset = new THREE.Vector3(
        -Math.cos(rotation) * this.distance,
        this.height,
        -Math.sin(rotation) * this.distance
      );
      const desiredPos = position.clone().add(rotOffset);
      this.currentPos.lerp(desiredPos, delta * 2);
      this.lookAtPos.lerp(position, delta * 4);
    }

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.lookAtPos);
  }

  public setDistance(dist: number) {
    this.distance = Math.max(10, Math.min(100, dist));
  }

  public setHeight(h: number) {
    this.height = Math.max(5, Math.min(60, h));
  }

  public setAimingMode(enabled: boolean, target?: THREE.Vector3) {
    this.isAiming = enabled;
    if (target) {
      this.aimTarget.copy(target);
    }
  }

  public getForward(): THREE.Vector3 {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    return forward;
  }

  public reset(position: THREE.Vector3) {
    this.currentPos.copy(position).add(this.offset);
    this.camera.position.copy(this.currentPos);
  }
}
