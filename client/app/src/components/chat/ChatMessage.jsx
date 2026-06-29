// ============================================
// src/components/chat/ChatMessage.jsx
// ============================================
import React from "react";

const ChatMessage = ({ message, sender }) => {
  const isUser = sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xl px-4 py-3 rounded-lg ${
          isUser ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {message}
      </div>
    </div>
  );
};

export default ChatMessage;
