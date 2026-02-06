import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthScreen = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [regNo, setRegNo] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!name.trim() || !regNo.trim()) {
            setError('Please enter both Name and Register Number.');
            setIsLoading(false);
            return;
        }

        try {
            // Check if user exists
            let { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('reg_no', regNo)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            if (profile) {
                // Update name if changed
                if (profile.name !== name) {
                    const { data: updated, error: updateError } = await supabase
                        .from('profiles')
                        .update({ name })
                        .eq('reg_no', regNo)
                        .select()
                        .single();
                    if (updateError) throw updateError;
                    profile = updated;
                }
            } else {
                // Create new profile
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert([{ reg_no: regNo, name, high_score: 0 }])
                    .select()
                    .single();

                if (insertError) throw insertError;
                profile = newProfile;
            }

            onLogin(profile);
        } catch (err) {
            console.error(err);
            setError('Connection Error: ' + err.message);
            setIsLoading(false); // Only enable if error, otherwise component unmounts/swaps
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gray-950">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950 animate-spin-slow" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
            </div>

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-md bg-gray-900/40 backdrop-blur-2xl rounded-3xl p-10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col items-center gap-8 transform transition-all duration-500">

                {/* Title */}
                <div className="text-center space-y-2">
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_25px_rgba(34,211,238,0.4)] tracking-wider">
                        FROGGER
                    </h1>
                    <p className="text-cyan-200/60 font-medium tracking-[0.2em] text-sm uppercase">Enter the Digital Pond</p>
                </div>

                <form onSubmit={handleLogin} className="w-full flex flex-col gap-6">

                    {/* Input Group: Reg No */}
                    <div className="group space-y-2">
                        <label className="text-cyan-400 text-xs font-bold tracking-widest ml-1 uppercase opacity-80 group-focus-within:opacity-100 transition-opacity">Register Number</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={regNo}
                                onChange={(e) => setRegNo(e.target.value)}
                                disabled={isLoading}
                                className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pl-5 text-white placeholder-white/20 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/10 focus:bg-black/50 focus:outline-none transition-all duration-300 shadow-inner text-lg font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="e.g. RA2111003010000"
                            />
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/5 pointer-events-none"></div>
                        </div>
                    </div>

                    {/* Input Group: Name */}
                    <div className="group space-y-2">
                        <label className="text-purple-400 text-xs font-bold tracking-widest ml-1 uppercase opacity-80 group-focus-within:opacity-100 transition-opacity">Player Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pl-5 text-white placeholder-white/20 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 focus:bg-black/50 focus:outline-none transition-all duration-300 shadow-inner text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="e.g. Neha Naren"
                            />
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/5 pointer-events-none"></div>
                        </div>
                    </div>

                    {/* Error Message */}
                    <div className={`text-rose-400 text-sm font-semibold text-center h-5 transition-all duration-300 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                        {error}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full group relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_-10px_rgba(8,145,178,0.5)] transition-all duration-300 transform ${isLoading ? 'opacity-70 cursor-not-allowed grayscale' : 'hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(8,145,178,0.6)] active:scale-[0.98] active:translate-y-0'}`}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3 tracking-[0.2em] text-lg">
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    CONNECTING...
                                </>
                            ) : (
                                "START GAME"
                            )}
                        </span>
                        {/* Shine Effect */}
                        {!isLoading && <div className="absolute top-0 -left-[100%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shine transition-all duration-700" />}

                        {/* Button Glow */}
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 group-hover:ring-white/40 transition-all duration-300"></div>
                    </button>
                </form>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 flex flex-col items-center gap-1 opacity-60">
                <div className="text-gray-400 text-[10px] font-mono tracking-[0.3em] uppercase">{isLoading ? "ESTABLISHING UPLINK..." : "SYSTEM READY"}</div>
                <div className={`w-1 h-1 rounded-full ${isLoading ? 'bg-yellow-400 animate-ping' : 'bg-green-500 animate-pulse'}`}></div>
            </div>
        </div>
    );
};

export default AuthScreen;
