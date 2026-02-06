import React from 'react';
import { TILE_SIZE, ROW_HEIGHT } from '../game/constants';

const Obstacle = ({ x, y, type = 1, direction = 1 }) => {
    // Cars/Vehicles
    // type can map to 1.png, 2.png, 3.png
    // direction 1 = Right, -1 = Left (flip image)

    const rotation = direction === 1 ? 0 : 180; // or scaleX(-1)

    return (
        <div
            className="absolute transition-transform duration-100 ease-linear z-20"
            style={{
                left: `${(x - 0.25) * TILE_SIZE}%`,
                top: `${(y - 0.25) * ROW_HEIGHT}%`,
                width: `${1.5 * TILE_SIZE}%`,
                height: `${1.5 * ROW_HEIGHT}%`,
                transform: `scaleX(${direction})`, // Flip if moving left
            }}
        >
            <img
                src={`/assets/Vehicle/${type}.png`}
                alt="Vehicle"
                className="w-full h-full object-contain drop-shadow-lg"
            />
        </div>
    );
};

export default Obstacle;
