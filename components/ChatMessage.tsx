import React, { useState } from 'react';
import { Message, Role } from '../types';

const UserIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const ModelIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75H19.5M8.25 6.75H19.5M8.25 9.75H19.5M8.25 12.75H19.5m-11.25-9h4.5a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25 2.25h-4.5a2.25 2.25 0 01-2.25-2.25V6a2.25 2.25 0 012.25-2.25z" />
    </svg>
);

const ClipboardIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = message.role === Role.USER;

  const containerClasses = isUser ? 'justify-end' : 'justify-start';
  const bubbleClasses = isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none';
  const iconContainerClasses = isUser ? 'bg-blue-600' : 'bg-gray-400';
  
  const handleCopy = () => {
    if (isCopied || !message.text) return;
    navigator.clipboard.writeText(message.text)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  const formatText = (text: string): { __html: string } => {
    const lines = text.split('\n');
    let html = '';
    let inUnorderedList = false;
    let inOrderedList = false;

    const applyInlineFormatting = (content: string) => {
        return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    for (const line of lines) {
        const orderedMatch = line.match(/^\s*(\d+)\.\s+(.*)/);
        const unorderedMatch = line.match(/^\s*([*-])\s+(.*)/);

        if (orderedMatch) {
            if (inUnorderedList) {
                html += '</ul>';
                inUnorderedList = false;
            }
            if (!inOrderedList) {
                html += '<ol>';
                inOrderedList = true;
            }
            html += `<li>${applyInlineFormatting(orderedMatch[2])}</li>`;
        } else if (unorderedMatch) {
            if (inOrderedList) {
                html += '</ol>';
                inOrderedList = false;
            }
            if (!inUnorderedList) {
                html += '<ul>';
                inUnorderedList = true;
            }
            html += `<li>${applyInlineFormatting(unorderedMatch[2])}</li>`;
        } else {
            if (inUnorderedList) {
                html += '</ul>';
                inUnorderedList = false;
            }
            if (inOrderedList) {
                html += '</ol>';
                inOrderedList = false;
            }
            if (line.trim()) {
                html += `<p>${applyInlineFormatting(line)}</p>`;
            }
        }
    }

    if (inUnorderedList) html += '</ul>';
    if (inOrderedList) html += '</ol>';

    return { __html: html };
  };

  return (
    <div className={`flex items-start gap-3 my-4 animate-fade-in ${containerClasses}`}>
      {!isUser && (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconContainerClasses}`}>
          <ModelIcon />
        </div>
      )}
      <div className={`relative group px-4 py-3 rounded-xl max-w-xl lg:max-w-2xl ${bubbleClasses}`}>
        {isLoading && message.text.length === 0 ? (
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
          </div>
        ) : (
           <div 
             className="prose max-w-none prose-p:my-2"
             dangerouslySetInnerHTML={formatText(message.text)} 
            />
        )}

        {!isUser && !isLoading && message.text.length > 0 && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-300/50 text-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 hover:bg-gray-400/70"
            aria-label={isCopied ? "Copied to clipboard" : "Copy to clipboard"}
          >
            {isCopied ? <CheckIcon /> : <ClipboardIcon />}
          </button>
        )}
      </div>
      {isUser && (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconContainerClasses}`}>
          <UserIcon />
        </div>
      )}
    </div>
  );
};