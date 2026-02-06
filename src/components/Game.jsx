import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGameLoop } from '../game/useGameLoop';
import { useSound } from '../game/useSound';
import { GRID_ROWS, GRID_COLS, INITIAL_STATE, ROW_HEIGHT, TILE_SIZE } from '../game/constants';
import Frog from './Frog';
import Obstacle from './Obstacle';
import Log from './Log';
import Controls from './Controls';
import { Heart, Volume2, VolumeX } from 'lucide-react';
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
                .limit(100)
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

    // Missing refs restored
    const difficultyMultiplierRef = useRef(1.0);
    const crossingsRef = useRef(0);


    const spawnEntities = useCallback(() => {
        const vehs = [];
        // Upper Lanes: Right to Left (direction: -1)
        vehs.push({ id: 'r5-1', x: 2, y: 5, type: 1, speed: -0.03, direction: -1 }); // Row 5 (R->L)
        vehs.push({ id: 'r5-2', x: 9, y: 5, type: 1, speed: -0.03, direction: -1 });
        vehs.push({ id: 'r6-1', x: 0, y: 6, type: 2, speed: -0.05, direction: -1 }); // Row 6 (R->L)

        // Row 7: SAFE LANE (No vehicles)

        // Lower Lanes: Left to Right (direction: 1)
        vehs.push({ id: 'r8-1', x: 3, y: 8, type: 1, speed: 0.04, direction: 1 }); // Row 8 (L->R)
        vehs.push({ id: 'r8-2', x: 8, y: 8, type: 1, speed: 0.04, direction: 1 });
        vehs.push({ id: 'r9-1', x: 1, y: 9, type: 2, speed: 0.06, direction: 1 }); // Row 9 (L->R)
        vehs.push({ id: 'r9-2', x: 7, y: 9, type: 2, speed: 0.06, direction: 1 });
        obstaclesRef.current = vehs;

        const lgs = [];
        lgs.push({ id: 'l1-1', x: 0, y: 1, width: 3.5, speed: 0.04 });
        lgs.push({ id: 'l1-2', x: 6, y: 1, width: 3.5, speed: 0.04 });
        lgs.push({ id: 'l2-1', x: 0, y: 2, width: 4.5, speed: -0.06 });
        lgs.push({ id: 'l2-2', x: 7, y: 2, width: 4.5, speed: -0.06 });
        lgs.push({ id: 'l3-1', x: 2, y: 3, width: 3.5, speed: 0.05 });
        lgs.push({ id: 'l3-2', x: 8, y: 3, width: 3.5, speed: 0.05 });
        lgs.push({ id: 'l4-1', x: 1, y: 4, width: 4.0, speed: -0.05 }); // Row 4 (New)
        lgs.push({ id: 'l4-2', x: 7, y: 4, width: 4.0, speed: -0.05 });
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
        minYRef.current = 10;
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

    const minYRef = useRef(10);

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

            // Progressive Difficulty
            crossingsRef.current += 1;
            if (crossingsRef.current % 2 === 0) {
                difficultyMultiplierRef.current *= 1.1; // Increase speed by 10%
                setDebugInfo(prev => ({ ...prev, reason: `Speed Up! x${difficultyMultiplierRef.current.toFixed(2)}` }));
            }

            softReset();
        }
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



        // 4. Collision Detection
        const frogCenterX = frogRef.current.x + 0.5;
        let onLog = false;
        let deathReason = '';

        // Check Logs (Rows 1-3)
        if (frogRef.current.y >= 1 && frogRef.current.y <= 4) {
            logsRef.current.forEach(log => {
                if (Math.abs(log.y - frogRef.current.y) < 0.2) {
                    if (frogCenterX > log.x && frogCenterX < log.x + log.width) {
                        onLog = true;
                        frogRef.current.x += log.speed * speedMult * (deltaTime / 16);
                    }
                }
            });

            if (!onLog) {
                deathReason = `Water Drown`;
                handleGameOver(deathReason);
            }
        }

        // Vehicles
        const frogCarHitbox = { x: frogRef.current.x + 0.25, y: frogRef.current.y + 0.25, width: 0.5, height: 0.5 };
        {
            obstaclesRef.current.forEach(obs => {
                const obsRect = { x: obs.x - 0.1, y: obs.y - 0.1, width: 1.2, height: 1.2 };
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

    // Sound Hooks
    const { playCrash, playGameOver, isMuted, toggleMute } = useSound();

    const handleGameOver = (reason = '') => {
        // Prevent multiple calls in same frame or rapid succession
        // Check if we already handled death recently? 
        // Actually, softReset moves frog to safe zone instantly, so collision check next frame will pass.
        // But we need to ensure we don't decrement lives multiple times if loop runs fast.

        // Simple distinct check: if frog is already at start, ignore.
        // Or better: use a cooldown?
        // Let's rely on position reset.
        if (frogRef.current.y === 10 && frogRef.current.x === 5) return; // Already reset

        console.log("DEATH:", reason);

        if (lives > 1) {
            setLives(l => l - 1);
            setDebugInfo(prev => ({ ...prev, reason: `Lost Life: ${reason}` }));
            playCrash(); // Play crash sound
            softReset();
        } else {
            if (gameStateRef.current !== 'GAMEOVER') {
                setLives(0);
                setDebugInfo(prev => ({ ...prev, reason: `GAME OVER: ${reason}` }));
                gameStateRef.current = 'GAMEOVER';
                setGameState('GAMEOVER');
                playGameOver(); // Play game over sound
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
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [lives]); // Add lives to dependency if needed, but refs are stable.

    return (
        <div className="relative w-full h-full bg-black overflow-hidden select-none font-sans">


            {/* Lives and Controls */}
            <div className="absolute top-4 right-4 z-50 flex gap-4 items-center">
                <div className="flex gap-1 items-center">
                    {[...Array(3)].map((_, i) => (
                        <Heart
                            key={i}
                            className={`w-6 h-6 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                        />
                    ))}
                </div>

                {/* Mute Button */}
                <button
                    onClick={toggleMute}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors border border-white/20"
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-green-400" />}
                </button>
            </div>

            {/* Goal Area */}
            <div className="absolute top-0 left-0 w-full bg-green-900/50 border-b-4 border-dashed border-green-500/30 z-0 flex items-center justify-center" style={{ height: `${ROW_HEIGHT}%` }}>
                <span className="text-green-400 font-bold opacity-50 tracking-[1em] text-xl">GOAL</span>
            </div>

            {/* Water Area */}
            <div className="absolute w-full z-0 opacity-80" style={{
                top: `${ROW_HEIGHT * 1}%`,
                height: `${ROW_HEIGHT * 4}%`,
                backgroundImage: 'url(/assets/Water/1.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(1.2) contrast(1.1)',
            }}></div>

            {/* Road Area - Tiled Blocks with Safe Middle Lane */}
            {[5, 6, 7, 8, 9].map(row => (
                <div key={row} className={`absolute w-full z-0 ${row === 7 ? 'bg-green-800 border-t-2 border-b-2 border-green-700' : ''}`} style={{
                    top: `${ROW_HEIGHT * row}%`,
                    height: `${ROW_HEIGHT}%`,
                    backgroundImage: row === 7 ? 'none' : 'url(/assets/Road/1.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}>
                    {row === 7 && (
                        // Optional Grass Texture or Pattern for Safe Lane
                        <div className="w-full h-full opacity-30" style={{
                            backgroundImage: 'url(/assets/Water/1.png)', // Reusing water texture with green tint for grass effect? Or just simple color.
                            filter: 'hue-rotate(90deg) brightness(0.5)',
                            backgroundSize: 'cover'
                        }}></div>
                    )}
                </div>
            ))}

            {/* Start Area */}
            <div className="absolute bottom-0 left-0 w-full bg-purple-900 border-t-4 border-purple-800 z-0" style={{ height: `${ROW_HEIGHT}%` }}></div>

            {/* Entities */}
            {logsRef.current.map(log => <Log key={log.id} {...log} />)}
            {obstaclesRef.current.map(obs => <Obstacle key={obs.id} {...obs} />)}

            <Frog
                x={frogRef.current.x}
                y={frogRef.current.y}
                direction={frogRef.current.direction || { x: 0, y: -1 }}
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
                />
            )}



            {/* Game Over Screen with Leaderboard */}
            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in duration-300 p-4">
                    <h2 className="text-4xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">GAME OVER</h2>
                    <p className="text-white text-xl mb-6">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>

                    {/* Leaderboard - Full Page */}
                    <div className="w-full max-w-4xl bg-gray-800/90 rounded-xl p-6 mb-6 border-2 border-gray-700 flex flex-col h-[60vh]">
                        <h3 className="text-yellow-400 font-bold text-3xl mb-4 text-center border-b-2 border-gray-600 pb-2 tracking-widest uppercase text-shadow">Global Leaderboard</h3>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-gray-900 z-10 text-cyan-400 uppercase text-sm font-bold tracking-wider">
                                    <tr>
                                        <th className="p-3 border-b border-gray-700">Rank</th>
                                        <th className="p-3 border-b border-gray-700">Name</th>
                                        <th className="p-3 border-b border-gray-700 text-right">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.length > 0 ? leaderboard.map((u, i) => (
                                        <tr
                                            key={u.reg_no}
                                            className={`
                                                border-b border-gray-700/50 hover:bg-white/5 transition-colors
                                                ${user && u.reg_no === user.reg_no ? 'bg-cyan-900/30 text-cyan-300 font-bold' : 'text-gray-300'}
                                                ${i < 3 ? 'text-yellow-200' : ''}
                                            `}
                                        >
                                            <td className="p-3 flex items-center gap-2">
                                                {i === 0 && <span className="text-xl">🥇</span>}
                                                {i === 1 && <span className="text-xl">🥈</span>}
                                                {i === 2 && <span className="text-xl">🥉</span>}
                                                <span className="opacity-70">#{i + 1}</span>
                                            </td>
                                            <td className="p-3 font-medium">{u.name}</td>
                                            <td className="p-3 text-right font-mono text-lg">{u.high_score.toLocaleString()}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-gray-500 animate-pulse">
                                                Loading global records...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full max-w-md justify-center">
                        <button
                            onClick={resetGame}
                            className="flex-1 py-4 bg-white text-black font-black text-xl rounded-lg hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            TRY AGAIN
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex-1 py-4 bg-red-900/80 text-red-200 border-2 border-red-800 font-bold text-xl rounded-lg hover:bg-red-800 hover:text-white active:scale-95 transition-all"
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
