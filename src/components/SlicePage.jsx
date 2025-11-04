import React, { useEffect, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";

const SlicePage = ({ token, username, role, onOpenEditor, onEditSliceTemplate}) => {
    const [slices, setSlices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchSlices();
    }, []);

    const fetchSlices = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:8001/slices", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Error al cargar slices");
            const data = await res.json();
            setSlices(data.slices || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
                Slices
            </h2>

            {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex gap-2 mb-4">
                    <AlertCircle className="text-red-600" />
                    <span className="text-red-700">{error}</span>
                </div>
            )}

            {loading ? (
                <p className="text-gray-600">Cargando slices...</p>
            ) : slices.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-gray-500 mb-4">No tienes slices creados.</div>
                    {role === "admin" && (
                        <button
                            onClick={() => onOpenEditor && onOpenEditor()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition inline-flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Crear tu primer slice
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-5">
                    {slices.map((s) => (
                        <div
                            key={s.slice_id}
                            className="bg-white rounded-lg shadow p-5 border border-gray-200"
                        >
                            <h3 className="font-bold text-xl">{s.name}</h3>
                            <p className="text-gray-500 text-sm mb-2">
                                Nombre: {s.slice_name} · ID: {s.slice_id} · {s.status}
                            </p>
                            <p className="text-gray-700 text-sm">
                                Creado el {new Date(s.created_at).toLocaleDateString("es-PE")}
                            </p>
                            {s.status === "PENDIENTE" && role === "admin" && (
                                <button
                                    onClick={() => onEditSliceTemplate && onEditSliceTemplate(s)}
                                    className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
                                >
                                    Editar plantilla
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SlicePage;