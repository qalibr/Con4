import GameComponent from "../confourComponents/GameComponent.tsx";
import MultiplayerGameComponent from "@/confourComponents/multiplayer/MultiplayerGameComponent.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";

/// Game is available to guests and users. Guests need to login to record stats and other...
function HomePage() {
  const { user } = useAuth();
  return (
    <>
      {user ? (
        <div>
          <MultiplayerGameComponent />
        </div>
      ) : (
        <GameComponent />
      )}
    </>
  );
}

export default HomePage;
