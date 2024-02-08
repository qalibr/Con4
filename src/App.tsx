import { Outlet } from 'react-router-dom'
import { ThemeProvider } from "@/components/theme-provider.tsx";
import './App.css';

function App() {
        return (
                    <Outlet></Outlet>
        );
}

export default App
