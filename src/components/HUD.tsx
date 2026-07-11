import { Heart, Wind, Anchor, Coins, Crosshair, Users, Package, TrendingUp, Skull, Hand, AlertTriangle, Droplets } from 'lucide-react';
import type { GameState } from '@/types/game';
import { SHIP_CONFIGS } from '@/game/constants';

interface HUDProps {
  gameState: GameState;
  onToggleCrew: () => void;
  onPause: () => void;
  nearStation: { id: string; label: string } | null;
  controllingShip: boolean;
  activeDamageCount: number;
  floodingLevel: number;
}

export default function HUD({
  gameState,
  onToggleCrew,
  nearStation,
  controllingShip,
  activeDamageCount,
  floodingLevel,
}: HUDProps) {
  const ship = gameState.playerShip;
  const config = SHIP_CONFIGS[gameState.selectedShipType];
  const hullPercent = (ship.hull / ship.maxHull) * 100;
  const repairCrew = ship.crew.filter(c => c.role === 'repairs').length;
  const cannonCrew = ship.crew.filter(c => c.role === 'cannons').length;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3">
        {/* Wind Compass */}
        <div className="bg-[#0F1F2E]/80 backdrop-blur-sm rounded-lg p-3 border border-[#D4A843]/20 pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <Wind className="w-4 h-4 text-[#A3B8CC]" />
            <span className="text-xs text-[#A3B8CC] font-medium">WIND</span>
          </div>
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#D4A843" strokeWidth="1.5" />
              <text x="32" y="10" textAnchor="middle" fill="#A3B8CC" fontSize="8">N</text>
              <text x="32" y="58" textAnchor="middle" fill="#A3B8CC" fontSize="8">S</text>
              <text x="56" y="35" textAnchor="middle" fill="#A3B8CC" fontSize="8">E</text>
              <text x="8" y="35" textAnchor="middle" fill="#A3B8CC" fontSize="8">W</text>
              <g transform={`rotate(${(gameState.wind.direction * 180 / Math.PI) - 90}, 32, 32)`}>
                <polygon points="32,6 28,18 36,18" fill="#D4A843" />
                <line x1="32" y1="18" x2="32" y2="50" stroke="#D4A843" strokeWidth="2" />
                <polygon points="32,58 28,46 36,46" fill="#D4A843" opacity="0.3" />
              </g>
            </svg>
          </div>
          <div className="text-center text-xs text-[#A3B8CC] mt-1">{gameState.wind.speed.toFixed(0)} knots</div>
        </div>

        {/* Center — Interaction prompt */}
        {nearStation && (
          <div className="bg-[#D4A843]/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 animate-pulse">
            <Hand className="w-4 h-4 text-[#0F1F2E]" />
            <span className="text-sm font-bold text-[#0F1F2E]">{nearStation.label}</span>
            <span className="text-xs text-[#0F1F2E]/70 ml-1">[F]</span>
          </div>
        )}

        {/* Controlling ship indicator */}
        {controllingShip && (
          <div className="bg-[#2ECC71]/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <span className="text-xs font-bold text-white">AT HELM</span>
          </div>
        )}

        {/* Right — Score */}
        <div className="flex flex-col gap-2 items-end">
          <div className="bg-[#0F1F2E]/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#D4A843]/20 flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm font-bold text-[#D4A843]">{ship.gold}</span>
          </div>
          <div className="bg-[#0F1F2E]/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#D4A843]/20 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2ECC71]" />
            <span className="text-sm font-bold text-[#2ECC71]">{gameState.score} pts</span>
          </div>
          <div className="bg-[#0F1F2E]/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#D4A843]/20 flex items-center gap-2">
            <Skull className="w-4 h-4 text-[#E74C3C]" />
            <span className="text-sm font-bold text-[#E74C3C]">{gameState.shipsSunk} sunk</span>
          </div>
        </div>
      </div>

      {/* Damage/Flooding alerts */}
      {(activeDamageCount > 0 || floodingLevel > 0) && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col gap-1">
          {activeDamageCount > 0 && (
            <div className="bg-[#E74C3C]/80 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-white" />
              <span className="text-xs font-bold text-white">{activeDamageCount} Hull Breach{activeDamageCount > 1 ? 'es' : ''}</span>
            </div>
          )}
          {floodingLevel > 0 && (
            <div className="bg-[#3498DB]/80 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-2">
              <Droplets className="w-3 h-3 text-white" />
              <span className="text-xs font-bold text-white">Flooding: {(floodingLevel * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Combat indicator */}
      {gameState.isInCombat && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-[#E74C3C]/90 backdrop-blur-sm rounded-lg px-4 py-2 animate-pulse">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white tracking-wider">IN COMBAT</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-end justify-between">
          {/* Hull HP */}
          <div className="bg-[#0F1F2E]/80 backdrop-blur-sm rounded-lg p-3 border border-[#D4A843]/20 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Heart className={`w-4 h-4 ${hullPercent > 50 ? 'text-[#2ECC71]' : hullPercent > 25 ? 'text-yellow-500' : 'text-[#E74C3C]'}`} />
              <span className="text-xs text-[#A3B8CC] font-medium">HULL</span>
              <span className="text-xs text-white ml-auto">{Math.ceil(ship.hull)}/{ship.maxHull}</span>
            </div>
            <div className="w-full h-3 bg-[#0F1F2E] rounded-full overflow-hidden border border-[#D4A843]/20">
              <div className="h-full rounded-full transition-all duration-300" style={{
                width: `${hullPercent}%`,
                background: hullPercent > 50 ? '#2ECC71' : hullPercent > 25 ? '#F39C12' : '#E74C3C',
              }} />
            </div>
          </div>

          {/* Center — Ship info */}
          <div className="flex flex-col items-center gap-2">
            <div className="bg-[#0F1F2E]/80 backdrop-blur-sm rounded-lg px-4 py-1 border border-[#D4A843]/20">
              <span className="text-sm font-bold text-[#D4A843]">{config.name}</span>
            </div>
            <button
              onClick={onToggleCrew}
              className="bg-[#1A3C5A]/90 hover:bg-[#1A3C5A] border border-[#D4A843]/30 rounded-lg p-2 transition-all hover:scale-110 pointer-events-auto"
              title="Crew Panel"
            >
              <Users className="w-5 h-5 text-[#D4A843]" />
            </button>
            <div className="flex items-center gap-2 bg-[#0F1F2E]/80 backdrop-blur-sm rounded-lg px-3 py-1 border border-[#D4A843]/20">
              <Anchor className="w-3 h-3 text-[#A3B8CC]" />
              <span className="text-xs text-[#A3B8CC]">{Math.abs(ship.speed).toFixed(1)} knots</span>
            </div>
          </div>

          {/* Right — Resources */}
          <div className="flex flex-col gap-2">
            <div className="bg-[#0F1F2E]/80 backdrop-blur-sm rounded-lg p-2 border border-[#D4A843]/20">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#4444ff]" />
                  <span className="text-[#4444ff]">{cannonCrew}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-[#44ff44]" />
                  <span className="text-[#44ff44]">{repairCrew}</span>
                </div>
                <span className="text-[#A3B8CC]">/ {ship.crew.length}</span>
              </div>
            </div>
            <div className="bg-[#0F1F2E]/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#D4A843]/20 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C0C0C0]" />
              <span className="text-xs text-[#C0C0C0]">{ship.cannonballs} shots</span>
            </div>
            {ship.cannonCooldown > 0 && (
              <div className="bg-[#0F1F2E]/80 backdrop-blur-sm rounded-lg px-3 py-1 border border-[#E74C3C]/30">
                <div className="text-xs text-[#E74C3C] animate-pulse">
                  Reloading... {ship.cannonCooldown.toFixed(1)}s
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
