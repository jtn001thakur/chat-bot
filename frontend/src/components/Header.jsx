import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaSignOutAlt, 
  FaCog, 
  FaChevronDown, 
  FaChevronUp 
} from 'react-icons/fa';
import { getUserInfo, handleLogout } from '../utils/localStorageUtils';
import { authApi } from '../utils/api';
import { useConfirmation } from '../contexts/ConfirmationContext';

const Header = () => {
  const navigate = useNavigate();
  const confirm = useConfirmation();
  const userInfo = getUserInfo();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogoutClick = async () => {
    const confirmed = await confirm({
      title: 'Logout',
      message: 'Are you sure you want to log out?',
      variant: 'danger'
    });

    if (confirmed) {
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
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const menuItems = [
    { 
      icon: <FaUser />, 
      label: 'Profile', 
      onClick: () => {
        navigate('/profile');
        setIsDropdownOpen(false);
      }
    },
    { 
      icon: <FaSignOutAlt />, 
      label: 'Logout', 
      onClick: handleLogoutClick,
      className: 'text-red-500'
    }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-xl cursor-pointer font-bold text-gray-800"
          onClick={() => navigate('/')}
        >
          Dashboard
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative"
        >
          <button 
            onClick={toggleDropdown}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                {userInfo?.name ? userInfo.name[0].toUpperCase() : 'U'}
              </div>
              <span className="font-medium hidden md:inline">
                {userInfo?.name || 'User'}
              </span>
            </div>
            {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg overflow-hidden border"
              >
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-100 transition 
                      ${item.className || ''}`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
