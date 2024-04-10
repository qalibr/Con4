import * as React from "react";
import useAuth from "@/confourHooks/useAuth.tsx";
import { useState } from "react";
import supabase from "@/supabaseClient.tsx";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserEntry {
  user_id: string;
  created_at: string;
  username: string;
}

export function ChangeUsername() {
  const { user } = useAuth();
  const [newUsername, setNewUsername] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleChangeUsername = async (e: React.FormEvent) => {
    if (!user) return;
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const changeUserInfo = {
        user_id: user.id,
        created_at: new Date().toISOString(),
        username: newUsername,
      };

      const { error: upsertError } = await supabase
        .from("users")
        .upsert([changeUserInfo])
        .select();

      if (upsertError) throw upsertError;

      console.log("Successfully changed username.");
    } catch (error) {
      console.error("Error while trying to update row.", error);
      setError("Error encountered while trying to update username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Change Username</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Username</DialogTitle>
          <DialogDescription>
            Enter your new Username. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              // defaultValue="Pedro Duarte"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              defaultValue="@peduarte"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}