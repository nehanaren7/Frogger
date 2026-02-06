export const GRID_COLS = 11;
export const GRID_ROWS = 11; // Goal(1) + Water(4) + Road(5) + Start(1)

export const TILE_SIZE = 100 / GRID_COLS; // percent width
export const ROW_HEIGHT = 100 / GRID_ROWS; // percent height

export const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
};

export const INITIAL_STATE = {
    frog: { x: 5, y: 10 }, // Start at bottom center
    score: 0,
    lives: 3,
    level: 1,
    state: 'PLAYING', // PLAYING, GAMEOVER, WON
};
