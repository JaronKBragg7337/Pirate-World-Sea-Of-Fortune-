import { KEY_MAP } from './constants';

export class InputHandler {
  private keys: Set<string> = new Set();
  private mousePos: { x: number; y: number } = { x: 0, y: 0 };
  private mouseDelta: { x: number; y: number } = { x: 0, y: 0 };
  private mouseDown: boolean = false;
  private rightMouseDown: boolean = false;
  private wheelDelta: number = 0;
  private touchStart: { x: number; y: number } | null = null;
  private touchCurrent: { x: number; y: number } | null = null;
  private callbacks: Map<string, (() => void)[]> = new Map();

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('contextmenu', this.onContextMenu);
  }

  private onKeyDown(e: KeyboardEvent) {
    this.keys.add(e.code);
    const cbs = this.callbacks.get(e.code);
    if (cbs) cbs.forEach(cb => cb());
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.code);
  }

  private onMouseMove(e: MouseEvent) {
    this.mouseDelta.x = e.movementX;
    this.mouseDelta.y = e.movementY;
    this.mousePos.x = e.clientX;
    this.mousePos.y = e.clientY;
  }

  private onMouseDown(e: MouseEvent) {
    if (e.button === 0) this.mouseDown = true;
    if (e.button === 2) this.rightMouseDown = true;
  }

  private onMouseUp(e: MouseEvent) {
    if (e.button === 0) this.mouseDown = false;
    if (e.button === 2) this.rightMouseDown = false;
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    this.wheelDelta += e.deltaY * -0.01;
  }

  private onTouchStart(e: TouchEvent) {
    // Don't block taps on UI buttons/links — only prevent default on game canvas
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="button"], .pointer-events-auto')) {
      return; // Let the browser handle the tap as a click
    }
    e.preventDefault();
    const touch = e.touches[0];
    this.touchStart = { x: touch.clientX, y: touch.clientY };
    this.touchCurrent = { x: touch.clientX, y: touch.clientY };
    this.mouseDown = true;
  }

  private onTouchMove(e: TouchEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="button"], .pointer-events-auto')) {
      return;
    }
    e.preventDefault();
    const touch = e.touches[0];
    if (this.touchCurrent && this.touchStart) {
      this.mouseDelta.x = touch.clientX - this.touchCurrent.x;
      this.mouseDelta.y = touch.clientY - this.touchCurrent.y;
    }
    this.touchCurrent = { x: touch.clientX, y: touch.clientY };
  }

  private onTouchEnd() {
    this.touchStart = null;
    this.touchCurrent = null;
    this.mouseDown = false;
  }

  private onContextMenu(e: Event) {
    e.preventDefault();
  }

  public onKey(key: string, callback: () => void) {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, []);
    }
    this.callbacks.get(key)!.push(callback);
  }

  // Movement
  public isForward(): boolean { return this.keys.has(KEY_MAP.forward); }
  public isBackward(): boolean { return this.keys.has(KEY_MAP.backward); }
  public isLeft(): boolean { return this.keys.has(KEY_MAP.left); }
  public isRight(): boolean { return this.keys.has(KEY_MAP.right); }
  
  // Actions
  public isFireLeft(): boolean { return this.keys.has(KEY_MAP.fireLeft); }
  public isFireRight(): boolean { return this.keys.has(KEY_MAP.fireRight); }
  public isAnchor(): boolean { return this.keys.has(KEY_MAP.anchor); }
  public isCrewPanel(): boolean { return this.keys.has(KEY_MAP.crewPanel); }
  public isMap(): boolean { return this.keys.has(KEY_MAP.map); }
  public isPause(): boolean { return this.keys.has(KEY_MAP.pause); }

  // Mouse
  public isMouseDown(): boolean { return this.mouseDown; }
  public isRightMouseDown(): boolean { return this.rightMouseDown; }
  public getMousePos() { return this.mousePos; }
  public getMouseDelta() { return this.mouseDelta; }
  public consumeWheelDelta(): number {
    const val = this.wheelDelta;
    this.wheelDelta = 0;
    return val;
  }

  // Touch
  public getTouchJoystick(): { x: number; y: number } | null {
    if (!this.touchStart || !this.touchCurrent) return null;
    const dx = (this.touchCurrent.x - this.touchStart.x) / 100;
    const dy = (this.touchCurrent.y - this.touchStart.y) / 100;
    return { x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) };
  }

  public resetMouseDelta() {
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
  }

  public dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('contextmenu', this.onContextMenu);
  }
}
