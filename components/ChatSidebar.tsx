import React from 'react';
import { Chat } from '../types'; // Make sure your types file is at the root

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat }) => {
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent the chat from being selected when clicking the delete button
    onDeleteChat(id);
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-2 border-b border-gray-200">
        <button 
          onClick={onNewChat} 
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Chat
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {chats.map(chat => (
          <div 
            key={chat.id} 
            onClick={() => onSelectChat(chat.id)}
            className={`relative group flex items-center p-2 rounded-md cursor-pointer transition-colors ${
              chat.id === activeChatId 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex-1 truncate text-sm font-medium">{chat.title}</span>
            <button 
              onClick={(e) => handleDelete(e, chat.id)} 
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </nav>
    </div>
  );
};