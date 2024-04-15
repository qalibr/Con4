import useAuth from "@/confourHooks/useAuth.tsx";
import Multiplayer from "@/confourComponents/game/Multiplayer.tsx";
import Hamburger from "@/confourComponents/Hamburger.tsx";
import { ModeToggle } from "@/components/mode-toggle.tsx";
import Login from "@/confourComponents/Login.tsx";
import { LandingPage } from "@/confourComponents/LandingPage.tsx";

function HomePage() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col overflow-hidden">
      <div className="px-4 pt-4 flex-none">
        {/* Hamburger menu for login and other stuff */}
        <ul className="flex items-center">
          <li className="m-2">
            <Hamburger />
          </li>
          <li className="m-2">
            <ModeToggle />
          </li>
        </ul>
      </div>
      <div className="flex-grow flex items-center justify-center">
        {user ? <Multiplayer /> : (
            <LandingPage/>
        )}
      </div>
    </div>
  );
}

export default HomePage;
