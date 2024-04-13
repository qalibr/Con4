import useAuth from "@/confourHooks/useAuth.tsx";
import Multiplayer from "@/confourComponents/game/Multiplayer.tsx";
import Hamburger from "@/confourComponents/Hamburger.tsx";
import { ModeToggle } from "@/components/mode-toggle.tsx";

function HomePage() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col h-screen">
      <div className="p-4">
        {/* Hamburger menu for login and other stuff */}
        <Hamburger />
      </div>
      <div className="flex-grow flex items-center justify-center">
        {user ? <Multiplayer /> : <p>Login for multiplayer</p>}
      </div>
      <div className="p-4 self-start mt-auto">
        {/* Light/Dark mode */}
        <ModeToggle />
      </div>
    </div>
  );
}

export default HomePage;
