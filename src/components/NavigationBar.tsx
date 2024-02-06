import { NavLink } from "react-router-dom";

export const NavigationBar = () => {
        return (
            <nav className="flex justify-between px-8 relative top-env(safe-area-inset-top) items-center">
                    <ul className="flex">
                            <li className="mr-4">
                                    <NavLink to="/">
                                            <h1 className="btn-secondary">
                                                    Home
                                            </h1>
                                    </NavLink>
                            </li>
                            <li className="mr-4">
                                    <NavLink to="/app/dashboard">
                                            <h1 className="btn-secondary">
                                                    Dashboard
                                            </h1>
                                    </NavLink>
                            </li>
                    </ul>
                    <ul>
                            <li className="mr-4">
                                    <NavLink to="/app/user">
                                            <h1 className="btn-secondary">
                                                    User
                                            </h1>
                                    </NavLink>
                            </li>
                    </ul>
            </nav>
        )
}

export default NavigationBar;