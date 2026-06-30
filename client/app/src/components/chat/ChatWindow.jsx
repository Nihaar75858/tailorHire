// ============================================
// src/components/chat/ChatWindow.jsx
// ============================================
import React, { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import ChatMessage from './ChatMessage';

const ChatWindow = ({ messages }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center text-gray-500">
        <div>
          <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Start a conversation with your AI assistant</p>
          <p className="text-sm mt-2">Try asking about interview tips or career advice</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg.message} sender={msg.sender} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;