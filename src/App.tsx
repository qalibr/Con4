import { Outlet } from 'react-router-dom'
import './App.css';

function App() {
        return (
            <div style={{margin: "0 1rem 0 1rem", paddingTop: "env(safe-area-inset-top)"}}>
                    <Outlet></Outlet> {/* Outlet wraps around the rest of our components in index.js */}
            </div>
        );
}

export default App
