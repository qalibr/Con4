import GameComponent from "../confourComponents/GameComponent.tsx";
import MultiplayerGameComponent from "@/confourComponents/multiplayer/MultiplayerGameComponent.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";
import Lobby from "@/confourComponents/multiplayer/lobby.tsx";

/// Game is available to guests and users. Guests need to log in to be able to play multiplayer.
function HomePage() {
  const { user } = useAuth();
  return (
    <>
      {user ? (
        <div>
          <MultiplayerGameComponent />
          <Lobby />
        </div>
      ) : (
        <GameComponent />
      )}
    </>
  );
}

export default HomePage;
