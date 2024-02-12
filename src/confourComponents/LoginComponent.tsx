import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.tsx'
import { User } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button.tsx";
import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuTrigger,
        DropdownMenuLabel,
        DropdownMenuSeparator,
        DropdownMenuItem
} from "@/components/ui/dropdown-menu.tsx";

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

        const loginGhub = async () => {
                await supabase.auth.signInWithOAuth({
                        provider: "github",
                });
        };

        return (
            <div>
                    {loading ? (
                        // Using the loading variable to prevent us from briefly
                        // seeing the Login with GitHub message when going to User page.
                        <p></p>
                    ) : user ? (
                        <DropdownMenu>
                                <DropdownMenuTrigger>
                                        <Button>
                                                User
                                        </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                        <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                                </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <DropdownMenu>
                                <DropdownMenuTrigger>
                                        <Button>
                                                Login
                                        </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                        <DropdownMenuLabel>Login Options</DropdownMenuLabel>
                                        <DropdownMenuSeparator/>
                                        {/* Login options */}
                                        <DropdownMenuItem onClick={loginGhub}>Login with GitHub</DropdownMenuItem>
                                </DropdownMenuContent>
                        </DropdownMenu>

                    )}
            </div>
        )
}

export default LoginComponent;