import { NavLink } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle.tsx";
import { Button } from "@/components/ui/button.tsx";

export const NavigationBar = () => {
        return (
            <nav className="flex justify-between px-8 relative top-env(safe-area-inset-top) items-center">
                    <ul className="flex">
                            <li className="mr-4">
                                    <NavLink to="/">
                                            <Button>
                                                    Home
                                            </Button>
                                    </NavLink>
                            </li>
                            <li className="mr-4">
                                    <NavLink to="/app/dashboard">
                                            <Button>
                                                    Dashboard
                                            </Button>
                                    </NavLink>
                            </li>
                    </ul>
                    <ul className="flex justify-between px-8 relative top-env(safe-area-inset-top) items-center">
                            <li className="mr-4">
                                    <NavLink to="/app/user">
                                            <Button>
                                                    User
                                            </Button>
                                    </NavLink>
                            </li>

                            <li className="mr-4">
                                    <ModeToggle/>
                            </li>
                    </ul>
            </nav>
        )
}

export default NavigationBar;