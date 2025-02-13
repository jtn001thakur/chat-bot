import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Message from './Message';
import MessageInput from './MessageInput';
import { FaUser, FaCircle, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Chat = ({ initialUser }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      textContent: `Hello ${initialUser?.name || 'User'}! How can our support team assist you today?`,
      sender: 'support',
      timestamp: new Date().toISOString(),
      mediaUrl: null
    }
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (newMessage) => {
    const messagePayload = {
      id: messages.length + 1,
      textContent: newMessage.textContent || '',
      sender: 'user',
      timestamp: new Date().toISOString(),
      mediaUrl: newMessage.mediaFile 
        ? URL.createObjectURL(newMessage.mediaFile) 
        : null
    };

    // Add message to state
    setMessages(prevMessages => [...prevMessages, messagePayload]);

    // Simulate support response
    setTimeout(() => {
      const supportResponse = {
        id: messages.length + 2,
        textContent: 'Thank you for your message. Our support team is reviewing your inquiry and will respond shortly.',
        sender: 'support',
        timestamp: new Date().toISOString(),
        mediaUrl: null
      };
      setMessages(prevMessages => [...prevMessages, supportResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <Message 
            key={msg.id} 
            message={msg} 
            isUser={msg.sender === 'user'} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="p-2 text-gray-500 text-sm">
          Support is typing...
        </div>
      )}

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Chat;
