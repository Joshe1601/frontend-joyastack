import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import SlicePage from "./components/SlicePage.jsx";
import TopologyEditor from "./components/TopologyEditor";
import LogsPage from "./components/LogsPage";
import NavBar from "./components/NavBar";

const App = () => {
    const [view, setView] = useState("login");
    const [token, setToken] = useState(null);
    const [username, setUsername] = useState(null);
    const [role, setRole] = useState(null);
    const [selectedSlice, setSelectedSlice] = useState(null);

    useEffect(() => {
        const savedToken = sessionStorage.getItem("authToken");
        const savedUsername = sessionStorage.getItem("username");
        const savedRole = sessionStorage.getItem("role");
        if (savedToken && savedUsername && savedRole) {
            setToken(savedToken);
            setUsername(savedUsername);
            setRole(savedRole);
            setView("slice");
        }
    }, []);

    const handleLogout = () => {
        sessionStorage.clear();
        setToken(null);
        setUsername(null);
        setRole(null);
        setView("login");
    };

    const handleLoginSuccess = (newToken, user, userRole) => {
        sessionStorage.setItem("authToken", newToken);
        sessionStorage.setItem("username", user);
        sessionStorage.setItem("role", userRole);

        setToken(newToken);
        setUsername(user);
        setRole(userRole);
        setView("slice");
    };

    const handleEditSliceTemplate = (slice) => {
        setSelectedSlice(slice);
        console.log("Editing slice template:", slice);
        setView("editor");
    };

    if (view === "login") {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar
                username={username}
                role={role}
                onLogout={handleLogout}
                currentView={view}
                onNavigate={setView}
            />

            {view === "slice" && (
                <SlicePage
                    token={token}
                    username={username}
                    role={role}
                    onOpenEditor={() => setView("editor")}
                    onEditSliceTemplate={handleEditSliceTemplate}
                />
            )}
            {view === "logs" && <LogsPage token={token} />}
            {view === "editor" && role === "admin" && (
                <TopologyEditor token={token} username={username} editableSlice={selectedSlice}/>
            )}
        </div>
    );
};

export default App;