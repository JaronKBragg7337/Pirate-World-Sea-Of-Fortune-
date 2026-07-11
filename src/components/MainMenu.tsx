import { useState } from 'react';
import { Swords, Ship, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainMenuProps {
  onPlay: () => void;
  onShipSelect: () => void;
}

export default function MainMenu({ onPlay, onShipSelect }: MainMenuProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
      {/* Dark overlay for readability - let 3D ocean show through */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1F2E]/90 via-[#0F1F2E]/40 to-[#0F1F2E]/60 pointer-events-none" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#D4A843]/20 animate-pulse"
            style={{
              width: 2 + Math.random() * 3,
              height: 2 + Math.random() * 3,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Content - all interactive elements need pointer-events-auto */}
      <div className="relative z-10 flex flex-col items-center gap-5 pointer-events-auto">
        {/* Title */}
        <div className="text-center mb-2">
          <h1
            className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-wider"
            style={{
              fontFamily: "'Pirata One', 'Rye', serif",
              color: '#D4A843',
              textShadow: '0 0 40px rgba(212,168,67,0.5), 0 4px 8px rgba(0,0,0,0.8), 2px 2px 0 #8B4513',
            }}
          >
            PIRATE WORLD
          </h1>
          <p
            className="text-lg sm:text-xl md:text-2xl mt-2 tracking-widest"
            style={{
              fontFamily: "'Rye', serif",
              color: '#A3B8CC',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            Seas of Fortune
          </p>
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-3 w-64 sm:w-72">
          <button
            onClick={onPlay}
            className="h-14 text-lg font-bold tracking-wide bg-gradient-to-r from-[#8B4513] to-[#D4A843] hover:from-[#A0522D] hover:to-[#E5B950] text-white border-2 border-[#D4A843]/50 rounded-lg shadow-lg shadow-[#D4A843]/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#D4A843]/40 flex items-center justify-center"
          >
            <Swords className="mr-2 h-5 w-5" />
            SET SAIL
          </button>

          <button
            onClick={onShipSelect}
            className="h-12 text-base font-semibold tracking-wide bg-[#1A3C5A]/90 border border-[#D4A843]/40 text-[#D4A843] hover:bg-[#1A3C5A] hover:text-white hover:border-[#D4A843] rounded-lg transition-all hover:scale-105 flex items-center justify-center"
          >
            <Ship className="mr-2 h-5 w-5" />
            SHIPYARD
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="h-12 text-base font-semibold tracking-wide bg-[#1A3C5A]/60 border border-[#A3B8CC]/30 text-[#A3B8CC] hover:bg-[#1A3C5A] hover:text-white rounded-lg transition-all hover:scale-105 flex items-center justify-center"
          >
            <HelpCircle className="mr-2 h-5 w-5" />
            HOW TO PLAY
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-[#A3B8CC]/40 text-xs z-10 pointer-events-none">
        v1.0 - Multiplayer Pirate Adventure
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#1A3C5A] border border-[#D4A843]/30 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#D4A843]" style={{ fontFamily: "'Rye', serif" }}>
                How to Play
              </h2>
              <button onClick={() => setShowHelp(false)} className="text-[#A3B8CC] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-[#A3B8CC]">
              <div>
                <h3 className="text-white font-semibold mb-1">Sailing</h3>
                <p className="text-sm">W/S - Adjust sails (speed up / slow down)</p>
                <p className="text-sm">A/D - Turn the ship left / right</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Combat</h3>
                <p className="text-sm">Q - Fire left cannons</p>
                <p className="text-sm">E - Fire right cannons</p>
                <p className="text-sm">Mouse Wheel - Zoom camera</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Crew Management</h3>
                <p className="text-sm">C - Open crew panel</p>
                <p className="text-sm">Assign crew to Cannons, Repairs, or Sails</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Wind</h3>
                <p className="text-sm">Watch the wind compass! Sailing with the wind gives a 40% speed boost.</p>
              </div>
            </div>

            <Button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full bg-[#D4A843] hover:bg-[#E5B950] text-black font-bold"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
