import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'

// https://supabase.com/docs/reference/javascript/auth-signinwithidtoken
const User = (() => {
        const [user, setUser] = useState(null);

        useEffect(() => {
                const fetchSession = async () => {
                        const {data: {session}, error} = await supabase.auth.getSession();
                        if (error) {
                                console.error('Error fetching session:', error.message);
                        } else {
                                setUser(session?.user ?? null);
                        }
                };

                fetchSession();

                const {data: authListener} = supabase.auth.onAuthStateChange((_event, session) => {
                        setUser(session?.user ?? null);
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

        console.log(user);

        return (
            <div>
                    {user ? (
                        <button onClick={logout} className="text-white">
                                Logout
                        </button>
                    ) : (
                        <button onClick={login} className="text-white">
                                Login with Github
                        </button>
                    )}
            </div>
        )
})

export default User;