import useAuth from "@/confourHooks/useAuth.tsx";
import MultiplayerScreen from "@/confourComponents/MultiplayerScreen.tsx";
import Menu from "@/confourComponents/Menu.tsx";
import { ModeToggle } from "@/components/mode-toggle.tsx";
import { LoginScreen } from "@/confourComponents/LoginScreen.tsx";

function HomePage() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col overflow-hidden">
      <div className="px-4 pt-4 flex-none">
        {/* Menu menu for login and other stuff */}
        <ul className="flex items-center">
          <li className="m-2">
            <Menu />
          </li>
          <li className="m-2">
            <ModeToggle />
          </li>
        </ul>
      </div>
      <div className="flex-grow flex items-center justify-center">
        {user ? <MultiplayerScreen /> : (
            <LoginScreen/>
        )}
      </div>
    </div>
  );
}

export default HomePage;
