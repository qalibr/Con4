import { NavLink } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle.tsx";
import { Button } from "@/components/ui/button.tsx";
import Login from "@/confourComponents/Login.tsx";
import React from "react";
import OnlineTracker from "@/confourComponents/auth/online-tracker.tsx";
import CreateGame from "@/confourComponents/multiplayer/create-game.tsx";

export const Nav = () => {
  return (
    <nav className="flex justify-between px-8 relative top-env(safe-area-inset-top) items-center">
      <ul className="flex">
        <li className="mr-4">
          <NavLink to="/">
            <Button>Home</Button>
          </NavLink>
        </li>
        <li className="mr-4">
          <NavLink to="/app/dashboard">
            <Button>Dashboard</Button>
          </NavLink>
        </li>
        <li className="mr-4">
          {/* Create a game room... */}
          <CreateGame />
        </li>
      </ul>
      <ul className="flex items-center">
        <li className="mr-4">{OnlineTracker()}</li>

        <li className="mr-4">
          <Login />
        </li>

        <li className="mr-4">
          <ModeToggle />
        </li>
      </ul>
    </nav>
  );
};

export default Nav;
