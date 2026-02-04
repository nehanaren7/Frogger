import { useEffect, useRef } from 'react';

export const useGameLoop = (callback) => {
    const requestRef = useRef();
    const previousTimeRef = useRef();
    const callbackRef = useRef(callback);

    // Keep callback fresh
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const animate = (time) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current;
            if (callbackRef.current) callbackRef.current(deltaTime);
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);
};
