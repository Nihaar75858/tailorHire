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
          isUser ? "bg-neutral-600 text-white" : "text-black"
        }`}
      >
        {message}
      </div>
    </div>
  );
};

export default ChatMessage;
