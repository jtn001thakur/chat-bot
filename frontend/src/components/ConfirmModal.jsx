import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationCircle } from 'react-icons/fa';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const variants = {
    default: {
      confirm: 'bg-blue-500 hover:bg-blue-600 text-white',
      cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    },
    danger: {
      confirm: 'bg-red-500 hover:bg-red-600 text-white',
      cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    }
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 bg-opacity-50 backdrop-blur-sm">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 20 
            }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto p-6 text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <FaExclamationCircle 
                className={`text-6xl ${variant === 'danger' ? 'text-red-500' : 'text-blue-500'}`} 
              />
            </div>
            <h2 className="text-2xl font-bold mb-3">{title}</h2>
            <p className="text-gray-600 mb-6 text-lg">{message}</p>
            
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className={`flex-1 py-3 rounded-xl font-semibold text-lg transition ${currentVariant.cancel}`}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-3 rounded-xl font-semibold text-lg transition ${currentVariant.confirm}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
