import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, GameScreen, CrewRole } from '@/types/game';
import { Game } from '@/game/Game';
import { CREW_NAMES } from '@/game/constants';
import GameCanvas from '@/components/GameCanvas';
import MainMenu from '@/components/MainMenu';
import HUD from '@/components/HUD';
import CrewPanel from '@/components/CrewPanel';
import ShipSelect from '@/components/ShipSelect';
import HarborHub from '@/components/HarborHub';
import MobileControls from '@/components/MobileControls';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showCrew, setShowCrew] = useState(false);
  const [nearStation, setNearStation] = useState<{ id: string; label: string } | null>(null);
  const [controllingShip, setControllingShip] = useState(false);
  const [activeDamage, setActiveDamage] = useState(0);
  const [flooding, setFlooding] = useState(0);
  const gameRef = useRef<Game | null>(null);

  const handleGameReady = useCallback((game: Game) => {
    gameRef.current = game;
    game.setOnStateChange((state) => {
      setGameState(state);
    });
    setGameState(game.getState());

    // Poll character gameplay state
    const interval = setInterval(() => {
      if (!gameRef.current) return;
      setNearStation(gameRef.current.getNearStation());
      setControllingShip(gameRef.current.isControllingShip());
      setActiveDamage(gameRef.current.getActiveDamageCount());
      setFlooding(gameRef.current.getFloodingLevel());
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handlePlay = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.selectShip(gameState?.selectedShipType || 'sloop');
      gameRef.current.setScreen('playing');
      setScreen('playing');
    }
  }, [gameState?.selectedShipType]);

  const handleShipSelect = useCallback(() => {
    setScreen('shipSelect');
  }, []);

  const handleSelectShip = useCallback((shipType: string) => {
    if (gameRef.current) {
      gameRef.current.selectShip(shipType);
    }
    // Update local state
    setGameState(prev => prev ? { ...prev, selectedShipType: shipType } : null);
  }, []);

  const handleSetSail = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.setScreen('playing');
      setScreen('playing');
      setShowCrew(false);
    }
  }, []);

  const handleRepair = useCallback(() => {
    if (!gameRef.current || !gameState) return;
    const ship = gameState.playerShip;
    const maxHull = ship.maxHull;
    const repairCost = Math.ceil((maxHull - ship.hull) * 0.1);
    if (ship.gold >= repairCost) {
      ship.gold -= repairCost;
      ship.hull = maxHull;
      setGameState({ ...gameState });
    }
  }, [gameState]);

  const handleHireCrew = useCallback(() => {
    if (!gameRef.current || !gameState) return;
    const ship = gameState.playerShip;
    if (ship.gold >= 50) {
      ship.gold -= 50;
      const newName = CREW_NAMES[Math.floor(Math.random() * CREW_NAMES.length)];
      ship.crew.push({
        id: `crew_${Date.now()}`,
        name: newName,
        role: 'idle',
        skill: 0.3 + Math.random() * 0.7,
      });
      setGameState({ ...gameState });
    }
  }, [gameState]);

  const handleBuyAmmo = useCallback(() => {
    if (!gameRef.current || !gameState) return;
    const ship = gameState.playerShip;
    if (ship.gold >= 10) {
      ship.gold -= 10;
      ship.cannonballs += 10;
      setGameState({ ...gameState });
    }
  }, [gameState]);

  const handleAssignCrewRole = useCallback((crewId: string, role: CrewRole) => {
    if (gameRef.current) {
      gameRef.current.setCrewRole(crewId, role);
    }
  }, []);

  const handleToggleCrew = useCallback(() => {
    setShowCrew(prev => !prev);
  }, []);

  const handlePause = useCallback(() => {
    setScreen('paused');
    if (gameRef.current) {
      gameRef.current.setScreen('paused');
    }
  }, []);

  const handleResume = useCallback(() => {
    setScreen('playing');
    if (gameRef.current) {
      gameRef.current.setScreen('playing');
    }
  }, []);

  const handleGoToHarbor = useCallback(() => {
    setScreen('harbor');
    if (gameRef.current) {
      gameRef.current.setScreen('harbor');
    }
  }, []);

  // Keyboard shortcut for harbor (F key)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && screen === 'playing') {
        handleGoToHarbor();
      }
      if (e.code === 'Escape' && screen === 'playing') {
        handlePause();
      }
      if (e.code === 'Escape' && screen === 'paused') {
        handleResume();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen, handleGoToHarbor, handlePause, handleResume]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0F1F2E] relative">
      {/* Game Canvas - always mounted */}
      <GameCanvas onGameReady={handleGameReady} />

      {/* Screen overlays */}
      {screen === 'menu' && (
        <div className="absolute inset-0 z-10">
          <MainMenu onPlay={handlePlay} onShipSelect={handleShipSelect} />
        </div>
      )}

      {screen === 'shipSelect' && (
        <div className="absolute inset-0 z-10">
          <ShipSelect
            currentRenown={gameState?.renown || 0}
            selectedShip={gameState?.selectedShipType || 'sloop'}
            onSelect={handleSelectShip}
            onBack={() => setScreen('menu')}
          />
        </div>
      )}

      {screen === 'harbor' && gameState && (
        <div className="absolute inset-0 z-10">
          <HarborHub
            gameState={gameState}
            onSetSail={handleSetSail}
            onRepair={handleRepair}
            onHireCrew={handleHireCrew}
            onBuyAmmo={handleBuyAmmo}
          />
        </div>
      )}

      {(screen === 'playing' || screen === 'paused') && gameState && (
        <>
          <HUD
            gameState={gameState}
            onToggleCrew={handleToggleCrew}
            onPause={handlePause}
            nearStation={nearStation}
            controllingShip={controllingShip}
            activeDamageCount={activeDamage}
            floodingLevel={flooding}
          />

          {/* Mobile touch controls */}
          <MobileControls
            onFireLeft={() => gameRef.current?.fireCannons('left')}
            onFireRight={() => gameRef.current?.fireCannons('right')}
            onToggleCrew={handleToggleCrew}
            onGoHarbor={handleGoToHarbor}
            onJoystickMove={(x, y) => gameRef.current?.getInput().setMobileJoystick(x, y)}
            onJoystickEnd={() => gameRef.current?.getInput().clearMobileJoystick()}
            onSailUp={() => gameRef.current?.getInput().setMobileSailDelta(-0.5)}
            onSailDown={() => gameRef.current?.getInput().setMobileSailDelta(0.5)}
          />

          {/* Harbor quick-access */}
          <div className="absolute top-1/2 right-3 -translate-y-1/2 z-20">
            <button
              onClick={handleGoToHarbor}
              className="bg-[#0F1F2E]/80 backdrop-blur-sm border border-[#D4A843]/30 rounded-lg p-2 text-[#D4A843] hover:bg-[#1A3C5A] hover:scale-110 transition-all"
              title="Go to Harbor (F)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" />
              </svg>
            </button>
          </div>

          {/* Crew Panel */}
          {showCrew && (
            <CrewPanel
              crew={gameState.playerShip.crew}
              onAssignRole={handleAssignCrewRole}
              onClose={() => setShowCrew(false)}
            />
          )}
        </>
      )}

      {/* Pause overlay */}
      {screen === 'paused' && (
        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#1A3C5A] border border-[#D4A843]/30 rounded-xl p-8 text-center max-w-sm w-full">
            <h2
              className="text-3xl font-bold text-[#D4A843] mb-6"
              style={{ fontFamily: "'Rye', serif" }}
            >
              Paused
            </h2>
            <div className="space-y-3">
              <button
                onClick={handleResume}
                className="w-full py-3 bg-gradient-to-r from-[#8B4513] to-[#D4A843] rounded-lg text-white font-bold hover:scale-105 transition-all"
              >
                Resume
              </button>
              <button
                onClick={handleGoToHarbor}
                className="w-full py-3 bg-[#0F1F2E] border border-[#D4A843]/30 rounded-lg text-[#D4A843] font-medium hover:bg-[#1A3C5A] transition-all"
              >
                Go to Harbor
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="w-full py-3 bg-[#0F1F2E] border border-[#E74C3C]/30 rounded-lg text-[#E74C3C] font-medium hover:bg-[#E74C3C]/10 transition-all"
              >
                Quit to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Damage vignette */}
      {gameState && (
        <div
          className="absolute inset-0 z-25 pointer-events-none transition-opacity duration-300"
          style={{
            boxShadow: 'inset 0 0 100px rgba(231, 76, 60, 0.0)',
            opacity: 0,
          }}
        />
      )}
    </div>
  );
}
