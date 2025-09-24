import React, { useState, useEffect } from 'react';
import { localLlmService } from '../services/localLlmService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUrl: string;
    currentModel: string;
    currentSystemPrompt: string; 
    onSave: (newUrl: string, newModel: string, newPrompt: string) => void;
    onClearHistory: () => void;
}

const CheckCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const ExclamationCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUrl, currentModel, currentSystemPrompt, onSave, onClearHistory }) => {
    const [url, setUrl] = useState(currentUrl);
    const [model, setModel] = useState(currentModel);
    const [prompt, setPrompt] = useState(currentSystemPrompt); // <-- ADD STATE FOR PROMPT INPUT
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUrl(currentUrl);
            setModel(currentModel);
            setPrompt(currentSystemPrompt); // <-- SYNC STATE ON OPEN
            setTestStatus('idle');
            setErrorMessage('');
        }
    }, [isOpen, currentUrl, currentModel, currentSystemPrompt]); // <-- ADD DEPENDENCY

    if (!isOpen) return null;

    const handleTest = async () => {
        setTestStatus('testing');
        setErrorMessage('');
        const service = localLlmService;
        const originalUrl = service.getUrl();
        service.setUrl(url);
        const result = await service.testConnection();
        service.setUrl(originalUrl); // Revert to not affect current operations if user cancels

        if (result.success) {
            setTestStatus('success');
        } else {
            setTestStatus('error');
            setErrorMessage(result.error || 'An unknown error occurred.');
        }
    };

    const handleSave = () => {
        onSave(url, model, prompt);
        onClose();
    };

    const getStatusIndicator = () => {
        switch (testStatus) {
            case 'testing':
                return <div className="flex items-center gap-2"><LoadingSpinner /> <span>Testing...</span></div>;
            case 'success':
                return <div className="flex items-center gap-2"><CheckCircleIcon /> <span>Connection successful!</span></div>;
            case 'error':
                return <div className="flex items-center gap-2 text-red-400"><ExclamationCircleIcon /> <span>{errorMessage}</span></div>;
            default:
                return <div className="h-5"></div>; // Placeholder for alignment
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-md text-gray-900 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <header className="p-6 pb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold">Settings</h2>
                </header>
                
                {/* Scrollable Content Area */}
                <main className="overflow-y-auto px-6">
                    <div className="space-y-4">
                        {/* Ollama URL Input */}
                        <div>
                            <label htmlFor="ollama-url" className="block text-sm font-medium text-gray-700">
                                Ollama Base URL
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Enter the address of your Ollama server.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    id="ollama-url"
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value)
                                        setTestStatus('idle');
                                    }}
                                    placeholder="http://localhost:11434"
                                    className="flex-grow bg-gray-100 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                />
                                <button
                                    onClick={handleTest}
                                    disabled={testStatus === 'testing'}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:bg-gray-200 disabled:cursor-wait transition-colors"
                                >
                                    Test
                                </button>
                            </div>
                            <div className="text-sm min-h-[20px] mt-2">
                                {getStatusIndicator()}
                            </div>
                        </div>

                        {/* Ollama Model Input */}
                        <div>
                            <label htmlFor="ollama-model" className="block text-sm font-medium text-gray-700">
                                Ollama Model Name
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Enter the name of the model to use (e.g., `phi3:latest`).
                            </p>
                            <input
                                type="text"
                                id="ollama-model"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="phi3:3.8b"
                                className="w-full bg-gray-100 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                            />
                        </div>

                        {/* System Prompt Input */}
                        <div>
                            <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-700">
                                System Prompt / Persona
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Define the AI's role, tone, and instructions.
                            </p>
                            <textarea
                                id="system-prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., You are a helpful assistant..."
                                rows={4}
                                className="w-full bg-gray-100 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 no-scrollbar"
                            />
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="mt-6 py-4 border-t border-gray-200">
                        <h3 className="text-md font-semibold text-gray-700">Danger Zone</h3>
                        <p className="text-xs text-gray-500 mb-3">This action cannot be undone.</p>
                        <button
                            onClick={onClearHistory}
                            className="w-full px-4 py-2 bg-transparent border border-red-500/50 text-red-500 rounded-md hover:bg-red-500/10 hover:border-red-500/80 transition-colors"
                        >
                            Clear Chat History
                        </button>
                    </div>
                </main>

                {/* Modal Footer */}
                <footer className="p-6 pt-4 mt-auto flex-shrink-0 border-t border-gray-200 bg-white">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};