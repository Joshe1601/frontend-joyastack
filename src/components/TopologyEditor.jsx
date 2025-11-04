import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Plus, Link2, Trash2, Save, Rocket, RefreshCw, X } from "lucide-react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import "vis-network/styles/vis-network.css";

const TopologyEditor = ({ token, username, editableSlice }) => {
    const networkRef = useRef(null);
    const initialTemplateRef = useRef(null);

    // React state
    const [nodes] = useState(() => new DataSet([]));
    const [edges] = useState(() => new DataSet([]));
    const [network, setNetwork] = useState(null);
    const [imagesList, setImagesList] = useState([]);
    const [currentSliceId, setCurrentSliceId] = useState(null);
    const [sliceName, setSliceName] = useState("Nueva Topología");
    const [hasChanges, setHasChanges] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Modal states
    const [showVMModal, setShowVMModal] = useState(false);
    const [vmForm, setVmForm] = useState({
        name: '',
        cpu: 1,
        ram: 256,
        disk: 2,
        image_id: ''
    });
    const [formError, setFormError] = useState('');

    // Status messages
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const container = networkRef.current;
        const net = new Network(
            container,
            { nodes, edges },
            {
                interaction: { multiselect: true },
                physics: {
                    stabilization: { iterations: 100 },
                    barnesHut: { gravitationalConstant: -2000, springConstant: 0.001, springLength: 200 }
                },
                nodes: {
                    shape: 'circle',
                    size: 40,
                    font: { size: 12, color: '#ffffff', face: 'Arial' },
                    borderWidth: 2,
                    color: {
                        border: '#2563eb',
                        background: '#3b82f6',
                        highlight: { border: '#1e40af', background: '#2563eb' }
                    },
                    shadow: { enabled: true, color: 'rgba(0,0,0,0.2)', size: 10, x: 2, y: 2 }
                },
                edges: {
                    width: 2,
                    color: { color: '#94a3b8', highlight: '#2563eb' },
                    smooth: { type: 'continuous', roundness: 0.5 }
                }
            }
        );
        setNetwork(net);
        loadImages();

        // Listener para detectar cambios
        nodes.on('*', trackChanges);
        edges.on('*', trackChanges);

        return () => {
            nodes.off('*', trackChanges);
            edges.off('*', trackChanges);
        };
    }, []);

    useEffect(() => {
        if (editableSlice && editableSlice.template) {
            try {
                const templateData =
                    typeof editableSlice.template === "string"
                        ? JSON.parse(editableSlice.template)
                        : editableSlice.template;

                // Guardar template inicial para comparar cambios
                initialTemplateRef.current = JSON.stringify(templateData);

                // Modo edición
                setIsEditMode(true);
                setCurrentSliceId(editableSlice.slice_id);
                setSliceName(editableSlice.name || "Slice Editado");

                // Limpiar y cargar el grafo desde el template
                nodes.clear();
                edges.clear();

                nodes.add(templateData.nodes.map((n) => ({
                    id: n.label,
                    label: `${n.label}\n${n.cpu}vCPU / ${n.ram}MB / ${n.disk}GB`,
                    cpu: n.cpu,
                    ram: n.ram,
                    disk: n.disk,
                    image_id: n.image_id,
                })));

                edges.add(templateData.links.map((e) => ({
                    from: e.from_vm,
                    to: e.to_vm,
                })));

                setHasChanges(false);
                showStatus(`Editando: ${editableSlice.name}`, 'info');
            } catch (err) {
                console.error("Error al cargar plantilla:", err);
                showStatus("Error al cargar la plantilla", 'error');
            }
        }
    }, [editableSlice]);

    const trackChanges = () => {
        if (isEditMode && initialTemplateRef.current) {
            const currentTemplate = JSON.stringify(getCurrentTemplate());
            setHasChanges(currentTemplate !== initialTemplateRef.current);
        } else {
            setHasChanges(nodes.length > 0);
        }
    };

    const getCurrentTemplate = () => {
        return {
            nodes: nodes.get().map((n) => ({
                label: n.id,
                cpu: n.cpu,
                ram: n.ram,
                disk: n.disk,
                image_id: n.image_id,
            })),
            links: edges.get().map((e) => ({
                from_vm: e.from,
                to_vm: e.to,
            })),
        };
    };

    const showStatus = (text, type = 'info') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage({ text: '', type: '' }), 5000);
    };

    const loadImages = async () => {
        try {
            const res = await fetch("http://localhost:8001/images", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Error al cargar imágenes");
            const data = await res.json();
            setImagesList(data.images || []);
        } catch (err) {
            console.error(err);
            showStatus("No se pudieron cargar las imágenes", 'error');
        }
    };

    const openVMModal = () => {
        if (!imagesList.length) {
            showStatus("No hay imágenes disponibles", 'error');
            return;
        }
        setVmForm({
            name: `VM${nodes.length + 1}`,
            cpu: 1,
            ram: 256,
            disk: 2,
            image_id: imagesList[0]?.id || ''
        });
        setFormError('');
        setShowVMModal(true);
    };

    const handleVMFormChange = (field, value) => {
        setVmForm(prev => ({ ...prev, [field]: value }));
        setFormError('');
    };

    const addVM = () => {
        // Validaciones
        if (!vmForm.name.trim()) {
            setFormError('El nombre de la VM es requerido');
            return;
        }

        // Validar ID duplicado
        const existingNode = nodes.get(vmForm.name);
        if (existingNode) {
            setFormError('Ya existe una VM con este nombre. Por favor usa otro nombre.');
            return;
        }

        if (vmForm.cpu < 1 || vmForm.ram < 256 || vmForm.disk < 1) {
            setFormError('Los recursos deben ser valores válidos (CPU≥1, RAM≥256, Disco≥1)');
            return;
        }



        const selectedImage = imagesList.find(img => img.id === parseInt(vmForm.image_id));
        console.log('Selected image object:', selectedImage);
        console.log('VM Form data:', vmForm);
        console.log()
        if (!selectedImage) {
            setFormError('Selecciona una imagen válida');
            return;
        }

        nodes.add({
            id: vmForm.name,
            label: `${vmForm.name}\n${vmForm.cpu}vCPU / ${vmForm.ram}MB / ${vmForm.disk}GB`,
            cpu: vmForm.cpu,
            ram: vmForm.ram,
            disk: vmForm.disk,
            image_id: vmForm.image_id,
        });

        setShowVMModal(false);
        showStatus(`VM "${vmForm.name}" agregada correctamente`, 'success');
    };

    const connectVMs = () => {
        if (!network) return;
        const selected = network.getSelectedNodes();
        if (selected.length === 2) {
            // Verificar si ya existe la conexión
            const existingEdge = edges.get({
                filter: (edge) =>
                    (edge.from === selected[0] && edge.to === selected[1]) ||
                    (edge.from === selected[1] && edge.to === selected[0])
            });

            if (existingEdge.length > 0) {
                showStatus("Estas VMs ya están conectadas", 'warning');
                return;
            }

            edges.add({ from: selected[0], to: selected[1] });
            showStatus("VMs conectadas correctamente", 'success');
        } else {
            showStatus("Selecciona exactamente dos VMs para conectar", 'warning');
        }
    };

    const deleteVM = () => {
        if (!network) return;
        const selected = network.getSelectedNodes();
        if (selected.length === 0) {
            showStatus("Selecciona al menos una VM para eliminar", 'warning');
            return;
        }
        selected.forEach((id) => nodes.remove(id));
        showStatus(`${selected.length} VM(s) eliminada(s)`, 'success');
    };

    const clearAll = () => {
        nodes.clear();
        edges.clear();
        setCurrentSliceId(null);
        setSliceName("Nueva Topología");
        setHasChanges(false);
        setIsEditMode(false);
        initialTemplateRef.current = null;
        showStatus("Topología limpiada", 'info');
    };

    const saveSlice = async () => {
        if (nodes.length === 0) {
            showStatus("No hay VMs en la topología", 'warning');
            return;
        }

        const payload = {
            name: sliceName,
            ...getCurrentTemplate()
        };

        try {
            let res;
            if (isEditMode && currentSliceId) {
                // Actualizar slice existente
                res = await fetch(`http://localhost:8001/slices/update/${currentSliceId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                // Crear nuevo slice
                res = await fetch("http://localhost:8001/slices/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) throw new Error("Error HTTP: " + res.status);
            const data = await res.json();

            if (!isEditMode) {
                setCurrentSliceId(data.slice_id);
                setIsEditMode(true);
            }

            // Actualizar template inicial
            initialTemplateRef.current = JSON.stringify(getCurrentTemplate());
            setHasChanges(false);

            showStatus(
                isEditMode
                    ? `Slice actualizado correctamente`
                    : `Slice creado correctamente (ID: ${data.slice_id})`,
                'success'
            );
        } catch (err) {
            console.error(err);
            showStatus("Error al guardar el slice", 'error');
        }
    };

    const deploySlice = async () => {
        if (!currentSliceId) {
            showStatus("Primero guarda el slice", 'warning');
            return;
        }

        if (hasChanges) {
            showStatus("Hay cambios sin guardar. Guarda antes de desplegar.", 'warning');
            return;
        }

        try {
            const res = await fetch(
                `http://localhost:8001/slices/deploy/${currentSliceId}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Error durante el despliegue");
            showStatus("Despliegue iniciado correctamente", 'success');
        } catch (err) {
            console.error(err);
            showStatus("Error al desplegar el slice", 'error');
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Panel lateral */}
            <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto shadow-lg">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-blue-600 mb-6 font-semibold hover:text-blue-700 transition"
                >
                    <ChevronLeft size={20} /> Volver
                </button>

                <h2 className="text-2xl font-bold mb-2 text-gray-800">
                    {isEditMode ? "Editar Topología" : "Nueva Topología"}
                </h2>

                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre del Slice
                    </label>
                    <input
                        type="text"
                        value={sliceName}
                        onChange={(e) => {
                            setSliceName(e.target.value);
                            setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Topología Web"
                    />
                </div>

                {statusMessage.text && (
                    <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                        statusMessage.type === 'success' ? 'bg-green-100 text-green-800' :
                            statusMessage.type === 'error' ? 'bg-red-100 text-red-800' :
                                statusMessage.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                    }`}>
                        {statusMessage.text}
                    </div>
                )}

                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
                        Acciones
                    </h3>

                    <button
                        onClick={openVMModal}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition shadow-sm"
                    >
                        <Plus size={18} /> Agregar VM
                    </button>

                    <button
                        onClick={connectVMs}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition shadow-sm"
                    >
                        <Link2 size={18} /> Conectar VMs
                    </button>

                    <button
                        onClick={deleteVM}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition shadow-sm"
                    >
                        <Trash2 size={18} /> Eliminar VM
                    </button>

                    <button
                        onClick={clearAll}
                        className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition shadow-sm"
                    >
                        <RefreshCw size={18} /> Limpiar Todo
                    </button>

                    <div className="border-t border-gray-200 my-4"></div>

                    <button
                        onClick={saveSlice}
                        disabled={!hasChanges}
                        className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition shadow-sm ${
                            hasChanges
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        <Save size={18} /> {isEditMode ? 'Guardar Cambios' : 'Guardar Slice'}
                    </button>

                    <button
                        onClick={deploySlice}
                        disabled={!currentSliceId || hasChanges}
                        className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition shadow-sm ${
                            currentSliceId && !hasChanges
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        <Rocket size={18} /> Desplegar Slice
                    </button>
                </div>

                <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                    <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Estado</h4>
                    <div className="text-sm text-gray-700">
                        <p><span className="font-semibold">VMs:</span> {nodes.length}</p>
                        <p><span className="font-semibold">Conexiones:</span> {edges.length}</p>
                        <p><span className="font-semibold">Modo:</span> {isEditMode ? 'Edición' : 'Creación'}</p>
                        {currentSliceId && (
                            <p><span className="font-semibold">ID:</span> {currentSliceId}</p>
                        )}
                        {hasChanges && (
                            <p className="text-orange-600 font-semibold mt-2">● Cambios sin guardar</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Área del grafo */}
            <div className="flex-1 p-8">
                <div className="bg-white rounded-xl shadow-lg h-full p-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        Canvas de Topología
                    </h3>
                    <div
                        ref={networkRef}
                        className="w-full h-[calc(100%-3rem)] border-2 border-gray-200 rounded-lg"
                    ></div>
                </div>
            </div>

            {/* Modal para agregar VM */}
            {showVMModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Agregar Nueva VM</h3>
                            <button
                                onClick={() => setShowVMModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                                {formError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Nombre de la VM *
                                </label>
                                <input
                                    type="text"
                                    value={vmForm.name}
                                    onChange={(e) => handleVMFormChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: VM1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    CPU (vCores) *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={vmForm.cpu}
                                    onChange={(e) => handleVMFormChange('cpu', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    RAM (MB) *
                                </label>
                                <input
                                    type="number"
                                    min="256"
                                    step="256"
                                    value={vmForm.ram}
                                    onChange={(e) => handleVMFormChange('ram', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Disco (GB) *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={vmForm.disk}
                                    onChange={(e) => handleVMFormChange('disk', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Imagen del Sistema *
                                </label>
                                <select
                                    value={vmForm.image_id}
                                    onChange={(e) => handleVMFormChange('image_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {imagesList.map((img) => (
                                        <option key={img.id} value={img.id}>
                                            {img.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowVMModal(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={addVM}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopologyEditor;