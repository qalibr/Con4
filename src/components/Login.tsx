import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.tsx'
import { User } from '@supabase/supabase-js';

// https://supabase.com/docs/reference/javascript/auth-signinwithidtoken
const LoginComponent = () => {
        const [user, setUser] = useState<User | null>(null);
        const [loading, setLoading] = useState(true); // Loading variable

        useEffect(() => {
                const fetchSession = async () => {
                        const {data: {session}, error} = await supabase.auth.getSession();
                        if (error) {
                                console.error('Error fetching session:', error.message);
                        } else {
                                setUser(session?.user ?? null);
                        }
                        setLoading(false);
                };

                fetchSession();

                const {data: authListener} = supabase.auth.onAuthStateChange((_event, session) => {
                        setUser(session?.user ?? null);
                        setLoading(false);
                });

                return () => {
                        authListener.subscription.unsubscribe();
                };
        }, []);

        const logout = async () => {
                await supabase.auth.signOut();
        };

        const login = async () => {
                await supabase.auth.signInWithOAuth({
                        provider: "github",
                });
        };

        return (
            <div className="flex-auto px-8 py-8 relative top-48">
                    {loading ? (
                        // Using the loading variable to prevent us from briefly
                        // seeing the Login with GitHub message when going to User page.
                        <p></p>
                    ) : user ? (
                        <button onClick={logout} className="btn-primary">
                                Logout
                        </button>
                    ) : (
                        <button onClick={login} className="btn-primary">
                                Login with Github
                        </button>
                    )}
            </div>
        )
}

export default LoginComponent;