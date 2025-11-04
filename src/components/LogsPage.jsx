import React, { useEffect, useState } from "react";
import {AlertCircle, Plus} from "lucide-react";

const LogsPage = ({ token }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:8001/logs", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Error al cargar logs");
            const data = await res.json();
            setLogs(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Logs</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex gap-2 mb-4">
                    <AlertCircle className="text-red-600" />
                    <span className="text-red-700">{error}</span>
                </div>
            )}

            {loading ? (
                <p className="text-gray-500">Cargando logs...</p>
            ) : logs.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-gray-500 mb-4">No hay logs disponibles.</div>
                </div>            ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {logs.map((log, idx) => (
                        <div
                            key={idx}
                            className="border-l-4 border-blue-400 bg-blue-50 p-3 rounded-r"
                        >
                            <p className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleString("es-PE")}
                            </p>
                            <p className="text-gray-800 text-sm font-semibold">
                                {log.message}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LogsPage;