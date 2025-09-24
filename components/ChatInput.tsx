import React, { useState, useRef, useEffect } from 'react';

const StopIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);
interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    isModelReady: boolean;
    placeholder: string;
    onStopGeneration: () => void;
}

const SendIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isModelReady, placeholder, onStopGeneration }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [input]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading && isModelReady) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    const getPlaceholder = () => {
        if (isLoading) return "Generating response...";
        return placeholder || "Ask a question...";
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
            <div className="relative flex items-end">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={getPlaceholder()}
                    className="w-full bg-gray-100 text-gray-900 rounded-lg py-3 pl-4 pr-14 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 no-scrollbar disabled:cursor-not-allowed"
                    rows={1}
                    disabled={isLoading || !isModelReady}
                    style={{ maxHeight: '200px' }}
                />
                {/* --- Conditionally render the button --- */}
                {isLoading ? (
                    <button
                        type="button" // Important: type="button" to prevent form submission
                        onClick={onStopGeneration}
                        className="absolute right-3 bottom-2.5 p-2 rounded-full text-white bg-red-600 hover:bg-red-700 transition-all duration-200"
                        aria-label="Stop generation"
                    >
                        <StopIcon />
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={!input.trim() || !isModelReady}
                        className="absolute right-3 bottom-2.5 p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                        aria-label="Send message"
                    >
                        <SendIcon />
                    </button>
                )}
            </div>
        </form>
    );
};