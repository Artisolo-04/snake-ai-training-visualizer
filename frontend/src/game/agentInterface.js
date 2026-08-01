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

function floodFillReachable(state, start, limit) {
  if (start.x < 0 || start.x >= GRID_SIZE || start.y < 0 || start.y >= GRID_SIZE) return 0;

  const blocked = new Set(state.snake.slice(0, -1).map((seg) => `${seg.x},${seg.y}`));
  if (blocked.has(`${start.x},${start.y}`)) return 0;

  const visited = new Set([`${start.x},${start.y}`]);
  const queue = [start];
  let count = 1;

  while (queue.length && count < limit) {
    const cur = queue.shift();
    for (const dir of ALL_DIRECTIONS) {
      const next = { x: cur.x + dir.x, y: cur.y + dir.y };
      const key = `${next.x},${next.y}`;
      if (next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE) continue;
      if (visited.has(key) || blocked.has(key)) continue;
      visited.add(key);
      queue.push(next);
      count++;
      if (count >= limit) break;
    }
  }

  return count;
}

function isTrapped(state, dir) {
  const head = state.snake[0];
  const next = { x: head.x + dir.x, y: head.y + dir.y };
  const reachable = floodFillReachable(state, next, state.snake.length);
  return reachable < state.snake.length;
}

function isDangerTwoAhead(state, dir) {

  const head = state.snake[0];

  const oneStep = { x: head.x + dir.x, y: head.y + dir.y };
  const twoStep = { x: head.x + dir.x * 2, y: head.y + dir.y * 2 };

  if (twoStep.x < 0 || twoStep.x >= GRID_SIZE || twoStep.y < 0 || twoStep.y >= GRID_SIZE) return true;

  const bodyToCheck = state.snake.slice(0, -1);

  return bodyToCheck.some(
    (seg) => (seg.x === oneStep.x && seg.y === oneStep.y) || (seg.x === twoStep.x && seg.y === twoStep.y)
  );

}

export function getAgentState(state) {
  
  const dir = state.direction;
  const left = turnLeft(dir);
  const right = turnRight(dir);
  const head = state.snake[0];

  return {
    dangerStraight: isDanger(state, dir),
    dangerLeft: isDanger(state, left),
    dangerRight: isDanger(state, right),
    dangerStraight2: isDangerTwoAhead(state, dir),
    dangerLeft2: isDangerTwoAhead(state, left),
    dangerRight2: isDangerTwoAhead(state, right),
    trapStraight: isTrapped(state, dir),
    trapLeft: isTrapped(state, left),
    trapRight: isTrapped(state, right),
    movingUp: dir === DIRECTIONS.UP,
    movingDown: dir === DIRECTIONS.DOWN,
    movingLeft: dir === DIRECTIONS.LEFT,
    movingRight: dir === DIRECTIONS.RIGHT,
    foodUp: state.food.y < head.y,
    foodDown: state.food.y > head.y,
    foodLeft: state.food.x < head.x,
    foodRight: state.food.x > head.x,
  };
}

export function encodeState(agentState) {
  return Object.values(agentState).map((v) => (v ? '1' : '0')).join('');
}
