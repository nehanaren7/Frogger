import { useRef, useEffect, useState } from 'react';

export const useSound = () => {
    const audioContextRef = useRef(null);
    const musicRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        // Initialize AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioContextRef.current = new AudioContext();
        }

        // Initialize Background Music
        musicRef.current = new Audio('/freesound_community-merx-market-song-33936.mp3');
        musicRef.current.loop = true;
        musicRef.current.volume = 0.5; // Lower volume for background

        // Attempt to play music (might be blocked by autoplay policy until interaction)
        // We'll try, but also rely on the first user interaction (mute toggle) to fix it if blocked.
        musicRef.current.play().catch(e => console.log("Autoplay blocked:", e));

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (musicRef.current) {
                musicRef.current.pause();
                musicRef.current = null;
            }
        };
    }, []);

    const toggleMute = () => {
        setIsMuted(prev => {
            const requestedMute = !prev;

            if (requestedMute) {
                // Mute logic
                if (musicRef.current) musicRef.current.pause();
                if (audioContextRef.current && audioContextRef.current.state === 'running') {
                    audioContextRef.current.suspend();
                }
            } else {
                // Unmute logic
                if (musicRef.current) {
                    musicRef.current.play().catch(e => console.log("Playback failed:", e));
                }
                if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume();
                }
            }
            return requestedMute;
        });
    };

    const playCrash = () => {
        if (isMuted || !audioContextRef.current) return;
        const ctx = audioContextRef.current;

        // Resume if suspended (browser policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    };

    const playGameOver = () => {
        if (isMuted || !audioContextRef.current) return;
        const ctx = audioContextRef.current;

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        // Sad melody: descending tritone
        const now = ctx.currentTime;
        [440, 415, 392, 370].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.className = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.4);

            gain.gain.setValueAtTime(0.2, now + i * 0.4);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.4 + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.4);
            osc.stop(now + i * 0.4 + 0.4);
        });
    };

    return { playCrash, playGameOver, isMuted, toggleMute };
};
