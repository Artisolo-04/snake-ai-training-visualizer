import { DIRECTIONS , GRID_SIZE , step } from './gameEngine.js';

const ALL_DIRECTIONS = [ DIRECTIONS.UP , DIRECTIONS.RIGHT , DIRECTIONS.DOWN , DIRECTIONS.LEFT ] ;

function dirIndex (dir) {
  return ALL_DIRECTIONS.findIndex((d) => d.x === dir.x && d.y === dir.y);
}

function turnLeft (dir) {
  return ALL_DIRECTIONS [(dirIndex(dir) + 3) % 4];
}

function turnRight (dir) {
  return ALL_DIRECTIONS [(dirIndex(dir) + 1) % 4];
}

function isDanger(state, dir) {
  const head = state.snake[0];
  const next = { x: head.x + dir.x, y: head.y + dir.y };
  if (next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE) return true;
  return state.snake.some((seg) => seg.x === next.x && seg.y === next.y);
}

export function stepRelative(state, action) {
  let nextDir = state.direction;
  if (action === 'left') nextDir = turnLeft(state.direction);
  if (action === 'right') nextDir = turnRight(state.direction);
  return step(state, nextDir);
}

export function getAgentState(state) {
  const dir = state.direction;
  const left = turnLeft(dir);
  const right = turnRight(dir);
  const head = state.snake[0];

  return {
    dangerStraight : isDanger(state, dir),
    dangerLeft     : isDanger(state, left),
    dangerRight    : isDanger(state, right),

    movingUp       : dir === DIRECTIONS.UP,
    movingDown     : dir === DIRECTIONS.DOWN,
    movingLeft     : dir === DIRECTIONS.LEFT,
    movingRight    : dir === DIRECTIONS.RIGHT,

    foodUp         : state.food.y < head.y,
    foodDown       : state.food.y > head.y,
    foodLeft       : state.food.x < head.x,
    foodRight      : state.food.x > head.x,
  };
}

export function encodeState(agentState) {
  return Object.values(agentState).map((v) => (v ? '1' : '0')).join('');
}
