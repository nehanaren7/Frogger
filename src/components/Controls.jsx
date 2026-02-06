import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

const Controls = ({ onMove }) => {

    // Unified Pointer Handler for D-Pad
    const handleMoveInput = (e, direction) => {
        // Prevent default browser behavior (selection, zooming, ghost clicks)
        if (e.cancelable) e.preventDefault();

        // Only trigger on primary pointer (left click or main touch)
        if (e.isPrimary === false) return;

        onMove(direction);
    };



    // Button styles
    const btnClass = "w-16 h-16 bg-gray-700/80 rounded-full flex items-center justify-center active:bg-gray-500 backdrop-blur-sm shadow-xl border-2 border-gray-600 active:scale-95 transition-transform touch-none select-none";

    return (
        <div className="absolute bottom-4 left-0 w-full px-4 flex justify-end items-end z-50 pointer-events-auto touch-none select-none">



            {/* D-Pad */}
            <div className="relative w-40 h-40">
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                    <button
                        className={btnClass}
                        onPointerDown={(e) => handleMoveInput(e, { x: 0, y: -1 })}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <ArrowUp className="text-white w-8 h-8" />
                    </button>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                    <button
                        className={btnClass}
                        onPointerDown={(e) => handleMoveInput(e, { x: 0, y: 1 })}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <ArrowDown className="text-white w-8 h-8" />
                    </button>
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    <button
                        className={btnClass}
                        onPointerDown={(e) => handleMoveInput(e, { x: -1, y: 0 })}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <ArrowLeft className="text-white w-8 h-8" />
                    </button>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <button
                        className={btnClass}
                        onPointerDown={(e) => handleMoveInput(e, { x: 1, y: 0 })}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <ArrowRight className="text-white w-8 h-8" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Controls;
