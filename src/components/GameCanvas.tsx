import { useEffect, useRef } from 'react';
import { Game } from '@/game/Game';

interface GameCanvasProps {
  onGameReady: (game: Game) => void;
}

export default function GameCanvas({ onGameReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!canvasRef.current || gameRef.current) return;

    const game = new Game(canvasRef.current);
    gameRef.current = game;
    onGameReady(game);

    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, [onGameReady]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
    />
  );
}
