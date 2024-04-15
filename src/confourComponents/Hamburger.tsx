import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle.tsx";
import { Button } from "@/components/ui/button.tsx";
import Login from "@/confourComponents/Login.tsx";
import OnlineTracker from "@/confourComponents/auth/online-tracker.tsx";
import { supabase } from "../supabaseClient.tsx";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SignupCard } from "@/confourComponents/auth/signup-card.tsx";
import { LoginCard } from "@/confourComponents/auth/login-card.tsx";
import { ChangeUsername } from "@/confourComponents/auth/change-username.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";

// https://supabase.com/docs/reference/javascript/auth-signinwithidtoken
export const Hamburger = () => {
  const { user } = useAuth();
  const [hamburgerOpen, setHamburgerOpen] = useState<boolean>(false);
  const [showSignupCard, setShowSignupCard] = useState(false);
  const [showLoginCard, setShowLoginCard] = useState(false);
  const [showChangeUsername, setShowChangeUsername] = useState(false);

  const loginGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const handleCancelSignup = () => {
    setShowSignupCard(false);
  };

  const handleCancelLogin = () => {
    setShowLoginCard(false);
  };

  const handleCancelChangeUsername = () => {
    setShowChangeUsername(false);
  };

  const toggleSignupCard = () => {
    setShowSignupCard(!showSignupCard);
  };

  const toggleLoginCard = () => {
    setShowLoginCard(!showLoginCard);
  };

  const toggleHamburger = () => {
    setHamburgerOpen(!hamburgerOpen);
    console.log(hamburgerOpen);
  };

  const toggleChangeUsername = () => {
    setShowChangeUsername(!showChangeUsername);
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          onClick={toggleHamburger}
          className="flex items-center"
        >
          <Button variant="outline">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"
              />
            </svg>
            <span>Menu</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          {user ? (
            <>
              <DropdownMenuItem onClick={toggleChangeUsername}>
                Change Username
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </>
          ) : (
            <>
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
              <DropdownMenuItem onClick={loginGitHub}>
                Login with GitHub
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="relative">
        {showSignupCard && <SignupCard onCancel={handleCancelSignup} />}
      </div>
      <div className="relative">
        {showLoginCard && (
          <LoginCard
            onCancel={handleCancelLogin}
            onLoginSuccess={handleCancelLogin}
          />
        )}
      </div>
      <div className="relative">
        {showChangeUsername && (
          <ChangeUsername
            onChangeSuccess={handleCancelChangeUsername}
            isOpen={showChangeUsername}
            onClose={handleCancelChangeUsername}
          />
        )}
      </div>
    </div>

    // <nav className="flex justify-between px-8 relative top-env(safe-area-inset-top) items-center">
    //   <ul className="flex">
    //     <li className="mr-4">
    //       <NavLink to="/">
    //         <Button>Home</Button>
    //       </NavLink>
    //     </li>
    //     <li className="mr-4">
    //       <NavLink to="/app/dashboard">
    //         <Button>Dashboard</Button>
    //       </NavLink>
    //     </li>
    //   </ul>
    //   <ul className="flex items-center">
    //     <li className="mr-4">{OnlineTracker()}</li>
    //
    //     <li className="mr-4">
    //       <Login />
    //     </li>
    //
    //     <li className="mr-4">
    //       <ModeToggle />
    //     </li>
    //   </ul>
    // </nav>
  );
};

export default Hamburger;
