import React, { useState } from "react";
import { supabase } from "../supabaseClient.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu.tsx";
import { SignupCardComponent } from "@/confourComponents/SignupCardComponent.tsx";
import { LoginCardComponent } from "@/confourComponents/LoginCardComponent.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";

// https://supabase.com/docs/reference/javascript/auth-signinwithidtoken
const LoginComponent = () => {
  const { user, loading } = useAuth();
  const [showSignupCard, setShowSignupCard] = useState(false);
  const [showLoginCard, setShowLoginCard] = useState(false);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const loginGhub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
    });
  };

  const toggleSignupCard = () => {
    setShowSignupCard(!showSignupCard);
  };

  const toggleLoginCard = () => {
    setShowLoginCard(!showLoginCard);
  };

  const handleCancelSignup = () => {
    setShowSignupCard(false);
  };

  const handleCancelLogin = () => {
    setShowLoginCard(false);
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
            <Button>User</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button>Login</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Login Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleSignupCard}>
              Sign up with Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Login options */}
            <DropdownMenuItem onClick={toggleLoginCard}>
              Login with Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={loginGhub}>
              Login with GitHub
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <div className="relative">
        {showSignupCard && (
          <SignupCardComponent onCancel={handleCancelSignup} />
        )}
      </div>
      <div className="relative">
        {showLoginCard && (
          <LoginCardComponent
            onCancel={handleCancelLogin}
            onLoginSuccess={handleCancelLogin}
          />
        )}
      </div>
    </div>
  );
};

export default LoginComponent;
