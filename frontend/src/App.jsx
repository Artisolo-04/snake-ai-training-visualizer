import { useEffect, useRef, useState, useCallback } from 'react';
import { createInitialState, step, DIRECTIONS, GRID_SIZE } from './game/gameEngine';
import './index.css';

const CELL_SIZE = 20;
const TICK_MS = 120;

function App() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState(createInitialState());
  const [started, setStarted] = useState(false);
  const directionRef = useRef(DIRECTIONS.RIGHT);
  const gameOverRef = useRef(false);
  gameOverRef.current = gameState.gameOver;

  const restart = useCallback(() => {
    directionRef.current = DIRECTIONS.RIGHT;
    setGameState(createInitialState());
    setStarted(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOverRef.current) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          restart();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowUp': directionRef.current = DIRECTIONS.UP; setStarted(true); break;
        case 'ArrowDown': directionRef.current = DIRECTIONS.DOWN; setStarted(true); break;
        case 'ArrowLeft': directionRef.current = DIRECTIONS.LEFT; setStarted(true); break;
        case 'ArrowRight': directionRef.current = DIRECTIONS.RIGHT; setStarted(true); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [restart]);

  useEffect(() => {
    if (gameState.gameOver || !started) return;
    const interval = setInterval(() => {
      setGameState((prev) => step(prev, directionRef.current));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [gameState.gameOver, started]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#12181f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1c232c';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE + 0.5, 0);
      ctx.lineTo(i * CELL_SIZE + 0.5, GRID_SIZE * CELL_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE + 0.5);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE + 0.5);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffb454';
    ctx.fillRect(gameState.food.x * CELL_SIZE, gameState.food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    gameState.snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#5ccfe6' : '#3a8fa3';
      ctx.fillRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    });
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-ink text-text px-4">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal mb-2">
          Specimen 001 // Manual Control
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Snake Training Visualizer
        </h1>
      </div>

      <div className="relative p-2">
        <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber"></span>
        <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber"></span>
        <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber"></span>
        <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber"></span>

        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border border-line rounded-sm bg-panel"
        />

        {gameState.gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/85 backdrop-blur-sm">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-danger">
              Run Terminated
            </p>
            <p className="font-display text-2xl font-bold">Game Over</p>
            <button
              onClick={restart}
              className="mt-1 px-5 py-2 bg-amber hover:bg-amber/90 text-ink font-mono text-sm font-semibold uppercase tracking-wide rounded-sm transition-colors"
            >
              Restart
            </button>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              or press Enter / Space
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 font-mono text-xs uppercase tracking-widest text-muted">
        <span className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              gameState.gameOver ? 'bg-danger' : started ? 'bg-teal animate-pulse' : 'bg-muted'
            }`}
          ></span>
          {gameState.gameOver ? 'Terminated' : started ? 'Live' : 'Standby'}
        </span>
        <span>
          Score <span className="text-amber text-sm">{String(gameState.score).padStart(3, '0')}</span>
        </span>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        Arrow keys to steer
      </p>
    </div>
  );
}

export default App;
