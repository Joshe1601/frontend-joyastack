import React from "react";
import { LogOut, Database, FileText, Network } from "lucide-react";

const NavBar = ({ username, role, onLogout, currentView, onNavigate }) => {
    const navItem = (label, view, icon) => (
        <button
            onClick={() => onNavigate(view)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition ${
                currentView === view
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-blue-100"
            }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800 flex">
                    <img src="/joyastack.png" alt="logo" className="w-10"/>
                    JoyaStack
                </h1>
                <div className="flex items-center gap-3">
                    {navItem("Slice", "slice", <Database size={18} />)}
                    {navItem("Logs", "logs", <FileText size={18} />)}

                    {role === "admin" &&
                        navItem("Editor", "editor", <Network size={18} />)}

                    <div className="flex items-center gap-2 border-l pl-3 ml-3">
                        <span className="text-gray-700">Bienvenido, <strong>{username}</strong></span>
                        <button
                            onClick={onLogout}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg flex items-center gap-2 transition"
                        >
                            <LogOut size={16} />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;