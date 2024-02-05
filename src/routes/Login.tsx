import React, { useState } from 'react';
import { supabase } from '../supabaseClient'

// https://supabase.com/docs/reference/javascript/auth-signinwithidtoken

function Login() {

        const login = async () => {
                await supabase.auth.signInWithOAuth({
                        provider: "github",
                });
        };


        return (
            <div>
                    <button onClick={login} className="text-white">
                            Login with Github
                    </button>
            </div>
        )
}

export default Login;