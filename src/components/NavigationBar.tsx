import { useState } from "react";
import { Fragment } from "react";
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { NavLink } from "react-router-dom";

export const NavigationBar = () => {
        return (
            <nav className="flex justify-between px-8 relative border-b-2 top-env(safe-area-inset-top) items-center">
                    <ul className="flex">
                            <li className="mr-4">
                                    <NavLink
                                        to="/"
                                        className={({isActive}) => isActive ?
                                            'text-2xl text-gray-50 font font-bold' :
                                            'text-gray-400 font-bold text-2xl'}
                                    >
                                            <h1>Home</h1>
                                    </NavLink>
                            </li>
                            <li className="mr-4">
                                    <NavLink
                                        to="/app/dashboard"
                                        className={({isActive}) => isActive ?
                                            'text-2xl text-gray-50 font font-bold' :
                                            'text-gray-400 font-bold text-2xl'}
                                    >
                                            <h1>Dashboard</h1>
                                    </NavLink>
                            </li>
                    </ul>
                    <ul>
                            <li className="mr-4">
                                    <NavLink
                                        to="/app/user"
                                        className="text-2xl text-gray-400 font-bold hover:text-gray-50"
                                    >
                                            <h1>User</h1>
                                    </NavLink>
                            </li>
                    </ul>
            </nav>
        )
}

export default NavigationBar;