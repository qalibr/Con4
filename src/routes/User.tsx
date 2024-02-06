import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'

// https://supabase.com/docs/reference/javascript/auth-signinwithidtoken

const User = (() => {
        const [user, setUser] = useState(null);

        useEffect(() => {
                const session = supabase.auth.getSession();

                setUser(session?.user);

                const {data: authListener} = supabase.auth.onAuthStateChange((event, session) => {
                        switch (event) {
                                case "SIGNED_IN":
                                        setUser(session?.user);
                                        break;
                                case "SIGNED_OUT":
                                        setUser(null);
                                        break;
                                default:
                        }
                });

                return () => {
                        authListener.subscription.unsubscribe();
                }
        }, []);

        const logout = async () => {
                await supabase.auth.signOut();
        }

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