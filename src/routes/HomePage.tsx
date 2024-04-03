import useAuth from "@/confourHooks/useAuth.tsx";
import Multiplayer from "@/confourComponents/game/Multiplayer.tsx";

function HomePage() {
  const { user } = useAuth();
  return (
    <>
      {user ? (
        <div>
          <Multiplayer />
        </div>
      ) : (
        // <Game />
        <p>Login for multiplayer</p>
      )}
    </>
  );
}

export default HomePage;
