import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import HomePage from "./routes/HomePage.tsx";
import DashboardPage from "./routes/DashboardPage.tsx";
import Nav from "./confourComponents/Nav.tsx";
import GamePage from "@/routes/GamePage.tsx";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<App />}>
            {/* HomePage.tsx set as home right now, prompt for login. */}
            <Route path="" element={<HomePage />}></Route>

            {/* Navigation for other pages here. */}
            <Route path="/app/dashboard" element={<DashboardPage />}></Route>

            <Route path="/game/:gameId" element={<GamePage />} />

            {/* Wildcard in case user ends up in an undefined route. */}
            {/* TODO: Could make it 404 page? */}
            <Route
              path="*"
              element={
                <main style={{ padding: "1rem" }}>
                  <p>Empty Space</p>
                  <Link to="/">Return to Home</Link>
                </main>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
