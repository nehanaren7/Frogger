import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

const Controls = ({ onMove, onFloatStart, onFloatEnd, fuel }) => {

    // Unified Pointer Handler for D-Pad
    const handleMoveInput = (e, direction) => {
        // Prevent default browser behavior (selection, zooming, ghost clicks)
        if (e.cancelable) e.preventDefault();

        // Only trigger on primary pointer (left click or main touch)
        if (e.isPrimary === false) return;

        onMove(direction);
    };

    // Unified Pointer Handler for Float Button (Hold)
    const handleFloatInput = (e, isStart) => {
        if (e.cancelable) e.preventDefault();
        if (e.isPrimary === false) return;

        if (isStart) {
            onFloatStart();
        } else {
            onFloatEnd();
        }
    };

    // Button styles
    const btnClass = "w-16 h-16 bg-gray-700/80 rounded-full flex items-center justify-center active:bg-gray-500 backdrop-blur-sm shadow-xl border-2 border-gray-600 active:scale-95 transition-transform touch-none select-none";

    return (
        <div className="absolute bottom-4 left-0 w-full px-4 flex justify-between items-end z-50 pointer-events-auto touch-none select-none">

            {/* Float / Antigravity Button */}
            <div className="flex flex-col items-center mb-2">
                <button
                    className={`w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(0,255,255,0.5)] border-4 transition-all duration-200 ${fuel > 0 ? 'bg-cyan-600/50 border-cyan-400 active:bg-cyan-400/60' : 'bg-gray-600/50 border-gray-500 opacity-50'}`}
                    onPointerDown={(e) => handleFloatInput(e, true)}
                    onPointerUp={(e) => handleFloatInput(e, false)}
                    onPointerLeave={(e) => handleFloatInput(e, false)}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <Zap className={`w-10 h-10 ${fuel > 0 ? 'text-cyan-100 fill-cyan-100' : 'text-gray-400'}`} />
                </button>
                <span className="text-white text-xs mt-1 font-bold tracking-wider drop-shadow-md">FLOAT</span>
            </div>

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
