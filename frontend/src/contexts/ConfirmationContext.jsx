import React, { createContext, useState, useContext } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ConfirmationContext = createContext(null);

export const ConfirmationProvider = ({ children }) => {
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    variant: 'default'
  });

  const confirm = ({
    title, 
    message, 
    onConfirm, 
    onCancel, 
    variant = 'default'
  }) => {
    return new Promise((resolve) => {
      setConfirmationState({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setConfirmationState(prev => ({ ...prev, isOpen: false }));
          onConfirm && onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setConfirmationState(prev => ({ ...prev, isOpen: false }));
          onCancel && onCancel();
          resolve(false);
        },
        variant
      });
    });
  };

  const closeConfirmation = () => {
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      <ConfirmModal 
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        onConfirm={confirmationState.onConfirm}
        onClose={confirmationState.onCancel}
        variant={confirmationState.variant}
      />
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};
