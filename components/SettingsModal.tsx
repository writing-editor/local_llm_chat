import React, { useState, useEffect } from 'react';
import { localLlmService } from '../services/localLlmService';
import { Persona } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUrl: string;
    currentModel: string;
    onSave: (newUrl: string, newModel: string) => void;
    onClearChatHistory: () => void;
    currentPersonas: Persona[];
    onSavePersonas: (personas: Persona[]) => void;
}

// --- ICON COMPONENTS (Required by getStatusIndicator) ---
const CheckCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const ExclamationCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUrl, currentModel, onSave, onClearChatHistory, currentPersonas, onSavePersonas }) => {
    // State for Ollama settings
    const [url, setUrl] = useState(currentUrl);
    const [model, setModel] = useState(currentModel);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // State for Persona management
    const [managedPersonas, setManagedPersonas] = useState<Persona[]>(currentPersonas);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

    const selectedPersona = managedPersonas.find(p => p.id === selectedPersonaId);

    useEffect(() => {
        if (isOpen) {
            setUrl(currentUrl);
            setModel(currentModel);
            setTestStatus('idle');
            setErrorMessage('');
            setManagedPersonas(currentPersonas);
            setSelectedPersonaId(currentPersonas.length > 0 ? currentPersonas[0].id : null);
        }
    }, [isOpen, currentUrl, currentModel, currentPersonas]);

    const handleTest = async () => {
        setTestStatus('testing');
        setErrorMessage('');
        const service = localLlmService;
        const originalUrl = service.getUrl();
        service.setUrl(url);
        const result = await service.testConnection();
        service.setUrl(originalUrl);

        if (result.success) {
            setTestStatus('success');
        } else {
            setTestStatus('error');
            setErrorMessage(result.error || 'An unknown error occurred.');
        }
    };

    // --- THIS IS THE MISSING FUNCTION ---
    const getStatusIndicator = () => {
        switch (testStatus) {
            case 'testing':
                return (
                    <div className="flex items-center gap-2 text-gray-600">
                        <LoadingSpinner /> <span>Testing connection...</span>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircleIcon /> <span>Connection successful!</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-2 text-red-600">
                        <ExclamationCircleIcon /> <span>{errorMessage}</span>
                    </div>
                );
            default:
                return <div className="h-5"></div>; // Placeholder for alignment
        }
    };
    // ------------------------------------

    const handleSaveChanges = () => {
        onSave(url, model);
        onSavePersonas(managedPersonas);
        onClose();
    };

    const handlePersonaFieldChange = (field: keyof Persona, value: string) => {
        if (!selectedPersonaId) return;
        setManagedPersonas(managedPersonas.map(p => 
            p.id === selectedPersonaId ? { ...p, [field]: value } : p
        ));
    };

    const handleAddNewPersona = () => {
        const newPersona: Persona = {
            id: `persona-${Date.now()}`,
            name: 'New Persona',
            prompt: 'You are a helpful assistant.',
            placeholder: 'Ask me anything...',
        };
        setManagedPersonas([...managedPersonas, newPersona]);
        setSelectedPersonaId(newPersona.id);
    };
    
    const handleDeletePersona = () => {
        if (selectedPersonaId && window.confirm(`Are you sure you want to delete "${selectedPersona?.name}"?`)) {
            const remaining = managedPersonas.filter(p => p.id !== selectedPersonaId);
            setManagedPersonas(remaining);
            setSelectedPersonaId(remaining.length > 0 ? remaining[0].id : null);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-4xl text-gray-900 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-6 pb-4 flex-shrink-0 border-b border-gray-200">
                    <h2 className="text-xl font-bold">Settings & Personas</h2>
                </header>

                <main className="flex-1 flex flex-row overflow-hidden">
                    <div className="w-1/3 border-r border-gray-200 p-4 space-y-2 overflow-y-auto">
                        <h3 className="text-md font-semibold text-gray-700 mb-2">Personas</h3>
                        {managedPersonas.map(p => (
                            <div key={p.id} onClick={() => setSelectedPersonaId(p.id)}
                                className={`p-2 rounded-md cursor-pointer ${selectedPersonaId === p.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                                <p className="font-medium text-sm text-gray-800">{p.name}</p>
                            </div>
                        ))}
                        <button onClick={handleAddNewPersona} className="w-full mt-2 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">
                            + Add New Persona
                        </button>
                    </div>

                    <div className="w-2/3 p-6 space-y-6 overflow-y-auto">
                        {selectedPersona ? (
                            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">Edit Persona</h3>
                                    <button onClick={handleDeletePersona} className="text-sm text-red-600 hover:underline">Delete this persona</button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input type="text" value={selectedPersona.name} onChange={e => handlePersonaFieldChange('name', e.target.value)}
                                        className="w-full bg-gray-100 text-gray-900 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">System Prompt</label>
                                    <textarea value={selectedPersona.prompt} onChange={e => handlePersonaFieldChange('prompt', e.target.value)}
                                        rows={6} className="w-full bg-gray-100 text-gray-900 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 no-scrollbar" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Input Placeholder</label>
                                    <input type="text" value={selectedPersona.placeholder} onChange={e => handlePersonaFieldChange('placeholder', e.target.value)}
                                        className="w-full bg-gray-100 text-gray-900 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 border rounded-lg text-center text-gray-500">
                               <p>Select a persona to edit or add a new one.</p>
                            </div>
                        )}
                        
                        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                             <h3 className="text-lg font-semibold text-gray-800">Ollama Configuration</h3>
                             <div>
                                <label htmlFor="ollama-url" className="block text-sm font-medium text-gray-700">Ollama Base URL</label>
                                <p className="text-xs text-gray-500 mb-2">Enter the address of your Ollama server.</p>
                                <div className="flex gap-2">
                                    <input type="text" id="ollama-url" value={url} onChange={(e) => { setUrl(e.target.value); setTestStatus('idle'); }}
                                        placeholder="http://localhost:11434"
                                        className="flex-grow bg-gray-100 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <button onClick={handleTest} disabled={testStatus === 'testing'}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:bg-gray-200 disabled:cursor-wait">
                                        Test
                                    </button>
                                </div>
                                <div className="text-sm min-h-[20px] mt-2">
                                    {getStatusIndicator()}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="ollama-model" className="block text-sm font-medium text-gray-700">Ollama Model Name</label>
                                <p className="text-xs text-gray-500 mb-2">Enter the name of the model to use (e.g., `phi3:latest`).</p>
                                <input type="text" id="ollama-model" value={model} onChange={(e) => setModel(e.target.value)}
                                    placeholder="phi3:3.8b"
                                    className="w-full bg-gray-100 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div className="p-4 border border-red-200 rounded-lg">
                            <h3 className="text-md font-semibold text-red-700">Danger Zone</h3>
                            <p className="text-xs text-gray-500 mb-3">This action cannot be undone.</p>
                            <button onClick={onClearChatHistory} className="w-full px-4 py-2 bg-transparent border border-red-500/50 text-red-500 rounded-md hover:bg-red-500/10">
                                Clear All Chat History
                            </button>
                        </div>
                    </div>
                </main>

                <footer className="p-6 pt-4 mt-auto flex-shrink-0 border-t border-gray-200 bg-white">
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSaveChanges} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save and Close</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};