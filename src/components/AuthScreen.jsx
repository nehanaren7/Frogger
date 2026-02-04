import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthScreen = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [regNo, setRegNo] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !regNo.trim()) {
            setError('Please enter both Name and Register Number.');
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
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gray-950">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-gray-950 to-gray-950 animate-spin-slow" />
            </div>

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-sm bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6">

                {/* Title */}
                <div className="text-center">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] tracking-wider">
                        FROGGER
                    </h1>
                    <p className="text-gray-400 text-xs font-bold tracking-[0.3em] mt-2 opacity-70">ANTIGRAVITY EDITION</p>
                </div>

                <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">

                    {/* Input Group: Reg No */}
                    <div className="group space-y-2">
                        <label className="text-cyan-300 text-xs font-bold tracking-wider ml-1 uppercase">Register Number</label>
                        <input
                            type="text"
                            value={regNo}
                            onChange={(e) => setRegNo(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10 focus:outline-none transition-all duration-300 shadow-inner text-lg font-medium tracking-wide"
                            placeholder="e.g. 21BCE0001"
                        />
                    </div>

                    {/* Input Group: Name */}
                    <div className="group space-y-2">
                        <label className="text-purple-300 text-xs font-bold tracking-wider ml-1 uppercase">Player Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-purple-400/50 focus:ring-4 focus:ring-purple-400/10 focus:outline-none transition-all duration-300 shadow-inner text-lg font-medium"
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    {/* Error Message */}
                    <div className={`text-red-400 text-xs font-bold text-center h-4 transition-opacity duration-300 ${error ? 'opacity-100' : 'opacity-0'}`}>
                        {error || "..."}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest text-lg">
                            START GAME
                        </span>
                        {/* Shine Effect */}
                        <div className="absolute top-0 -left-[100%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
                    </button>
                </form>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-gray-500 text-xs font-mono">
                v1.0.0 • READY TO JUMP
            </div>
        </div>
    );
};

export default AuthScreen;
