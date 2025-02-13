import React from 'react';
import { getUserInfo } from '../utils/localStorageUtils';
import Chat from './Chat';
import './Components.css';

function User() {
  const userInfo = getUserInfo();

  return (
    <div className="min-h-screen bg-gray-100">
      <Chat 
        initialUser={{
          id: userInfo?.id,
          name: userInfo?.name || 'User',
          phoneNumber: userInfo?.phoneNumber
        }} 
      />
    </div>
  );
}

export default User;