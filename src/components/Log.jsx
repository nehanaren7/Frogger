import React from 'react';
import { TILE_SIZE, ROW_HEIGHT } from '../game/constants';

const Log = ({ x, y, width = 3 }) => {
    return (
        <div
            className="absolute transition-transform duration-100 ease-linear z-10 flex items-center justify-center pointer-events-none"
            style={{
                left: `${x * TILE_SIZE}%`,
                top: `${y * ROW_HEIGHT}%`,
                width: `${width * TILE_SIZE}%`,
                height: `${ROW_HEIGHT}%`,
            }}
        >
            <div className="w-[95%] h-[60%] relative">
                <img
                    src="/assets/Log/1.png"
                    alt="Log"
                    className="w-full h-full object-fill drop-shadow-md rounded-sm border border-red-500/50"
                />
            </div>
        </div>
    );
};

export default Log;
