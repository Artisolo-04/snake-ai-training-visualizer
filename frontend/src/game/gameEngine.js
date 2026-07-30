export const GRID_SIZE = 20;

export const DIRECTIONS = {

  UP     : {x :  0 , y : -1},
  DOWN   : {x :  0 , y :  1},
  RIGHT  : {x :  1 , y :  0},
  LEFT   : {x : -1 , y :  0},

};

function randomFood (snake) {

  let pos ;

  do {
    pos = {
      x : Math.floor(Math.random() * GRID_SIZE),
      y : Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((seg) => seg.x === pos.x && seg.y === pos.y));

  return pos;

}

export function createInitialState () {

  const start = { x : Math.floor(GRID_SIZE / 2) , y : Math.floor(GRID_SIZE / 2) };
  const snake = [ start , { x : start.x - 1 , y : start.y } , { x : start.x - 2 , y : start.y }];

  return {
    snake ,
    direction : DIRECTIONS.RIGHT,
    food : randomFood (snake),
    score : 0,
    gameOver : false,
  };

}

export function step (state , nextDirection) {

  if (state.gameOver) return state;

  const dir = nextDirection && !(nextDirection.x === -state.direction.x && nextDirection.y === -state.direction.y)
    ? nextDirection
    : state.direction;

  const head = state.snake[0];

  const newHead = { x : head.x + dir.x , y : head.y + dir.y };

  if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
    return { ...state , direction : dir , gameOver : true };
  }

  if (state.snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
    return { ...state , direction : dir , gameOver : true };
  }

  const ateFood = newHead.x === state.food.x && newHead.y === state.food.y;
  const newSnake = [ newHead , ...state.snake ];

  if (!ateFood) newSnake.pop() ;

  return {
    snake : newSnake ,
    direction : dir ,
    food : ateFood ? randomFood(newSnake) : state.food ,
    score : state.score + (ateFood ? 1 : 0) ,
    gameOver : false ,
  };

}
