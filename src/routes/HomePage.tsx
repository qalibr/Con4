import Game from "../confourComponents/Game.tsx";
import useAuth from "@/confourHooks/useAuth.tsx";
import Lobby from "@/confourComponents/multiplayer/lobby.tsx";
import Queue from "@/confourComponents/multiplayer/Queue.tsx";
import GameInstance from "@/confourComponents/multiplayer/game-instance.tsx";

/// Game is available to guests and users. Guests need to log in to be able to play multiplayer.
function HomePage() {
  const { user } = useAuth();
  return (
    <>
      {user ? (
        <div>
          {/*<Lobby />*/}
          <Queue />
          {/*<GameInstance />*/}
        </div>
      ) : (
        <Game />
      )}
    </>
  );
}

export default HomePage;
