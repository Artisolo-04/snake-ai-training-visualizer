import { createInitialState } from '../game/gameEngine.js';
import { stepRelative, getAgentState, encodeState } from '../game/agentInterface.js';

const ACTIONS = ['straight', 'left', 'right'];

export function createAgent({
  learningRate   = 0.1,
  discountFactor = 0.9,
  epsilonStart   = 1.0,
  epsilonMin     = 0.01,
  epsilonDecay   = 0.995,
} = {}) {
  return {
    qTable: new Map(),
    learningRate,
    discountFactor,
    epsilon: epsilonStart,
    epsilonMin,
    epsilonDecay,
    episodeCount: 0,
  };
}

function getQValues(agent, stateKey) {
  if (!agent.qTable.has(stateKey)) {
    agent.qTable.set(stateKey, [0, 0, 0]);
  }
  return agent.qTable.get(stateKey);
}

function chooseAction(agent, stateKey) {
  if (Math.random() < agent.epsilon) {
    return Math.floor(Math.random() * ACTIONS.length);
  }
  const qValues = getQValues(agent, stateKey);
  return qValues.indexOf(Math.max(...qValues));
}

function computeReward(prevState, nextState) {
  if (nextState.gameOver) return -10;
  if (nextState.score > prevState.score) return 10;
  return -0.1;
}

export function runEpisode(agent) {
  let gameState = createInitialState();
  let steps = 0;
  const maxSteps = 1000;

  while (!gameState.gameOver && steps < maxSteps) {

    const agentState      = getAgentState(gameState);
    const stateKey        = encodeState(agentState);
    const actionIndex     = chooseAction(agent, stateKey);
    const action          = ACTIONS[actionIndex];

    const nextGameState   = stepRelative(gameState, action);
    const reward          = computeReward(gameState, nextGameState);

    const nextAgentState  = getAgentState(nextGameState);
    const nextStateKey    = encodeState(nextAgentState);
    const nextQValues     = getQValues(agent, nextStateKey);
    const maxNextQ        = Math.max(...nextQValues);

    const qValues         = getQValues(agent, stateKey);

    qValues[actionIndex] += agent.learningRate * (reward + agent.discountFactor * maxNextQ - qValues[actionIndex]);

    gameState = nextGameState;
    steps++;
    
  }

  agent.epsilon = Math.max(agent.epsilonMin, agent.epsilon * agent.epsilonDecay);
  agent.episodeCount++;

  return { score: gameState.score, steps, epsilon: agent.epsilon };
}

export function trainAgent(agent, episodes) {
  const history = [];
  for (let i = 0; i < episodes; i++) {
    history.push(runEpisode(agent));
  }
  return history;
}
