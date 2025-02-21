import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPaperPlane, FaUser } from 'react-icons/fa';
import { chatApi } from '../utils/api';

const Chat = ({ 
  initialUser, 
  fullScreen = false, 
  onClose 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch messages when component mounts or user changes
  const fetchMessages = useCallback(async () => {
    if (!initialUser) {
      setError('No user information provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching messages for:', initialUser);

      const queryParams = {
        application: initialUser.application || initialUser._id,
        phoneNumber: initialUser.phoneNumber || `app_${initialUser._id}`,
        limit: 100,
        skip: 0,
        role: initialUser.role || 'application_support'
      };

      console.log('Query Parameters:', queryParams);

      const response = await chatApi.getMessages(queryParams);
      
      console.log('API Response:', response);

      const fetchedMessages = response.messages || response || [];
      
      setMessages(fetchedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to fetch messages');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [initialUser]);

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        receiverId: initialUser._id,
        content: newMessage.trim(),
        application: initialUser.application || initialUser._id
      };

      const sentMessage = await chatApi.sendMessage(messageData);
      
      // Update messages
      setMessages(prevMessages => [...prevMessages, sentMessage]);
      
      // Clear input
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
        <button 
          onClick={fetchMessages} 
          className="ml-2 bg-blue-500 text-white px-3 py-1 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-gray-100 p-4 flex justify-between items-center">
        <div className="flex items-center">
          <FaUser className="mr-2 text-gray-600" />
          <h3 className="text-lg font-semibold">
            {initialUser?.name || 'Chat'}
          </h3>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            No messages yet
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg._id || index} 
              className={`flex ${msg.senderId === initialUser._id ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[70%] p-3 rounded-lg 
                  ${msg.senderId === initialUser._id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-800'}
                `}
              >
                {msg.content}
                <div className="text-xs mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form 
        onSubmit={handleSendMessage} 
        className="bg-white p-4 border-t flex items-center"
      >
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow mr-4 p-2 border rounded-lg"
        />
        <button 
          type="submit" 
          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default Chat;
