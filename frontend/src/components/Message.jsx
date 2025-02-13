import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const Message = ({ message, isUser }) => {
  // Format timestamp to human-readable format
  const formatTimestamp = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Render media preview if exists
  const renderMediaPreview = () => {
    if (!message.mediaUrl) return null;

    const fileType = message.mediaUrl.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'mkv'];

    if (imageExtensions.includes(fileType)) {
      return (
        <img 
          src={message.mediaUrl} 
          alt="Media" 
          className="max-w-[200px] max-h-[200px] rounded-lg mt-2 object-cover" 
        />
      );
    }

    if (videoExtensions.includes(fileType)) {
      return (
        <video 
          src={message.mediaUrl} 
          controls 
          className="max-w-[200px] max-h-[200px] rounded-lg mt-2"
        />
      );
    }

    return (
      <div className="flex items-center mt-2 bg-gray-100 p-2 rounded-lg">
        <span className="text-sm text-gray-600 mr-2">Attached File:</span>
        <span className="text-sm">{message.mediaUrl.split('/').pop()}</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        flex flex-col 
        ${isUser ? 'items-end' : 'items-start'}
        mb-4
      `}
    >
      <div 
        className={`
          max-w-[80%] 
          p-3 
          rounded-2xl 
          relative 
          ${isUser 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-gray-200 text-black rounded-bl-none'}
        `}
      >
        {/* Message Text */}
        {message.textContent && (
          <div className="whitespace-pre-wrap break-words">
            {message.textContent}
          </div>
        )}

        {/* Media Preview */}
        {renderMediaPreview()}

        {/* Timestamp */}
        <div 
          className={`
            text-xs mt-1 
            ${isUser ? 'text-blue-200' : 'text-gray-500'}
          `}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </motion.div>
  );
};

export default Message;