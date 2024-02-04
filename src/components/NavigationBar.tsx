import { Link } from "react-router-dom";
import React from "react";

export const NavigationBar = () => {
        return (
            <nav style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "1rem",
                    position: "relative",
                    top: "env(safe-area-inset-top)",
            }}>
                    <Link to="/">Home</Link>
                    <Link to="/app/dashboard">Dashboard</Link>
            </nav>
        )
}

export default NavigationBar;