import { useEffect, useRef, useState, useCallback } from 'react';
import { createInitialState, step, DIRECTIONS, GRID_SIZE } from './game/gameEngine';
import { stepRelative, getAgentState, encodeState } from './game/agentInterface';
import { createAgent } from './ai/qlearning';
import { saveRun, listRuns, loadRun } from './api/runs';
import RunSelector from './components/RunSelector';
import Sparkline from './components/Sparkline';
import NeuralNetLoader from './components/NeuralNetLoader';
import './index.css';

const CELL_SIZE = 20;
const TICK_MS = 120;
const EPISODES_PER_TRAIN = 20000;
const TRAIN_BATCH_SIZE = 100;

function App() {

  const canvasRef = useRef(null);

  const [mode, setMode] = useState('manual');
  const [gameState, setGameState] = useState(createInitialState());
  const [started, setStarted] = useState(false);
  const directionRef = useRef(DIRECTIONS.RIGHT);
  const gameOverRef = useRef(false);
  const trainWorkerRef = useRef(null);

  gameOverRef.current = gameState.gameOver;

  const [agent, setAgent] = useState(null);
  const [training, setTraining] = useState(false);
  const [trainedEpisodes, setTrainedEpisodes] = useState(0);
  const [trainProgress, setTrainProgress] = useState(0);

  const [trainingHistory, setTrainingHistory] = useState([]);
  const [aiSpeed, setAiSpeed] = useState(80);
  const [savedRuns, setSavedRuns] = useState([]);

  const [manualBestScore, setManualBestScore] = useState(0);

  useEffect(() => {
    setManualBestScore((prev) => Math.max(prev, gameState.score));
  }, [gameState.score]);

  const bestScoreEver = Math.max(
    0,
    manualBestScore,
    ...savedRuns.map((r) => r.best_score ?? 0),
    ...(trainingHistory.length ? [Math.max(...trainingHistory.map((h) => h.score))] : [])
  );

  const avgLast100 = trainingHistory.length
    ? (
        trainingHistory.slice(-100).reduce((sum, h) => sum + h.score, 0) /
        Math.min(100, trainingHistory.length)
      ).toFixed(1)
    : null;

  const refreshRunsList = useCallback(async () => {
    try {
      setSavedRuns(await listRuns());
    } catch (err) {
      console.error('Could not load runs list:', err.message);
    }
  }, []);

  useEffect(() => {
    refreshRunsList();
  }, [refreshRunsList]);

  const handleLoadRun = async (id) => {
    if (!id) return;
    try {
      const run = await loadRun(id);
      const loadedAgent = createAgent();
      loadedAgent.qTable = new Map(Object.entries(run.q_table));
      loadedAgent.epsilon = run.final_epsilon;
      setAgent(loadedAgent);
      setTrainedEpisodes(run.episodes);
      setTrainingHistory([]);
    } catch (err) {
      console.error('Could not load run:', err.message);
    }
  };

  const restart = useCallback(() => {
    directionRef.current = DIRECTIONS.RIGHT;
    setGameState(createInitialState());
    setStarted(mode === 'ai' ? !!agent : false);
  }, [mode, agent]);


  useEffect(() => {
    if (mode !== 'manual') return;
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
  }, [mode, restart]);


  useEffect(() => {
    if (mode !== 'manual' || gameState.gameOver || !started) return;
    const interval = setInterval(() => {
      setGameState((prev) => step(prev, directionRef.current));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [mode, gameState.gameOver, started]);


  useEffect(() => {
    if (mode !== 'ai' || !agent || gameState.gameOver || !started) return;
    const interval = setInterval(() => {
      setGameState((prev) => {
        const stateKey = encodeState(getAgentState(prev));
        const qValues = agent.qTable.get(stateKey) || [0, 0, 0];
        const bestActionIndex = qValues.indexOf(Math.max(...qValues));
        const action = ['straight', 'left', 'right'][bestActionIndex];
        return stepRelative(prev, action);
      });
    }, aiSpeed);
    return () => clearInterval(interval);
  }, [mode, agent, gameState.gameOver, started, aiSpeed]);


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


  const NUM_WORKERS = Math.min(navigator.hardwareConcurrency || 4, 4);

  function mergeQTables(qTablesArrays) {
    const merged = new Map();
    const counts = new Map();

    for (const entries of qTablesArrays) {
      for (const [key, values] of entries) {
        if (!merged.has(key)) {
          merged.set(key, [0, 0, 0]);
          counts.set(key, 0);
        }
        const acc = merged.get(key);
        for (let i = 0; i < 3; i++) acc[i] += values[i];
        counts.set(key, counts.get(key) + 1);
      }
    }

    for (const [key, acc] of merged) {
      const n = counts.get(key);
      for (let i = 0; i < 3; i++) acc[i] /= n;
    }

    return merged;
  }

  function interleaveHistories(historyArrays) {
    const maxLen = Math.max(...historyArrays.map((h) => h.length));
    const result = [];

    for (let i = 0; i < maxLen; i++) {
      for (const history of historyArrays) {
        if (i < history.length) result.push(history[i]);
      }
    }

    return result;
  }

  const handleTrain = () => {
    setTraining(true);
    setTrainProgress(0);

    const episodesPerWorker = Math.ceil(EPISODES_PER_TRAIN / NUM_WORKERS);
    const workers = [];
    const results = new Array(NUM_WORKERS).fill(null);
    const doneCounts = new Array(NUM_WORKERS).fill(0);
    let cancelled = false;

    trainWorkerRef.current = { workers, cancel: () => { cancelled = true; workers.forEach((w) => w.postMessage({ type: 'cancel' })); } };

    const checkAllDone = () => {
      if (results.every((r) => r !== null)) {
        if (cancelled) {
          setTraining(false);
          workers.forEach((w) => w.terminate());
          trainWorkerRef.current = null;
          return;
        }

        const qTable = mergeQTables(results.map((r) => r.qTable));
        const history = interleaveHistories(results.map((r) => r.history));
        const finalEpsilon = Math.min(...results.map((r) => r.epsilon));

        const newAgent = createAgent();
        newAgent.qTable = qTable;
        newAgent.epsilon = finalEpsilon;

        setAgent(newAgent);
        setTrainedEpisodes(EPISODES_PER_TRAIN);
        setTrainingHistory(history);
        setTraining(false);
        setStarted(true);
        workers.forEach((w) => w.terminate());
        trainWorkerRef.current = null;

        (async () => {
          try {
            const bestScore = Math.max(...history.map((h) => h.score));
            await saveRun({
              episodes: EPISODES_PER_TRAIN,
              bestScore,
              finalEpsilon: newAgent.epsilon,
              qTable: Object.fromEntries(newAgent.qTable),
            });
            refreshRunsList();
          } catch (err) {
            console.error('Could not save run:', err.message);
          }
        })();
      }
    };

    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = new Worker(new URL('./workers/trainWorker.js', import.meta.url), { type: 'module' });
      workers.push(worker);

      worker.onmessage = (e) => {
        const { type } = e.data;

        if (type === 'progress') {
          doneCounts[i] = e.data.done;
          const totalDone = doneCounts.reduce((a, b) => a + b, 0);
          setTrainProgress(Math.round((totalDone / EPISODES_PER_TRAIN) * 100));
        }

        if (type === 'done') {
          results[i] = { qTable: e.data.qTable, history: e.data.history, epsilon: e.data.epsilon };
          worker.terminate();
          checkAllDone();
        }

        if (type === 'cancelled') {
          results[i] = { qTable: [], history: [], epsilon: 1 };
          worker.terminate();
          checkAllDone();
        }
      };

      worker.postMessage({ type: 'start', episodes: episodesPerWorker, batchSize: TRAIN_BATCH_SIZE });
    }
  };

  const handleStopTraining = () => {
    trainWorkerRef.current?.cancel();
  };

  useEffect(() => {
    return () => trainWorkerRef.current?.cancel();
  }, []);

  const switchMode = (newMode) => {
    setMode(newMode);
    directionRef.current = DIRECTIONS.RIGHT;
    setGameState(createInitialState());
    setStarted(newMode === 'ai' && !!agent);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-ink text-text px-4">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal mb-2">
          Specimen 001 // {mode === 'manual' ? 'Manual Control' : 'Autonomous Agent'}
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Snake Training Visualizer
        </h1>
      </div>

      <div className="flex gap-2 font-mono text-xs uppercase tracking-widest">
        <button
          onClick={() => switchMode('manual')}
          className={`px-4 py-2 rounded-sm border transition-colors ${
            mode === 'manual'
              ? 'bg-teal text-ink border-teal'
              : 'border-line text-muted hover:text-text'
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => switchMode('ai')}
          className={`px-4 py-2 rounded-sm border transition-colors ${
            mode === 'ai'
              ? 'bg-teal text-ink border-teal'
              : 'border-line text-muted hover:text-text'
          }`}
        >
          AI Agent
        </button>
      </div>

        {bestScoreEver > 0 && (
          <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span>
              Best Ever <span className="text-amber text-xs">{String(bestScoreEver).padStart(3, '0')}</span>
            </span>
            {avgLast100 && (
              <span>
                Avg (last 100) <span className="text-teal text-xs">{avgLast100}</span>
              </span>
            )}
          </div>
        )}

        {mode === 'ai' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleTrain}
                disabled={training}
                className="px-5 py-2 bg-amber hover:bg-amber/90 disabled:opacity-50 text-ink font-mono text-xs font-semibold uppercase tracking-wide rounded-sm transition-colors"
              >
                {training ? `Training… ${trainProgress}%` : `Train ${EPISODES_PER_TRAIN} Episodes`}
              </button>
              {training && (
                <button
                  onClick={handleStopTraining}
                  className="px-4 py-2 border border-line text-danger hover:bg-danger/10 font-mono text-xs uppercase tracking-wide rounded-sm transition-colors"
                >
                  Stop
                </button>
              )}
              {savedRuns.length > 0 && (
                <RunSelector runs={savedRuns} onSelect={handleLoadRun} />
              )}
            </div>

            {trainingHistory.length > 0 && (
            <div className="flex gap-4">
              <Sparkline
                data={trainingHistory.map((h) => h.score)}
                label="Score / Episode"
                valueLabel={`best ${Math.max(...trainingHistory.map((h) => h.score))}`}
                color="#5ccfe6"
                smooth
              />
              <Sparkline
                data={trainingHistory.map((h) => h.epsilon)}
                label="Epsilon (exploration)"
                valueLabel={trainingHistory[trainingHistory.length - 1].epsilon.toFixed(3)}
                color="#ffb454"
              />
            </div>
          )}

          {agent && (
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted">
              <span>Speed</span>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={310 - aiSpeed}
                onChange={(e) => setAiSpeed(310 - Number(e.target.value))}
                className="w-32 accent-teal"
              />
              <span className="text-teal">{aiSpeed}ms/step</span>
            </div>
          )}
        </div>
      )}

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

        {training && mode === 'ai' && (
          <div className="absolute inset-0 bg-ink/90 backdrop-blur-sm rounded-sm">
            <NeuralNetLoader progress={trainProgress} />
          </div>
        )}

        {training && mode === 'manual' && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-ink/80 border border-line rounded-sm font-mono text-[10px] text-teal">
            Training… {trainProgress}%
          </div>
        )}

        {!training && gameState.gameOver && (
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
            {mode === 'manual' && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                or press Enter / Space
              </p>
            )}
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
        {mode === 'manual' ? 'Arrow keys to steer' : agent ? 'Watching trained agent' : 'Train the agent to begin'}
      </p>
    </div>
  );
}

export default App;
