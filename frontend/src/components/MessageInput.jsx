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

  return {
    type: getType(),
    icon: {
      'image': <FaImage className="text-blue-500" />,
      'video': <FaVideo className="text-green-500" />,
      'document': <FaFileAlt className="text-red-500" />,
      'other': <FaFileAlt className="text-gray-500" />
    }[getType()],
    previewUrl: fileType === 'image' ? URL.createObjectURL(file) : null
  };
};

const MessageInput = ({ onSendMessage, replyMessage, maxLines = 6 }) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [inputHeight, setInputHeight] = useState(44);

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
      setInputHeight(Math.max(newHeight, 44));
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
      setInputHeight(44); // Reset to single line
      
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

  // Render file preview
  const renderFilePreview = () => {
    if (!fileDetails) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-[-120px] left-0 right-0 bg-white rounded-lg shadow-lg p-2 flex items-center"
      >
        {/* File Preview */}
        {fileDetails.previewUrl ? (
          <div className="w-20 h-20 mr-3 rounded-lg overflow-hidden">
            <img 
              src={fileDetails.previewUrl} 
              alt="File preview" 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 mr-3 flex items-center justify-center">
            {fileDetails.icon}
          </div>
        )}

        {/* File Details */}
        <div className="flex-1">
          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
          <p className="text-xs text-gray-500">
            {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
        </div>

        {/* Remove Button */}
        <button 
          onClick={handleRemoveFile}
          className="text-red-500 hover:text-red-700 p-2"
        >
          <FaTimes />
        </button>
      </motion.div>
    );
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
        padding: 0
      }}
    >
      {/* File Preview */}
      <AnimatePresence>
        {selectedFile && renderFilePreview()}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 text-red-700 p-2 rounded-lg mb-2"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

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
              height: `${inputHeight - 10}px`,
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
