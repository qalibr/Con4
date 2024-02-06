import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import HomePage from "./routes/HomePage.tsx";
import DashboardPage from "./routes/DashboardPage.tsx";
import LoginComponent from "./components/LoginComponent.tsx";
import NavigationBar from "./components/NavigationBar.tsx";

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
            <BrowserRouter>
                    <NavigationBar/>
                    <Routes>
                            <Route path='/' element={<App/>}>
                                    {/* HomePage.tsx set as home right now, prompt for login. */}
                                    <Route path="" element={<HomePage/>}></Route>

                                    {/* Navigation for other pages here. */}
                                    <Route path="/app/dashboard" element={<DashboardPage/>}></Route>
                                    <Route path="/app/user" element={<LoginComponent/>}></Route>

                                    {/* Wildcard in case user ends up in an undefined route. */}
                                    {/* TODO: Could make it 404 page? */}
                                    <Route path="*" element={
                                            <main style={{padding: "1rem"}}>
                                                    <p>Empty Space</p>
                                                    <Link to="/">Return to Home</Link>
                                            </main>
                                    }/>
                            </Route>
                    </Routes>
            </BrowserRouter>
    </React.StrictMode>
);