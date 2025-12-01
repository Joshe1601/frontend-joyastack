import React, { useEffect, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";

const SlicePage = ({ token, username, role, onOpenEditor, onEditSliceTemplate}) => {
    const [slices, setSlices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchSlices();
    }, []);
    const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

    const fetchSlices = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://10.20.12.32:8001/slices", {
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
    const showStatus = (text, type = "info") => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage({ text: "", type: "" }), 5000);
    };

    const deleteSlice = async (sliceId) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este slice? Esta acción no se puede deshacer.")) {
            return;
        }

        try {
            const res = await fetch(
                `http://10.20.12.32:8001/slices/delete/${sliceId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Error al eliminar el slice");

            showStatus("Slice eliminado correctamente", "success");

            // Opcional: redirigir o limpiar el canvas
            setTimeout(() => {
                window.history.back();
            }, 1500);

        } catch (err) {
            console.error(err);
            showStatus("Error al eliminar el slice", "error");
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
                    {statusMessage.text && (
                        <div
                            className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                                statusMessage.type === "success"
                                    ? "bg-green-100 text-green-800"
                                    : statusMessage.type === "error"
                                        ? "bg-red-100 text-red-800"
                                        : statusMessage.type === "warning"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-blue-100 text-blue-800"
                            }`}
                        >
                            {statusMessage.text}
                        </div>
                    )}
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
                            {s.status === "DESPLEGADO" && role === "admin" && (
                                <button
                                    onClick={() => onEditSliceTemplate && onEditSliceTemplate(s)}
                                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
                                >
                                    Ver plantilla
                                </button>
                            )}
                            {s.status === "DESPLEGADO" && role === "admin" && (
                                <button
                                    onClick={async () => {
                                        const ok = await deleteSlice(s.slice_id);
                                        if (ok) {
                                            setSlices(prev => prev.filter(slice => slice.slice_id !== s.slice_id));
                                        }
                                    }}
                                    className="ml-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
                                >
                                    Eliminar slice
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