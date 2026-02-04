import React from 'react';
import { TILE_SIZE, ROW_HEIGHT } from '../game/constants';

const Frog = ({ x, y, direction, isGhost }) => {
    // Map direction to sprite or rotation
    // For now, assuming fixed sprite or simple rotation
    // Assets: Frog/1.png (default?)

    // Directions: UP, DOWN, LEFT, RIGHT
    // Simple rotation for now until we map sprites to animation frames

    let rotation = 0;
    if (direction.x === 1) rotation = 90;
    if (direction.x === -1) rotation = -90;
    if (direction.y === 1) rotation = 180;

    // Ghost effect
    const opacity = isGhost ? 0.6 : 1;
    const filter = isGhost ? 'drop-shadow(0 0 5px #0ff) brightness(1.2)' : 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))';

    return (
        <div
            className="absolute z-20"
            style={{
                left: `${x * TILE_SIZE}%`,
                top: `${y * ROW_HEIGHT}%`,
                width: `${TILE_SIZE}%`,
                height: `${ROW_HEIGHT}%`,
                transform: `rotate(${rotation}deg)`,
                opacity: opacity,
                filter: filter,
            }}
        >
            <img
                src="/assets/Frog/1.png"
                alt="Frog"
                className="w-full h-full object-contain"
            />
        </div>
    );
};

export default Frog;
