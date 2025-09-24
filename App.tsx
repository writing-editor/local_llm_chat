import React, { useState, useEffect, useRef } from 'react';
import { localLlmService } from './services/localLlmService';
import { Message, Role } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';

const CHAT_HISTORY_KEY = 'assistantDrafterChatHistory_ollama';
const OLLAMA_URL_KEY = 'assistantDrafterOllamaUrl';
const OLLAMA_MODEL_KEY = 'assistantDrafterOllamaModel';
const SYSTEM_PROMPT_KEY = 'assistantDrafterSystemPrompt';
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'phi3:3.8b';
const DEFAULT_SYSTEM_PROMPT = 'You are a professional assistant helping users draft formal documents, letters, and other official communications. Your tone should be formal, clear, and concise. Provide helpful suggestions and complete drafts as requested.';

const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.226l.558-.223c.55-.22 1.158.225 1.158.822v5.162a1.125 1.125 0 01-1.666 1.01l-.558-.223a1.125 1.125 0 00-1.332.215 1.125 1.125 0 00-.215 1.332l.223.558c.22.55.22 1.158-.225 1.158h-5.162a1.125 1.125 0 01-1.01-1.666l.223-.558c.34-.844-.06-1.81-.92-2.148l-.558-.223c-.55-.22-1.007.56-1.226 1.11a11.253 11.253 0 00-1.956 5.424v.223c.22.55-.225 1.158-.822 1.158h-5.162a1.125 1.125 0 01-1.666-1.01l.223-.558c.34-.844-.06-1.81-.92-2.148l-.558-.223c-.55-.22-.56-1.007-1.11-1.226A11.253 11.253 0 003.94 10.343v-.223c-.22-.55.225-1.158.822-1.158h5.162a1.125 1.125 0 011.01 1.666l-.223.558c-.34.844.06 1.81.92 2.148l.558.223c.55.22 1.007-.56 1.226-1.11a11.253 11.253 0 001.956-5.424v-.223c-.22-.55.225-1.158.822-1.158h5.162a1.125 1.125 0 011.666 1.01l-.223.558c-.34.844.06 1.81.92 2.148l.558.223c.55.22.56 1.007 1.11 1.226a11.253 11.253 0 001.956-5.424z" />
    </svg>
);

const WelcomePlaceholder: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
        <div className="bg-gray-200 p-4 rounded-full mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75H19.5M8.25 6.75H19.5M8.25 9.75H19.5M8.25 12.75H19.5m-11.25-9h4.5a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25-2.25h-4.5a2.25 2.25 0 01-2.25-2.25V6a2.25 2.25 0 012.25-2.25z" />
            </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Assistant</h2>
        <p>The AI's persona is configurable in Settings.</p>
        <p>Start a new conversation by typing your message below.</p>
    </div>
);


const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>(() => {
        try {
            const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
            return savedMessages ? JSON.parse(savedMessages) : [];
        } catch (error) {
            console.error("Failed to parse chat history from localStorage", error);
            return [];
        }
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL);
    const [ollamaModel, setOllamaModel] = useState(DEFAULT_OLLAMA_MODEL);
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const savedUrl = localStorage.getItem(OLLAMA_URL_KEY);
            const urlToUse = savedUrl || DEFAULT_OLLAMA_URL;
            setOllamaUrl(urlToUse);
            localLlmService.setUrl(urlToUse);

            const savedModel = localStorage.getItem(OLLAMA_MODEL_KEY);
            const modelToUse = savedModel || DEFAULT_OLLAMA_MODEL;
            setOllamaModel(modelToUse);
            localLlmService.setModel(modelToUse);
            const savedPrompt = localStorage.getItem(SYSTEM_PROMPT_KEY);
            setSystemPrompt(savedPrompt || DEFAULT_SYSTEM_PROMPT);


        } catch (error) {
            console.error("Failed to initialize settings from localStorage", error);
        }
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    useEffect(() => {
        try {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        } catch (error) {
            console.error("Failed to save chat history to localStorage", error);
        }
    }, [messages]);

    const handleSendMessage = async (userInput: string) => {
        setIsLoading(true);

        const userMessage: Message = { role: Role.USER, text: userInput };
        const modelPlaceholderMessage: Message = { role: Role.MODEL, text: "" };
        const currentHistory = [...messages, userMessage];

        setMessages(prev => [...prev, userMessage, modelPlaceholderMessage]);

        try {
            await localLlmService.generateResponseStream(
                currentHistory,
                (streamedText) => {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], text: streamedText };
                        return newMessages;
                    });
                },
                systemPrompt
            );
        } catch (e: any) {
            let errorMessage = "Sorry, something went wrong. Please try again.";
            if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
                errorMessage = `Could not connect to Ollama at **${ollamaUrl}**. Please check the URL in **Settings** and ensure Ollama is running.`;
            } else if (e.message) {
                errorMessage += `\n\n**Error:** ${e.message}`;
            }

            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], text: errorMessage };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSettings = (newUrl: string, newModel: string, newPrompt: string) => {
        const cleanedUrl = newUrl.trim().replace(/\/+$/, '');
        setOllamaUrl(cleanedUrl);
        localLlmService.setUrl(cleanedUrl);

        const cleanedModel = newModel.trim();
        setOllamaModel(cleanedModel);
        localLlmService.setModel(cleanedModel);
        const cleanedPrompt = newPrompt.trim();
        setSystemPrompt(cleanedPrompt);

        try {
            localStorage.setItem(OLLAMA_URL_KEY, cleanedUrl);
            localStorage.setItem(OLLAMA_MODEL_KEY, cleanedModel);
            localStorage.setItem(SYSTEM_PROMPT_KEY, cleanedPrompt); // <-- SAVE TO LOCALSTORAGE
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear the entire chat history? This action cannot be undone.")) {
            try {
                localStorage.removeItem(CHAT_HISTORY_KEY);
                setMessages([]);
                setIsSettingsOpen(false);
            } catch (error) {
                console.error("Failed to clear chat history from localStorage", error);
            }
        }
    };

    return (
        <div className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center justify-center font-sans p-4">
            <div className="w-full max-w-3xl h-[95vh] flex flex-col bg-white rounded-lg shadow-2xl border border-gray-200">
                <header className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <div className="w-8"></div> {/* Spacer */}
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Assistant</h1>
                        <p className="text-sm text-gray-500">Your private AI chat via Ollama</p>
                    </div>
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        aria-label="Open settings"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth">
                    {messages.length === 0 ? (
                        <WelcomePlaceholder />
                    ) : (
                        messages.map((msg, index) => (
                            <ChatMessage 
                                key={index} 
                                message={msg}
                                isLoading={isLoading && index === messages.length - 1} 
                            />
                        ))
                    )}
                </main>

                <div className="flex-shrink-0">
                     <ChatInput 
                        onSendMessage={handleSendMessage} 
                        isLoading={isLoading} 
                        isModelReady={true}
                     />
                </div>
            </div>
             <footer className="text-center text-xs text-gray-500 pt-4">
                <p>
                    Powered by your local Ollama instance. Your conversations are private.
                </p>
            </footer>
             <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentUrl={ollamaUrl}
                currentModel={ollamaModel}
                currentSystemPrompt={systemPrompt}
                onSave={handleSaveSettings}
                onClearHistory={handleClearHistory}
            />
        </div>
    );
};

export default App;