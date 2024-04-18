import React, { useState } from "react";
import { supabase } from "../supabaseClient.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupCard } from "@/confourComponents/auth/signup-card.tsx";
import { LoginCard } from "@/confourComponents/auth/login-card.tsx";
import { siGithub } from "simple-icons";

export function LoginScreen() {
  const [showSignupCard, setShowSignupCard] = useState(false);
  const [showLoginCard, setShowLoginCard] = useState(false);

  const loginGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
    });
  };

  const handleCancelSignup = () => {
    setShowSignupCard(false);
  };

  const handleCancelLogin = () => {
    setShowLoginCard(false);
  };

  const toggleSignupCard = () => {
    setShowSignupCard(!showSignupCard);
  };

  const toggleLoginCard = () => {
    setShowLoginCard(!showLoginCard);
  };

  return (
    <div className="flex flex-col items-center space-y-5">
      <div>
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Connect Four</CardTitle>
            <CardDescription>Login or sign up to play.</CardDescription>
          </CardHeader>

          <CardContent>
            <Button onClick={toggleSignupCard} variant="link">
              Sign up
            </Button>

            <Button onClick={toggleLoginCard} variant="link">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
      <div>
        {showSignupCard && <SignupCard onCancel={handleCancelSignup} />}
        {showLoginCard && (
          <LoginCard
            onCancel={handleCancelLogin}
            onLoginSuccess={handleCancelLogin}
          />
        )}
      </div>
      <Button
        onClick={loginGitHub}
        variant="outline"
        className="flex items-center space-x-2 justify-center w-[250px] h-[50px]"
      >
        <div
          className="c4-svg-icon"
          dangerouslySetInnerHTML={{ __html: siGithub.svg }}
        />
        <span>Login with GitHub</span>
      </Button>
    </div>
  );
}
