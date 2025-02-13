import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  FaPaperclip, 
  FaArrowUp, 
  FaTimes, 
  FaImage, 
  FaVideo, 
  FaFileAlt 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// Utility function for file type and preview
const getFileDetails = (file) => {
  if (!file) return null;

  const fileType = file.type.split('/')[0];
  const fileExtension = file.name.split('.').pop().toLowerCase();

  // Determine file type with more specific checks
  const typeMap = {
    'image': ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
    'video': ['mp4', 'avi', 'mov', 'mkv', 'webm'],
    'document': ['pdf', 'doc', 'docx', 'txt', 'rtf']
  };

  const getType = () => {
    for (const [type, extensions] of Object.entries(typeMap)) {
      if (fileType === type || extensions.includes(fileExtension)) {
        return type;
      }
    }
    return 'other';
  };

  const type = getType();
  const previewUrl = URL.createObjectURL(file);

  return {
    type,
    icon: {
      'image': <FaImage className="text-blue-500" />,
      'video': <FaVideo className="text-green-500" />,
      'document': <FaFileAlt className="text-red-500" />,
      'other': <FaFileAlt className="text-gray-500" />
    }[type],
    previewUrl,
    fileSize: (file.size / (1024 * 1024)).toFixed(2) // Size in MB
  };
};

// Utility function to truncate filename
const truncateFilename = (filename, maxLength = 20) => {
  if (filename.length <= maxLength) return filename;
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 3);
  return `${truncatedName}...${extension}`;
};

const MessageInput = ({ onSendMessage, replyMessage, maxLines = 6 }) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [inputHeight, setInputHeight] = useState(60); // Increased default height

  // File details with memoization
  const fileDetails = useMemo(() => getFileDetails(selectedFile), [selectedFile]);

  // Auto-resize textarea
  const handleTextareaResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(
        textarea.scrollHeight, 
        textarea.lineHeight * maxLines
      );
      
      // Update input height
      setInputHeight(Math.max(newHeight + 20, 60)); // Minimum 60px
      textarea.style.height = `${newHeight}px`;
    }
  }, [maxLines]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size should not exceed 10MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  // Send message logic
  const handleSendMessage = () => {
    // Only send if message is not empty or file is selected
    const isValidMessage = message.trim().length > 0 || selectedFile;
    
    if (isValidMessage) {
      onSendMessage({
        textContent: message.trim(),
        mediaFile: selectedFile
      });

      // Reset everything
      setMessage('');
      setSelectedFile(null);
      setUploadProgress(0);
      setInputHeight(60); // Reset to default height
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reset textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="bg-white border-t"
      style={{ 
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        width: '100%',
        padding: '8px'
      }}
    >
      {/* File Preview */}
      {selectedFile && (
        <div className="absolute bottom-full left-0 mb-2 w-full">
          <div className="flex items-center bg-gray-100 rounded-md p-2 max-w-full">
            <div className="flex items-center flex-1 min-w-0">
              {/* Preview Section */}
              {fileDetails.type === 'image' && (
                <div className="w-12 h-12 mr-2 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={fileDetails.previewUrl}
                    alt={selectedFile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M19 2H5C3.9 2 3 2.9 3 4V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V4C21 2.9 20.1 2 19 2ZM19 20H5V4H19V20ZM12 5.5C10.3 5.5 9 6.8 9 8.5C9 10.2 10.3 11.5 12 11.5C13.7 11.5 15 10.2 15 8.5C15 6.8 13.7 5.5 12 5.5ZM7 18V16L9 14L10 15L13 12L17 16V18H7Z"/></svg>';
                    }}
                  />
                </div>
              )}
              {fileDetails.type === 'video' && (
                <div className="w-12 h-12 mr-2 rounded overflow-hidden flex-shrink-0 bg-black">
                  <video
                    src={fileDetails.previewUrl}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200"><svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg></div>';
                    }}
                  />
                </div>
              )}
              {!['image', 'video'].includes(fileDetails.type) && (
                <div className="w-12 h-12 mr-2 flex-shrink-0 flex items-center justify-center">
                  {fileDetails.icon}
                </div>
              )}
              
              {/* File Info */}
              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-700 truncate">
                  {truncateFilename(selectedFile.name)}
                </div>
                <div className="text-xs text-gray-500">
                  {fileDetails.fileSize} MB
                </div>
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => {
                URL.revokeObjectURL(fileDetails.previewUrl);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="ml-2 text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 text-red-700 p-2 rounded-lg mb-2"
        >
          {error}
        </motion.div>
      )}

      {/* Input Container */}
      <div 
        className="flex items-center space-x-2"
        style={{ height: `${inputHeight}px` }}
      >
        {/* File Upload Button */}
        <label 
          htmlFor="file-upload" 
          className="cursor-pointer text-gray-500 hover:text-blue-500 p-2"
        >
          <input 
            type="file" 
            id="file-upload"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,application/pdf,.doc,.docx"
          />
          <FaPaperclip size={24} />
        </label>

        {/* Input Area */}
        <div className="flex-1 bg-gray-100 rounded-full px-3 py-1 flex items-center">
          <textarea 
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTextareaResize();
            }}
            placeholder="Message"
            rows={1}
            className="w-full bg-transparent resize-none overflow-hidden outline-none text-left"
            style={{ 
              height: `${inputHeight - 20}px`,
              minHeight: '34px',
              maxHeight: `${textareaRef.current?.lineHeight * maxLines}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                setMessage(prev => prev + '\n');
                handleTextareaResize();
                return;
              }
              
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
        </div>

        {/* Send Button */}
        <button 
          onClick={handleSendMessage}
          disabled={!message.trim() && !selectedFile}
          className={`
            p-2 rounded-full w-10 h-10 flex items-center justify-center
            ${(message.trim() || selectedFile) 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
          `}
        >
          <FaArrowUp size={20} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
