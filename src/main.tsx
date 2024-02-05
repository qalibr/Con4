import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import Home from "./routes/Home.tsx";
import Dashboard from "./routes/Dashboard";
import Login from "./routes/Login.tsx";
import NavigationBar from "./components/NavigationBar.tsx";

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
            <BrowserRouter>
                    <NavigationBar/>
                    <Routes>
                            <Route path='/' element={<App/>}>
                                    {/* Home.tsx set as home right now, prompt for login. */}
                                    <Route path="" element={<Home/>}></Route>

                                    {/* Navigation for other pages here. */}
                                    <Route path="/app/dashboard" element={<Dashboard/>}></Route>
                                    <Route path="/login" element={<Login/>}></Route>

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