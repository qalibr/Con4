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

interface Props {
  onChangeSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;

}

export function ChangeUsername({ onChangeSuccess, isOpen, onClose }: Props): JSX.Element {
  const { user } = useAuth();
  const [newUsername, setNewUsername] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleChangeUsername = async (e: React.FormEvent) => {
    if (!user) return;
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log("Hello");

    try {
      const changeUserInfo: UserEntry = {
        user_id: user.id,
        created_at: new Date().toISOString(),
        username: newUsername,
      };

      const { error: upsertError } = await supabase
        .from("users")
        .upsert(changeUserInfo)
        .select();

      if (upsertError) throw upsertError;

      console.log("Successfully changed username.");
      onChangeSuccess();
    } catch (error) {
      console.error("Error while trying to update row.", error);
      setError("Error encountered while trying to update username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/*<DialogTrigger asChild>*/}
      {/*  <Button variant="outline">Change Username</Button>*/}
      {/*</DialogTrigger>*/}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Username</DialogTitle>
          <DialogDescription>
            Enter your new Username. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleChangeUsername}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading}>
            Save changes
          </Button>
        </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
}
