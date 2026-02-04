import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGameLoop } from '../game/useGameLoop';
import { GRID_ROWS, GRID_COLS, INITIAL_STATE, ROW_HEIGHT, TILE_SIZE } from '../game/constants';
import Frog from './Frog';
import Obstacle from './Obstacle';
import Log from './Log';
import Controls from './Controls';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Utils
const checkCollision = (rect1, rect2) => {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
};

const Game = ({ user, onLogout }) => {
    console.log("Game Component Mounted. User:", user);

    const [gameState, setGameState] = useState(INITIAL_STATE.state);
    const [score, setScore] = useState(INITIAL_STATE.score);
    const [lives, setLives] = useState(INITIAL_STATE.lives);
    const [fuel, setFuel] = useState(INITIAL_STATE.fuel);
    const [isGhost, setIsGhost] = useState(false);
    const [frogState, setFrogState] = useState(INITIAL_STATE.frog);
    const [tick, setTick] = useState(0); // Game loop ticker

    const [highScore, setHighScore] = useState(user?.high_score || 0);
    const [leaderboard, setLeaderboard] = useState([]);

    // Fetch Leaderboard on Game Over
    useEffect(() => {
        if (gameState === 'GAMEOVER') {
            supabase
                .from('profiles')
                .select('*')
                .order('high_score', { ascending: false })
                .limit(5)
                .then(({ data, error }) => {
                    if (data) setLeaderboard(data);
                    if (error) console.error("Leaderboard Fetch Error:", error);
                });
        }
    }, [gameState]);

    // ...

    // Update High Score Effect specific to User
    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            if (user) {
                supabase
                    .from('profiles')
                    .update({ high_score: score })
                    .eq('reg_no', user.reg_no)
                    .then(({ error }) => {
                        if (error) console.error("Score Update Failed:", error);
                    });
            }
        }
    }, [score, highScore, user]);

    const frogRef = useRef({ ...INITIAL_STATE.frog, direction: { x: 0, y: -1 } });
    const obstaclesRef = useRef([]);
    const logsRef = useRef([]);
    const gameStateRef = useRef(INITIAL_STATE.state);
    const fuelRef = useRef(INITIAL_STATE.fuel);
    const isGhostRef = useRef(false);

    // Missing refs restored
    const difficultyMultiplierRef = useRef(1.0);
    const crossingsRef = useRef(0);


    const spawnEntities = useCallback(() => {
        const vehs = [];
        vehs.push({ id: 'r4-1', x: 2, y: 4, type: 1, speed: -0.03, direction: -1 }); // Slower
        vehs.push({ id: 'r4-2', x: 9, y: 4, type: 1, speed: -0.03, direction: -1 }); // More gap
        vehs.push({ id: 'r5-1', x: 0, y: 5, type: 2, speed: 0.05, direction: 1 }); // Slower, Single car
        vehs.push({ id: 'r6-1', x: 5, y: 6, type: 3, speed: -0.08, direction: -1 }); // Slower
        obstaclesRef.current = vehs;

        const lgs = [];
        lgs.push({ id: 'l1-1', x: 0, y: 1, width: 3.5, speed: 0.04 });
        lgs.push({ id: 'l1-2', x: 6, y: 1, width: 3.5, speed: 0.04 });
        lgs.push({ id: 'l2-1', x: 0, y: 2, width: 4.5, speed: -0.06 });
        lgs.push({ id: 'l2-2', x: 7, y: 2, width: 4.5, speed: -0.06 });
        lgs.push({ id: 'l3-1', x: 2, y: 3, width: 3.5, speed: 0.05 });
        lgs.push({ id: 'l3-2', x: 8, y: 3, width: 3.5, speed: 0.05 });
        logsRef.current = lgs;
    }, []);

    useEffect(() => {
        spawnEntities();
        gameStateRef.current = 'PLAYING';
        setGameState('PLAYING');
    }, [spawnEntities]);

    // Soft Reset (Lost a life)
    const softReset = () => {
        frogRef.current = { ...INITIAL_STATE.frog, direction: { x: 0, y: -1 } };
        setFrogState(frogRef.current);
        setFuel(INITIAL_STATE.fuel);
        fuelRef.current = INITIAL_STATE.fuel;
        setIsGhost(false);
        isGhostRef.current = false;
        minYRef.current = 7;
        // Do NOT reset score or difficulty
    };

    // Hard Reset (Game Over)
    const resetGame = () => {
        softReset();
        gameStateRef.current = 'PLAYING';
        setGameState('PLAYING');
        setLives(3);
        setScore(0);
        difficultyMultiplierRef.current = 1.0;
        crossingsRef.current = 0;
    };

    const minYRef = useRef(7);

    const moveFrog = (dir) => {
        if (gameStateRef.current !== 'PLAYING') return;

        const current = frogRef.current;
        let nextPos = { ...current };
        if (dir.x !== 0 || dir.y !== 0) nextPos.direction = dir;
        if (dir.x !== 0) nextPos.x = Math.max(0, Math.min(GRID_COLS - 1, current.x + dir.x));
        if (dir.y !== 0) nextPos.y = Math.max(0, Math.min(GRID_ROWS - 1, current.y + dir.y));

        // Scoring: Forward Progress
        if (nextPos.y < minYRef.current) {
            setScore(s => s + 10);
            minYRef.current = nextPos.y;
        }

        frogRef.current = nextPos;
        setFrogState({ ...nextPos });

        if (nextPos.y === 0) {
            // GOAL REACHED
            setScore(s => s + 1000);
            fuelRef.current = Math.min(100, fuelRef.current + 50);

            // Progressive Difficulty
            crossingsRef.current += 1;
            if (crossingsRef.current % 2 === 0) {
                difficultyMultiplierRef.current *= 1.1; // Increase speed by 10%
                setDebugInfo(prev => ({ ...prev, reason: `Speed Up! x${difficultyMultiplierRef.current.toFixed(2)}` }));
            }

            softReset();
        }
    };

    const handleFloatStart = () => {
        if (gameStateRef.current !== 'PLAYING') return;
        if (fuelRef.current > 0) {
            setIsGhost(true);
            isGhostRef.current = true;
        }
    };

    const handleFloatEnd = () => {
        setIsGhost(false);
        isGhostRef.current = false;
    };

    // Debug State
    const [debugInfo, setDebugInfo] = useState({ onLog: false, reason: '', x: 0, y: 0 });

    useGameLoop((dt) => {
        if (gameStateRef.current !== 'PLAYING') return;

        const deltaTime = Math.min(dt, 50);
        const speedMult = difficultyMultiplierRef.current;

        // 1. Update Obstacles
        obstaclesRef.current.forEach(obs => {
            obs.x += obs.speed * speedMult * (deltaTime / 16);
            if (obs.speed > 0 && obs.x > GRID_COLS) obs.x = -2;
            if (obs.speed < 0 && obs.x < -2) obs.x = GRID_COLS;
        });

        // 2. Update Logs
        logsRef.current.forEach(log => {
            log.x += log.speed * speedMult * (deltaTime / 16);
            if (log.speed > 0 && log.x > GRID_COLS) log.x = -log.width;
            if (log.speed < 0 && log.x < -log.width) log.x = GRID_COLS;
        });

        // 3. Float Mechanic
        if (isGhostRef.current && fuelRef.current > 0) {
            fuelRef.current = Math.max(0, fuelRef.current - 0.5);
            if (fuelRef.current <= 0) {
                isGhostRef.current = false;
                setIsGhost(false);
            }
            setFuel(Math.floor(fuelRef.current));
        }

        // 4. Collision Detection
        const frogCenterX = frogRef.current.x + 0.5;
        let onLog = false;
        let deathReason = '';

        // Check Logs (Rows 1-3)
        if (frogRef.current.y >= 1 && frogRef.current.y <= 3) {
            logsRef.current.forEach(log => {
                if (Math.abs(log.y - frogRef.current.y) < 0.2) {
                    if (frogCenterX > log.x && frogCenterX < log.x + log.width) {
                        onLog = true;
                        frogRef.current.x += log.speed * speedMult * (deltaTime / 16);
                    }
                }
            });

            if (!onLog && !isGhostRef.current) {
                deathReason = `Water Drown`;
                handleGameOver(deathReason);
            }
        }

        // Vehicles
        const frogCarHitbox = { x: frogRef.current.x + 0.25, y: frogRef.current.y + 0.25, width: 0.5, height: 0.5 };
        if (!isGhostRef.current) {
            obstaclesRef.current.forEach(obs => {
                const obsRect = { x: obs.x + 0.1, y: obs.y + 0.1, width: 0.8, height: 0.8 };
                if (checkCollision(frogCarHitbox, obsRect)) {
                    deathReason = 'Car Crash';
                    handleGameOver(deathReason);
                }
            });
        }

        if (frogRef.current.x < 0 || frogRef.current.x >= GRID_COLS) {
            deathReason = 'Screen Edge';
            handleGameOver(deathReason);
        }

        setTick(t => t + 1);
        setDebugInfo({
            onLog,
            reason: deathReason,
            x: frogRef.current.x.toFixed(2),
            y: frogRef.current.y
        });
    });

    const handleGameOver = (reason = '') => {
        // Prevent multiple calls in same frame or rapid succession
        // Check if we already handled death recently? 
        // Actually, softReset moves frog to safe zone instantly, so collision check next frame will pass.
        // But we need to ensure we don't decrement lives multiple times if loop runs fast.

        // Simple distinct check: if frog is already at start, ignore.
        // Or better: use a cooldown?
        // Let's rely on position reset.
        if (frogRef.current.y === 7 && frogRef.current.x === 5) return; // Already reset

        console.log("DEATH:", reason);

        if (lives > 1) {
            setLives(l => l - 1);
            setDebugInfo(prev => ({ ...prev, reason: `Lost Life: ${reason}` }));
            softReset();
        } else {
            if (gameStateRef.current !== 'GAMEOVER') {
                setLives(0);
                setDebugInfo(prev => ({ ...prev, reason: `GAME OVER: ${reason}` }));
                gameStateRef.current = 'GAMEOVER';
                setGameState('GAMEOVER');
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.repeat) return;
            if (e.key === ' ' && gameStateRef.current === 'GAMEOVER') {
                resetGame();
                return;
            }
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W': moveFrog({ x: 0, y: -1 }); break;
                case 'ArrowDown': case 's': case 'S': moveFrog({ x: 0, y: 1 }); break;
                case 'ArrowLeft': case 'a': case 'A': moveFrog({ x: -1, y: 0 }); break;
                case 'ArrowRight': case 'd': case 'D': moveFrog({ x: 1, y: 0 }); break;
                case ' ': handleFloatStart(); break;
            }
        };
        const handleKeyUp = (e) => {
            if (e.key === ' ') handleFloatEnd();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [lives]); // Add lives to dependency if needed, but refs are stable.

    return (
        <div className="relative w-full h-full bg-black overflow-hidden select-none font-sans">
            {/* Fuel Bar */}
            <div className="absolute top-0 left-0 w-full h-2 z-50 bg-gray-900 border-b border-gray-700">
                <div
                    className={`h-full bg-cyan-400 shadow-[0_0_10px_#0ff] ${isGhost ? 'animate-pulse' : ''}`}
                    style={{ width: `${fuel}%`, transition: 'width 0.1s linear' }}
                />
            </div>

            {/* Lives Display (New) */}
            <div className="absolute top-4 right-4 z-50 flex gap-1 items-center">
                {[...Array(3)].map((_, i) => (
                    <Heart
                        key={i}
                        className={`w-6 h-6 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                    />
                ))}
            </div>

            {/* Goal Area */}
            <div className="absolute top-0 left-0 w-full bg-green-900/50 border-b-4 border-dashed border-green-500/30 z-0 flex items-center justify-center" style={{ height: `${ROW_HEIGHT}%` }}>
                <span className="text-green-400 font-bold opacity-50 tracking-[1em] text-xl">GOAL</span>
            </div>

            {/* Water Area */}
            <div className="absolute w-full z-0 opacity-80" style={{
                top: `${ROW_HEIGHT * 1}%`,
                height: `${ROW_HEIGHT * 3}%`,
                backgroundImage: 'url(/assets/Water/1.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(1.2) contrast(1.1)',
            }}></div>

            {/* Road Area */}
            <div className="absolute w-full z-0" style={{
                top: `${ROW_HEIGHT * 4}%`,
                height: `${ROW_HEIGHT * 3}%`,
                backgroundImage: 'url(/assets/Road/1.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}></div>

            {/* Start Area */}
            <div className="absolute bottom-0 left-0 w-full bg-purple-900 border-t-4 border-purple-800 z-0" style={{ height: `${ROW_HEIGHT}%` }}></div>

            {/* Entities */}
            {logsRef.current.map(log => <Log key={log.id} {...log} />)}
            {obstaclesRef.current.map(obs => <Obstacle key={obs.id} {...obs} />)}

            <Frog
                x={frogRef.current.x}
                y={frogRef.current.y}
                direction={frogRef.current.direction || { x: 0, y: -1 }}
                isGhost={isGhost}
            />

            {/* HUD */}
            <div className="absolute top-4 left-4 text-white font-black italic z-50 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] pointer-events-none flex flex-col items-start bg-black/20 p-2 rounded-lg backdrop-blur-[2px]">
                <span className="text-3xl text-cyan-400">{score}</span>
                <span className="text-sm text-yellow-400">HI: {highScore}</span>
            </div>

            {/* Debug HUD (Still useful for Difficulty multiplier) */}
            <div className="absolute top-20 right-2 text-yellow-300 text-xs font-mono z-50 bg-black/50 p-2 pointer-events-none text-right">
                {/* <p>X: {debugInfo.x} Y: {debugInfo.y}</p> */}
                {/* <p>Log: {debugInfo.onLog ? 'YES' : 'NO'}</p> */}
                {debugInfo.reason && <p className="text-red-500 font-bold">{debugInfo.reason}</p>}
            </div>

            {/* Controls Overlay */}
            {gameState === 'PLAYING' && (
                <Controls
                    onMove={moveFrog}
                    onFloatStart={handleFloatStart}
                    onFloatEnd={handleFloatEnd}
                    fuel={fuel}
                />
            )}



            {/* Game Over Screen with Leaderboard */}
            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in duration-300 p-4">
                    <h2 className="text-4xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">GAME OVER</h2>
                    <p className="text-white text-xl mb-6">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>

                    {/* Leaderboard */}
                    <div className="w-full max-w-xs bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
                        <h3 className="text-yellow-400 font-bold text-lg mb-2 text-center border-b border-gray-700 pb-1">LEADERBOARD</h3>
                        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                            {leaderboard.length > 0 ? leaderboard.map((u, i) => (
                                <div key={u.reg_no} className={`flex justify-between text-sm ${user && u.reg_no === user.reg_no ? 'text-cyan-400 font-bold' : 'text-gray-300'}`}>
                                    <span>#{i + 1} {u.name}</span>
                                    <span>{u.high_score}</span>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-xs text-center py-2">Loading Leaderboard...</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button
                            onClick={resetGame}
                            className="w-full py-3 bg-white text-black font-bold text-lg rounded hover:bg-gray-200 active:scale-95 transition-all"
                        >
                            TRY AGAIN
                        </button>
                        <button
                            onClick={onLogout}
                            className="w-full py-3 bg-red-900/50 text-red-400 border border-red-800 font-bold text-lg rounded hover:bg-red-900 active:scale-95 transition-all"
                        >
                            SIGN OUT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;
