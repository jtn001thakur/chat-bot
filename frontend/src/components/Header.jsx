import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, handleLogout } from '../utils/localStorageUtils';
import { authApi } from '../utils/api';


const Header = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogoutClick = async () => {
    try {
      // Call logout API
      await authApi.logout();
      
      // Clear local storage and redirect
      handleLogout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      handleLogout();
      navigate('/login');
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold text-gray-800">
          Dashboard
        </div>
        <div className="relative">
          <button 
            onClick={toggleDropdown}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          >
            <span className="font-medium">{userInfo?.name || 'User'}</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl overflow-hidden">
              <button
                onClick={() => {
                  navigate('/profile');
                  setIsDropdownOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Profile
              </button>
              <button
                onClick={handleLogoutClick}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
