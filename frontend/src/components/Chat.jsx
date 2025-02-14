import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Message from './Message';
import MessageInput from './MessageInput';
import { FaUser, FaCircle, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../utils/api';

const Chat = ({ initialUser }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesEndRef = useRef(null);
  const isFetchedRef = useRef(false);

  // Fetch existing messages on component mount
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching messages...');

      // Use getMessages from api.js
      const fetchedMessages = await chatApi.getMessages({
        application: initialUser.application,
        phoneNumber: initialUser.phoneNumber,
        limit: 100,
        skip: 0,
        role: initialUser.role
      });
      console.log('Fetched messages:', fetchedMessages);
      
      // Set messages in state
      setMessages(fetchedMessages);
      isFetchedRef.current = true;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setError(error.message || 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch messages only if not already fetched
    if (!isFetchedRef.current) {
      fetchMessages();
    }

    // Cleanup function
    return () => {
      isFetchedRef.current = false;
    };
  }, [fetchMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUserInfo = () => {
    // Implement logic to get user info
    // For demonstration purposes, assume user role is 'user'
    return { role: 'user' };
  };

  const handleSendMessage = async (newMessage) => {
    try {
      const userInfo = getUserInfo();
      
      // Prepare message payload
      const messagePayload = {
        message: newMessage.textContent || '',
        // Receiver is optional, will be handled server-side
        receiver: userInfo.role !== 'user' ? newMessage.receiver : null, 
        role: initialUser.role,
        application: initialUser.application || null,
        metadata: {
          mediaFile: newMessage.mediaFile 
            ? URL.createObjectURL(newMessage.mediaFile) 
            : null
        }
      };

      // Send message via API
      const response = await chatApi.sendMessage(messagePayload);

      // Add sent messages to state
      const sentMessages = response.chatMessages.map(sentMessage => ({
        id: sentMessage._id,
        content: sentMessage.content,
        application: initialUser.application,
        sender: userInfo.role,
        timestamp: sentMessage.createdAt,
        mediaUrl: messagePayload.metadata.mediaFile
      }));

      setMessages(prevMessages => [...prevMessages, ...sentMessages]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Add user-friendly error handling
    }
  };

  // Render content based on loading and messages
  const renderContent = () => {
    // Still loading
    if (isLoading) {
      return (
        <div className="text-center text-gray-500 mt-10">
          Loading messages...
        </div>
      );
    }

    // Error occurred
    if (error) {
      return (
        <div className="text-center text-red-500 mt-10 p-4">
          <p className="mb-4">Error Loading Messages</p>
          <p className="text-sm">
            {error.message || 'Unable to fetch messages. Please try again later.'}
          </p>
          <button 
            onClick={() => {
              isFetchedRef.current = false;
              fetchMessages();
            }} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }

    // No messages
    if (messages.length === 0) {
      return (
        <div className="text-center text-gray-500 mt-10 p-4">
          <p className="mb-4">Welcome to Support Chat</p>
          <p className="text-sm">
            No messages yet. Start a conversation by sending a message to our support team.
          </p>
        </div>
      );
    }

    // Render existing messages
    return messages.map((msg) => (
      <Message 
        key={msg.id} 
        message={msg} 
        isUser={msg.sender === 'user'} 
      />
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {renderContent()}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="p-2 text-gray-500 text-sm">
          Support is typing...
        </div>
      )}

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage} 
        disabled={isLoading}
      />
    </div>
  );
};

export default Chat;
