import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import authService from '../../services/authService';

const Navbar = () => {
    const [user, setUser] = useState({ fullName: 'Partner' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authService.getPartnerProfile();
                if (response.success && response.partner) {
                    setUser(response.partner);
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            }
        };

        fetchProfile();
    }, []);

    const handleLogout = () => {
        authService.logout();
    };

    return (
        <nav className="bg-white shadow px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Left Side: Logo/Company Name */}
                <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-gray-800">Urban Partner</span>
                </div>

                {/* Right Side: Profile Dropdown */}
                <div className="flex items-center space-x-4">
                    <Menu as="div" className="relative inline-block text-left">
                        <div>
                            <Menu.Button className="flex items-center space-x-2 focus:outline-none">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-100 hover:border-blue-500 transition-colors">
                                    {user.items ? (
                                        <img src={user.image} alt={user.fullName} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-lg font-bold text-gray-600">{user.fullName.charAt(0)}</span>
                                    )}
                                </div>
                                <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                            </Menu.Button>
                        </div>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                <div className="px-4 py-3">
                                    <p className="text-sm text-gray-900 font-medium">Welcome, {user.fullName}</p>
                                    <p className="text-xs text-gray-500 mt-1">Partner</p>
                                </div>
                                <div className="px-1 py-1 ">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <Link
                                                to="/settings"
                                                className={`${active ? 'bg-blue-500 text-white' : 'text-gray-900'
                                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                            >
                                                <Cog6ToothIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                                                Settings
                                            </Link>
                                        )}
                                    </Menu.Item>
                                </div>
                                <div className="px-1 py-1">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={handleLogout}
                                                className={`${active ? 'bg-red-500 text-white' : 'text-gray-900'
                                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                            >
                                                <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                                                Logout
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
