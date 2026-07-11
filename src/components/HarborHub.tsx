import { Anchor, Coins, Wrench, Users, Package, TrendingUp, Skull, ChevronRight } from 'lucide-react';
import type { GameState } from '@/types/game';
import { SHIP_CONFIGS } from '@/game/constants';

interface HarborHubProps {
  gameState: GameState;
  onSetSail: () => void;
  onRepair: () => void;
  onHireCrew: () => void;
  onBuyAmmo: () => void;
}

export default function HarborHub({ gameState, onSetSail, onRepair, onHireCrew, onBuyAmmo }: HarborHubProps) {
  const ship = gameState.playerShip;
  const config = SHIP_CONFIGS[gameState.selectedShipType];
  const repairCost = Math.ceil((config.hull - ship.hull) * 0.1);
  const hullPercent = (ship.hull / ship.maxHull) * 100;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-y-auto">
      {/* Transparent overlay - 3D ocean shows through */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F1F2E]/80 via-[#0F1F2E]/85 to-[#0F1F2E]/90 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1
            className="text-4xl font-bold text-[#D4A843] mb-2"
            style={{ fontFamily: "'Rye', serif" }}
          >
            Harbor
          </h1>
          <p className="text-[#A3B8CC]">Safe haven - Weapons disabled</p>
        </div>

        {/* Ship Status Card */}
        <div className="bg-[#1A3C5A]/80 backdrop-blur-sm rounded-xl p-5 border border-[#D4A843]/20 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Anchor className="w-5 h-5 text-[#D4A843]" />
              <span className="text-lg font-bold text-white">{config.name}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0F1F2E]/60 px-3 py-1 rounded-lg">
              <Coins className="w-4 h-4 text-[#D4A843]" />
              <span className="text-sm font-bold text-[#D4A843]">{ship.gold}</span>
            </div>
          </div>

          {/* Hull bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#A3B8CC]">Hull Integrity</span>
              <span className="text-xs text-white">{hullPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 bg-[#0F1F2E] rounded-full overflow-hidden border border-[#D4A843]/20">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${hullPercent}%`,
                  background: hullPercent > 50 ? '#2ECC71' : hullPercent > 25 ? '#F39C12' : '#E74C3C',
                }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-[#0F1F2E]/60 rounded-lg p-2 text-center">
              <Users className="w-4 h-4 text-[#9B59B6] mx-auto mb-1" />
              <div className="text-sm text-white font-medium">{ship.crew.length}</div>
              <div className="text-xs text-[#A3B8CC]">Crew</div>
            </div>
            <div className="bg-[#0F1F2E]/60 rounded-lg p-2 text-center">
              <Package className="w-4 h-4 text-[#C0C0C0] mx-auto mb-1" />
              <div className="text-sm text-white font-medium">{ship.cannonballs}</div>
              <div className="text-xs text-[#A3B8CC]">Ammo</div>
            </div>
            <div className="bg-[#0F1F2E]/60 rounded-lg p-2 text-center">
              <TrendingUp className="w-4 h-4 text-[#2ECC71] mx-auto mb-1" />
              <div className="text-sm text-white font-medium">{gameState.score}</div>
              <div className="text-xs text-[#A3B8CC]">Score</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          {ship.hull < ship.maxHull && (
            <button
              onClick={onRepair}
              disabled={ship.gold < repairCost}
              className="w-full bg-[#1A3C5A]/80 hover:bg-[#1A3C5A] disabled:opacity-50 disabled:cursor-not-allowed border border-[#2ECC71]/30 rounded-xl p-4 flex items-center justify-between transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5 text-[#2ECC71]" />
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">Repair Hull</div>
                  <div className="text-xs text-[#A3B8CC]">Restore ship to full health</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#D4A843]" />
                <span className="text-sm text-[#D4A843] font-medium">{repairCost}</span>
                <ChevronRight className="w-4 h-4 text-[#A3B8CC]" />
              </div>
            </button>
          )}

          <button
            onClick={onHireCrew}
            disabled={ship.gold < 50 || ship.crew.length >= config.crewCapacity}
            className="w-full bg-[#1A3C5A]/80 hover:bg-[#1A3C5A] disabled:opacity-50 disabled:cursor-not-allowed border border-[#9B59B6]/30 rounded-xl p-4 flex items-center justify-between transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#9B59B6]" />
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Hire Crew</div>
                <div className="text-xs text-[#A3B8CC]">{ship.crew.length}/{config.crewCapacity} crew</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#D4A843]" />
              <span className="text-sm text-[#D4A843] font-medium">50</span>
              <ChevronRight className="w-4 h-4 text-[#A3B8CC]" />
            </div>
          </button>

          <button
            onClick={onBuyAmmo}
            disabled={ship.gold < 10}
            className="w-full bg-[#1A3C5A]/80 hover:bg-[#1A3C5A] disabled:opacity-50 disabled:cursor-not-allowed border border-[#C0C0C0]/30 rounded-xl p-4 flex items-center justify-between transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-[#C0C0C0]" />
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Buy Cannonballs</div>
                <div className="text-xs text-[#A3B8CC]">+10 cannonballs</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#D4A843]" />
              <span className="text-sm text-[#D4A843] font-medium">10</span>
              <ChevronRight className="w-4 h-4 text-[#A3B8CC]" />
            </div>
          </button>
        </div>

        {/* Set Sail */}
        <button
          onClick={onSetSail}
          className="w-full h-14 text-lg font-bold tracking-wide bg-gradient-to-r from-[#8B4513] to-[#D4A843] hover:from-[#A0522D] hover:to-[#E5B950] text-white border-2 border-[#D4A843]/50 rounded-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center"
        >
          SET SAIL
          <ChevronRight className="ml-2 w-5 h-5" />
        </button>

        {/* Stats */}
        <div className="mt-4 flex justify-center gap-6 text-xs text-[#A3B8CC]">
          <span className="flex items-center gap-1">
            <Skull className="w-3 h-3 text-[#E74C3C]" />
            {gameState.shipsSunk} ships sunk
          </span>
          <span>Renown: {gameState.renown}</span>
        </div>
      </div>
    </div>
  );
}
