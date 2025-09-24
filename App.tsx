import React, { useState, useEffect, useRef } from 'react';
import { localLlmService } from './services/localLlmService';
import { Chat, Message, Role, Persona } from './types';
import { personas as defaultPersonas } from './personas';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { ChatSidebar } from './components/ChatSidebar';

// --- CONSTANTS ---
const CHATS_HISTORY_KEY = 'assistantDrafterChatsHistory_ollama';
const OLLAMA_URL_KEY = 'assistantDrafterOllamaUrl';
const OLLAMA_MODEL_KEY = 'assistantDrafterOllamaModel';
const PERSONAS_KEY = 'assistantDrafterPersonas';
const CONTEXT_LIMIT = 10;

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'phi3:3.8b';

// --- ICONS AND WELCOME PLACEHOLDER ---
const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.226l.558-.223c.55-.22 1.158.225 1.158.822v5.162a1.125 1.125 0 01-1.666 1.01l-.558-.223a1.125 1.125 0 00-1.332.215 1.125 1.125 0 00-.215 1.332l.223.558c.22.55.22 1.158-.225 1.158h-5.162a1.125 1.125 0 01-1.01-1.666l.223-.558c.34-.844-.06-1.81-.92-2.148l-.558-.223c-.55-.22-1.007.56-1.226 1.11a11.253 11.253 0 00-1.956 5.424v.223c.22.55-.225 1.158-.822 1.158h-5.162a1.125 1.125 0 01-1.666-1.01l.223-.558c.34-.844-.06-1.81-.92-2.148l-.558-.223c-.55-.22-.56-1.007-1.11-1.226A11.253 11.253 0 003.94 10.343v-.223c-.22-.55.225-1.158.822-1.158h5.162a1.125 1.125 0 011.01 1.666l-.223.558c-.34.844.06 1.81.92 2.148l.558.223c.55.22 1.007-.56 1.226-1.11a11.253 11.253 0 001.956-5.424v-.223c-.22-.55.225-1.158.822-1.158h5.162a1.125 1.125 0 011.666 1.01l-.223.558c-.34.844.06 1.81.92 2.148l.558.223c.55.22.56 1.007 1.11 1.226a11.253 11.253 0 001.956-5.424z" />
    </svg>
);

