import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Message from './Message';
import MessageInput from './MessageInput';
import { FaUser, FaCircle, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../utils/api';
import { areTimestampsClose } from '../utils/dateUtils';

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
      // Ensure we have all required user information
      if (!initialUser?.application || !initialUser?.phoneNumber) {
        console.error('Missing user information for fetching messages', initialUser);
        setError('User information is incomplete');
        return;
      }

      setIsLoading(true);
      setError(null);
      console.log('Fetching messages for user:', initialUser);

      // Use getMessages from api.js
      const response = await chatApi.getMessages({
        application: initialUser.application,
        phoneNumber: initialUser.phoneNumber,
        limit: 100,
        skip: 0,
        role: initialUser.role
      });
      
      console.log('Full API response:', response);
      
      // Ensure we're setting the correct part of the response
      const fetchedMessages = response.messages || response;
      
      if (!fetchedMessages || fetchedMessages.length === 0) {
        console.warn('No messages found');
        setMessages([]);
      } else {
        console.log('Setting messages:', fetchedMessages);
        setMessages(fetchedMessages);
      }
      
      isFetchedRef.current = true;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setError(error.message || 'Failed to fetch messages');
      setMessages([]); // Ensure messages is an empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [initialUser]);

  useEffect(() => {
    // Fetch messages when component mounts or initialUser changes
    if (initialUser?.application && initialUser?.phoneNumber) {
      fetchMessages();
    }
  }, [initialUser, fetchMessages]);

  const scrollToBottom = () => {
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: "auto", 
          block: "end" 
        });
      }
    }, 100);
  };

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [messages]);

  const getUserInfo = () => {
    // Implement logic to get user info
    // For demonstration purposes, assume user role is 'user'
    return { role: 'user' };
  };

  const handleSendMessage = async (newMessage) => {
    try {
      const messagePayload = {
        message: newMessage.textContent || '',
        // Receiver is optional, will be handled server-side
        receiver: getUserInfo().role !== 'user' ? newMessage.receiver : null, 
        role: initialUser.role,
        phoneNumber: initialUser.phoneNumber,
        application: initialUser.application || null,
        metadata: {
          mediaFile: newMessage.mediaFile 
            ? URL.createObjectURL(newMessage.mediaFile) 
            : null
        }
      };

      // Send message via API
      const response = await chatApi.sendMessage(messagePayload);

      // Determine the correct message data based on response structure
      const sentMessage = response.chatMessages 
        ? response.chatMessages[0] 
        : response.offlineData || {};

      // Construct a consistent message object
      const formattedMessage = {
        _id: sentMessage._id || Date.now().toString(),
        message: sentMessage.message || messagePayload.message,
        content: sentMessage.message || messagePayload.message,
        sender: sentMessage.sender || `${initialUser.application}${initialUser.phoneNumber}`,
        senderRole: sentMessage.senderRole || initialUser.role,
        application: sentMessage.application || initialUser.application,
        createdAt: sentMessage.timestamp || sentMessage.createdAt || new Date().toISOString(),
        metadata: sentMessage.metadata || messagePayload.metadata,
        isYours: true  // Message just sent by current user
      };

      // Add sent message to state
      setMessages(prevMessages => [...prevMessages, formattedMessage]);

      // Reset media file if used
      if (newMessage.mediaFile) {
        URL.revokeObjectURL(newMessage.mediaFile);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Optimistic UI update with a pending message
      const pendingMessage = {
        _id: `pending-${Date.now()}`,
        message: newMessage.textContent || '',
        content: newMessage.textContent || '',
        sender: `${initialUser.application}${initialUser.phoneNumber}`,
        senderRole: initialUser.role,
        application: initialUser.application,
        createdAt: new Date().toISOString(),
        metadata: newMessage.mediaFile 
          ? { mediaFile: URL.createObjectURL(newMessage.mediaFile) } 
          : {},
        isYours: true,
        status: 'FAILED'
      };

      setMessages(prevMessages => [...prevMessages, pendingMessage]);

      // Optional: Show a toast or error message to the user
      // You might want to add a toast library or error handling component
    }
  };

  // Render content based on loading and messages
  const renderContent = () => {
    // Still loading
    if (isLoading) {
      return (
        <div className="text-center text-gray-500 mt-10">
          <p>Loading messages...</p>
          <p className="text-xs mt-2">Fetching conversation history</p>
        </div>
      );
    }

    // Error occurred
    if (error) {
      return (
        <div className="text-center text-red-500 mt-10 p-4">
          <p className="mb-4">Error Loading Messages</p>
          <p className="text-sm mb-4">
            {error}
          </p>
          <p className="text-xs text-gray-600 mb-4">
            Check your internet connection or user information
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
    if (!messages || messages.length === 0) {
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
    return messages.map((msg, index) => {
      // Determine if the message is from the current user
      const isYours = msg.sender === `${initialUser.application}${initialUser.phoneNumber}` || 
                      (msg.senderRole === 'user' && msg.senderInfo?.phoneNumber === initialUser.phoneNumber);
      
      // Create a message object with additional sender info
      const messageWithSenderInfo = {
        ...msg,
        senderApplication: msg.senderInfo?.application || msg.application,
        senderPhoneNumber: msg.senderInfo?.phoneNumber || '',
        message: msg.message || msg.content,  // Ensure message is present
        createdAt: msg.createdAt,
        isYours: isYours,
        isFirstInGroup: index === 0 || !areTimestampsClose(messages[index-1].createdAt, msg.createdAt)
      };

      return (
        <Message 
          key={msg._id} 
          message={messageWithSenderInfo} 
          isYours={isYours} 
        />
      );
    });
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
