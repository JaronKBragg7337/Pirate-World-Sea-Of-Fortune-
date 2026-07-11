import { useEffect, useRef, useState, useCallback } from 'react';
import { Crosshair, Users, Anchor, ChevronUp, ChevronDown } from 'lucide-react';

interface MobileControlsProps {
  onFireLeft: () => void;
  onFireRight: () => void;
  onToggleCrew: () => void;
  onGoHarbor: () => void;
  onJoystickMove: (x: number, y: number) => void;
  onJoystickEnd: () => void;
  onSailUp: () => void;
  onSailDown: () => void;
}

// Only show on touch devices
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const check = () => setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    check();
    window.addEventListener('touchstart', check, { once: true });
  }, []);
  return isTouch;
}

export default function MobileControls({
  onFireLeft,
  onFireRight,
  onToggleCrew,
  onGoHarbor,
  onJoystickMove,
  onJoystickEnd,
  onSailUp,
  onSailDown,
}: MobileControlsProps) {
  const isTouch = useIsTouchDevice();
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const maxRadius = 45;

  const handleJoystickStart = useCallback((clientX: number, clientY: number) => {
    draggingRef.current = true;
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dist / dist) * maxRadius;
    }
    setKnobPos({ x: dx, y: dy });
    onJoystickMove(dx / maxRadius, dy / maxRadius);
  }, [onJoystickMove]);

  const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnobPos({ x: dx, y: dy });
    onJoystickMove(dx / maxRadius, dy / maxRadius);
  }, [onJoystickMove]);

  const handleJoystickEnd = useCallback(() => {
    draggingRef.current = false;
    setKnobPos({ x: 0, y: 0 });
    onJoystickEnd();
  }, [onJoystickEnd]);

  // Touch events for joystick
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    handleJoystickStart(touch.clientX, touch.clientY);
  }, [handleJoystickStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    handleJoystickMove(touch.clientX, touch.clientY);
  }, [handleJoystickMove]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    handleJoystickEnd();
  }, [handleJoystickEnd]);

  // Mouse events for joystick (desktop testing)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleJoystickStart(e.clientX, e.clientY);
  }, [handleJoystickStart]);

  if (!isTouch) return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* Left side — Steering joystick */}
      <div className="absolute bottom-28 left-4 pointer-events-auto">
        <div
          ref={joystickRef}
          className="relative w-28 h-28 rounded-full bg-[#0F1F2E]/60 border-2 border-[#D4A843]/30 backdrop-blur-sm"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-px h-8 bg-[#D4A843]/20" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-px w-8 bg-[#D4A843]/20" />
          </div>
          {/* Knob */}
          <div
            ref={knobRef}
            className="absolute w-12 h-12 rounded-full bg-[#D4A843]/50 border-2 border-[#D4A843] shadow-lg shadow-[#D4A843]/20 transition-none"
            style={{
              left: `calc(50% - 24px + ${knobPos.x}px)`,
              top: `calc(50% - 24px + ${knobPos.y}px)`,
            }}
          />
          {/* Labels */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-[#A3B8CC]/60 tracking-wider">L</div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-[#A3B8CC]/60 tracking-wider">R</div>
        </div>
        <div className="text-center mt-2 text-[10px] text-[#A3B8CC]/50">STEER</div>
      </div>

      {/* Left-center — Sail controls */}
      <div className="absolute bottom-32 left-36 flex flex-col gap-2 pointer-events-auto">
        <button
          onTouchStart={(e) => { e.stopPropagation(); onSailUp(); }}
          className="w-12 h-12 rounded-full bg-[#0F1F2E]/60 border-2 border-[#D4A843]/30 backdrop-blur-sm flex items-center justify-center active:bg-[#D4A843]/30 active:scale-95 transition-all"
        >
          <ChevronUp className="w-5 h-5 text-[#D4A843]" />
        </button>
        <button
          onTouchStart={(e) => { e.stopPropagation(); onSailDown(); }}
          className="w-12 h-12 rounded-full bg-[#0F1F2E]/60 border-2 border-[#D4A843]/30 backdrop-blur-sm flex items-center justify-center active:bg-[#D4A843]/30 active:scale-95 transition-all"
        >
          <ChevronDown className="w-5 h-5 text-[#D4A843]" />
        </button>
        <div className="text-center text-[10px] text-[#A3B8CC]/50">SAILS</div>
      </div>

      {/* Right side — Action buttons */}
      <div className="absolute bottom-28 right-4 flex flex-col gap-3 pointer-events-auto">
        {/* Fire Left Cannons */}
        <button
          onTouchStart={(e) => { e.stopPropagation(); onFireLeft(); }}
          className="w-16 h-16 rounded-xl bg-[#E74C3C]/80 border-2 border-[#E74C3C] backdrop-blur-sm flex flex-col items-center justify-center active:bg-[#E74C3C] active:scale-90 transition-all shadow-lg shadow-[#E74C3C]/20"
        >
          <Crosshair className="w-5 h-5 text-white" />
          <span className="text-[9px] text-white font-bold mt-0.5">PORT</span>
        </button>

        {/* Fire Right Cannons */}
        <button
          onTouchStart={(e) => { e.stopPropagation(); onFireRight(); }}
          className="w-16 h-16 rounded-xl bg-[#E74C3C]/80 border-2 border-[#E74C3C] backdrop-blur-sm flex flex-col items-center justify-center active:bg-[#E74C3C] active:scale-90 transition-all shadow-lg shadow-[#E74C3C]/20"
        >
          <Crosshair className="w-5 h-5 text-white" />
          <span className="text-[9px] text-white font-bold mt-0.5">STARBD</span>
        </button>

        {/* Crew Panel */}
        <button
          onTouchStart={(e) => { e.stopPropagation(); onToggleCrew(); }}
          className="w-14 h-14 rounded-xl bg-[#1A3C5A]/80 border-2 border-[#9B59B6]/50 backdrop-blur-sm flex items-center justify-center active:bg-[#9B59B6]/30 active:scale-90 transition-all"
        >
          <Users className="w-5 h-5 text-[#9B59B6]" />
        </button>

        {/* Harbor */}
        <button
          onTouchStart={(e) => { e.stopPropagation(); onGoHarbor(); }}
          className="w-14 h-14 rounded-xl bg-[#1A3C5A]/80 border-2 border-[#D4A843]/50 backdrop-blur-sm flex items-center justify-center active:bg-[#D4A843]/30 active:scale-90 transition-all"
        >
          <Anchor className="w-5 h-5 text-[#D4A843]" />
        </button>
      </div>
    </div>
  );
}
