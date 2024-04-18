import App from "./App.tsx";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import HomePage from "./routes/HomePage.tsx";
import DashboardPage from "./routes/DashboardPage.tsx";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            {/* HomePage acts as landing page with Sign up/Login. */}
            <Route path="" element={<HomePage />}></Route>

            {/* Dashboard, TODO: add statistics and other elements... */}
            <Route path="/dashboard" element={<DashboardPage />}></Route>

            {/* Wildcard in case user ends up in an undefined route. */}
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