const WelcomePlaceholder: React.FC<{ personaName: string }> = ({ personaName }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{personaName}</h2>
        <p>Start a new conversation by typing your message below.</p>
    </div>
);

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [personas, setPersonas] = useState<Persona[]>(defaultPersonas);
    const [activePersona, setActivePersona] = useState<Persona>(personas[0]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL);
    const [ollamaModel, setOllamaModel] = useState(DEFAULT_OLLAMA_MODEL);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Derived state for convenience
    const activeChat = chats.find(chat => chat.id === activeChatId);
    const activeChatMessages = activeChat?.messages || [];

    // --- USEEFFECT HOOKS ---
    useEffect(() => {
        try {
            // Load chats
            const savedChats = localStorage.getItem(CHATS_HISTORY_KEY);
            const allChats: Chat[] = savedChats ? JSON.parse(savedChats) : [];
            setChats(allChats);
            if (allChats.length > 0) {
                setActiveChatId(allChats[0].id);
            }

            // Load Ollama settings
            const savedUrl = localStorage.getItem(OLLAMA_URL_KEY) || DEFAULT_OLLAMA_URL;
            setOllamaUrl(savedUrl);
            localLlmService.setUrl(savedUrl);

            const savedModel = localStorage.getItem(OLLAMA_MODEL_KEY) || DEFAULT_OLLAMA_MODEL;
            setOllamaModel(savedModel);
            localLlmService.setModel(savedModel);

            // Load Personas
            const savedPersonas = localStorage.getItem(PERSONAS_KEY);
            const allPersonas = savedPersonas ? JSON.parse(savedPersonas) : defaultPersonas;
            setPersonas(allPersonas);

            // Ensure activePersona is in sync with the loaded personas
            setActivePersona(allPersonas[0]);

        } catch (error) {
            console.error("Failed to initialize from localStorage", error);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas));
    }, [personas]);

    useEffect(() => {
        if (chats.length > 0) {
            const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);
            localStorage.setItem(CHATS_HISTORY_KEY, JSON.stringify(sortedChats));
        }
    }, [chats]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [activeChatMessages, isLoading]);


    // --- HANDLER FUNCTIONS ---
    const handleNewChat = () => {
        const newChat: Chat = {
            id: `chat-${Date.now()}`,
            title: `New Conversation`,
            messages: [],
            createdAt: Date.now(),
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
    };

    const handleDeleteChat = (idToDelete: string) => {
        if (window.confirm("Are you sure you want to delete this conversation?")) {
            const remainingChats = chats.filter(chat => chat.id !== idToDelete);
            setChats(remainingChats);
            if (activeChatId === idToDelete) {
                setActiveChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
            }
        }
    };

    const handleSavePersonas = (updatedPersonas: Persona[]) => {
        setPersonas(updatedPersonas);
        // If the currently active persona was edited, update it
        const updatedActive = updatedPersonas.find(p => p.id === activePersona.id);
        if (updatedActive) {
            setActivePersona(updatedActive);
        } else {
            // If the active persona was deleted, fall back to the first one
            setActivePersona(updatedPersonas[0] || defaultPersonas[0]);
        }
    };


    const handleSendMessage = async (userInput: string) => {
        let currentChatId = activeChatId;

        // If this is the very first message in a new session, create a chat first.
        // The title will be set within the main setChats update.
        if (!currentChatId) {
            const newChat: Chat = {
                id: `chat-${Date.now()}`,
                title: "New Conversation", // Temporary title
                messages: [],
                createdAt: Date.now(),
            };
            setChats(prev => [newChat, ...prev]);
            currentChatId = newChat.id;
            setActiveChatId(newChat.id);
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        setIsLoading(true);

        const userMessage: Message = { role: Role.USER, text: userInput };
        const modelPlaceholderMessage: Message = { role: Role.MODEL, text: "" };

        // This is a single, atomic update that handles both adding messages and setting the title.
        setChats(prevChats => {
            const targetChat = prevChats.find(c => c.id === currentChatId);
            // This is the first message if the chat exists and has no messages yet.
            const isFirstMessage = targetChat ? targetChat.messages.length === 0 : false;

            return prevChats.map(chat =>
                chat.id === currentChatId
                ? {
                    ...chat,
                    // --- THE KEY LOGIC ---
                    // If it's the first message, update the title. Otherwise, keep the existing one.
                    title: isFirstMessage ? userInput.substring(0, 40) + (userInput.length > 40 ? '...' : '') : chat.title,
                    messages: [...chat.messages, userMessage, modelPlaceholderMessage]
                  }
                : chat
            );
        });

        // The streaming logic now runs after the state update has been queued.
        // We need to get the updated history for the context window.
        const currentHistory = [...(activeChat?.messages || []), userMessage];
        const truncatedHistory = currentHistory.length > CONTEXT_LIMIT
            ? currentHistory.slice(-CONTEXT_LIMIT)
            : currentHistory;
        
        try {
            await localLlmService.generateResponseStream(
                truncatedHistory,
                (streamedText) => {
                    setChats(prev => prev.map(chat => {
                        if (chat.id === currentChatId) {
                            const newMessages = [...chat.messages];
                            newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], text: streamedText };
                            return { ...chat, messages: newMessages };
                        }
                        return chat;
                    }));
                },
                activePersona.prompt,
                signal
            );
        } catch (e: any) {
            // ... error handling ...
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    const handleSaveSettings = (newUrl: string, newModel: string) => {
        const cleanedUrl = newUrl.trim().replace(/\/+$/, '');
        setOllamaUrl(cleanedUrl);
        localLlmService.setUrl(cleanedUrl);

        const cleanedModel = newModel.trim();
        setOllamaModel(cleanedModel);
        localLlmService.setModel(cleanedModel);
        try {
            localStorage.setItem(OLLAMA_URL_KEY, cleanedUrl);
            localStorage.setItem(OLLAMA_MODEL_KEY, cleanedModel);
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    };

    const handleClearAllHistory = () => {
        if (window.confirm("Are you sure you want to delete ALL chat history? This action cannot be undone.")) {
            try {
                localStorage.removeItem(CHATS_HISTORY_KEY);
                setChats([]);
                setActiveChatId(null);
                setIsSettingsOpen(false);
            } catch (error) {
                console.error("Failed to clear chat history from localStorage", error);
            }
        }
    };

    // --- RENDER ---
    return (
        // --- LAYOUT CHANGE 1: Main container is now fixed to the screen height ---
        <div className="h-screen w-screen bg-gray-100 text-gray-900 font-sans flex flex-col">
            <div className="w-full h-full flex flex-row bg-white">
                <ChatSidebar
                    chats={chats}
                    activeChatId={activeChatId}
                    onNewChat={handleNewChat}
                    onSelectChat={setActiveChatId}
                    onDeleteChat={handleDeleteChat}
                />

                {/* --- LAYOUT CHANGE 2: Main chat pane is also a flex column that fills remaining space --- */}
                <div className="flex-1 flex flex-col h-full">
                    <header className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                        <div className="w-8"></div> {/* Spacer */}
                        <div className="text-center">
                            <select
                                value={activePersona?.id}
                                onChange={(e) => setActivePersona(personas.find(p => p.id === e.target.value) || personas[0])}
                                className="text-xl font-semibold bg-transparent border-none focus:ring-0 p-0 m-0"
                            >
                                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            aria-label="Open settings"
                        >
                            <SettingsIcon className="w-5 h-5" />
                        </button>
                    </header>

                    {/* --- LAYOUT CHANGE 3: The main chat area now grows and enables scrolling --- */}
                    <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth">
                        {activeChatMessages.length === 0 ? (
                            <WelcomePlaceholder personaName={activePersona.name} />
                        ) : (
                            activeChatMessages.map((msg, index) => (
                                <ChatMessage
                                    key={index}
                                    message={msg}
                                    isLoading={isLoading && index === activeChatMessages.length - 1}
                                    isOutOfContext={activeChatMessages.length - index > CONTEXT_LIMIT}
                                />
                            ))
                        )}
                    </main>

                    {/* --- LAYOUT CHANGE 4: The input area does not shrink --- */}
                    <div className="flex-shrink-0">
                        <ChatInput
                            onSendMessage={handleSendMessage}
                            isLoading={isLoading}
                            isModelReady={true}
                            placeholder={activePersona.placeholder}
                            onStopGeneration={handleStopGeneration}
                        />
                    </div>
                </div>
            </div>
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentUrl={ollamaUrl}
                currentModel={ollamaModel}
                onSave={handleSaveSettings}
                onClearChatHistory={handleClearAllHistory}
                currentPersonas={personas}
                onSavePersonas={handleSavePersonas}
            />
        </div>
    );
};

export default App;