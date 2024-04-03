import useAuth from "@/confourHooks/useAuth.tsx";
import Queue from "@/confourComponents/multiplayer/Queue.tsx";
import Match from "@/confourComponents/multiplayer/Match.tsx";

function HomePage() {
  const { user } = useAuth();
  return (
    <>
      {user ? (
        <div>
          <Queue />
          <Match />
        </div>
      ) : (
        // <Game />
        <p>Login for multiplayer</p>
      )}
    </>
  );
}

export default HomePage;
