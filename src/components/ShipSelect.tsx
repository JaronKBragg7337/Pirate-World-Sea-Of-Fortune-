import { Ship, ChevronLeft, Lock, Check } from 'lucide-react';
import { SHIP_CONFIGS, RENOWN_THRESHOLDS } from '@/game/constants';

interface ShipSelectProps {
  currentRenown: number;
  selectedShip: string;
  onSelect: (shipType: string) => void;
  onBack: () => void;
}

export default function ShipSelect({ currentRenown, selectedShip, onSelect, onBack }: ShipSelectProps) {
  const ships = Object.entries(SHIP_CONFIGS);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-y-auto">
      {/* Transparent overlay - 3D ocean shows through */}
      <div className="absolute inset-0 bg-[#0F1F2E]/70 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="text-[#A3B8CC] hover:text-white bg-[#1A3C5A]/60 hover:bg-[#1A3C5A] px-3 py-2 rounded-lg transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1
            className="text-3xl font-bold text-[#D4A843]"
            style={{ fontFamily: "'Rye', serif" }}
          >
            Shipyard
          </h1>
          <div className="ml-auto bg-[#0F1F2E]/80 px-3 py-1 rounded-lg border border-[#D4A843]/20">
            <span className="text-sm text-[#D4A843]">Renown: {currentRenown}</span>
          </div>
        </div>

        {/* Ship Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ships.map(([type, config]) => {
            const requiredRenown = RENOWN_THRESHOLDS[type as keyof typeof RENOWN_THRESHOLDS];
            const isUnlocked = currentRenown >= requiredRenown;
            const isSelected = selectedShip === type;

            return (
              <button
                key={type}
                onClick={() => isUnlocked && onSelect(type)}
                disabled={!isUnlocked}
                className={`relative text-left rounded-xl p-5 border transition-all ${
                  isSelected
                    ? 'border-[#D4A843] shadow-lg shadow-[#D4A843]/20 scale-[1.02] bg-[#1A3C5A]/90'
                    : isUnlocked
                    ? 'border-[#D4A843]/20 hover:border-[#D4A843]/50 hover:scale-[1.02] bg-[#1A3C5A]/80'
                    : 'border-[#555]/20 opacity-60 bg-[#1A3C5A]/50 cursor-not-allowed'
                }`}
              >
                <div className="flex justify-center mb-4">
                  <div
                    className="w-24 h-16 flex items-center justify-center rounded-lg"
                    style={{ backgroundColor: isUnlocked ? '#D4A84315' : '#55515' }}
                  >
                    <Ship
                      className="w-12 h-12"
                      style={{ color: isUnlocked ? '#D4A843' : '#555' }}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white text-center mb-1">{config.name}</h3>
                <p className="text-xs text-[#A3B8CC] text-center mb-3">{config.description}</p>

                <div className="space-y-2 mb-3">
                  <StatBar label="Hull" value={config.hull} max={8000} color="#2ECC71" />
                  <StatBar label="Speed" value={config.maxSpeed} max={20} color="#3498DB" />
                  <StatBar label="Cannons" value={config.cannonsPerSide * 2} max={24} color="#E74C3C" />
                  <StatBar label="Crew" value={config.crewCapacity} max={30} color="#9B59B6" />
                </div>

                {!isUnlocked ? (
                  <div className="flex items-center justify-center gap-2 text-[#555] text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Requires {requiredRenown} Renown</span>
                  </div>
                ) : isSelected ? (
                  <div className="flex items-center justify-center gap-2 text-[#D4A843] text-sm font-medium">
                    <Check className="w-4 h-4" />
                    <span>Selected</span>
                  </div>
                ) : (
                  <div className="text-center text-[#A3B8CC] text-sm">Click to select</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = (value / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#A3B8CC] w-16">{label}</span>
      <div className="flex-1 h-2 bg-[#0F1F2E] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-white w-10 text-right">{value}</span>
    </div>
  );
}
