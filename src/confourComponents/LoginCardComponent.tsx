import * as React from "react";
import { useState } from "react";
import supabase from "@/supabaseClient.tsx";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onCancel: () => void;
  onLoginSuccess: () => void;
}

export function LoginCardComponent({ onCancel, onLoginSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user) {
      onLoginSuccess();
    } else {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid w-full gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
              {error && <p className="text-red-500">{error}</p>}
            </div>
            <CardFooter className="flex justify-between mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
