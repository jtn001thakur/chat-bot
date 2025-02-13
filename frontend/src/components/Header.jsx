import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaUser, 
  FaSignOutAlt, 
  FaBars,
  FaTimes,
  FaChevronDown, 
  FaChevronUp,
  FaComments,
  FaArrowLeft 
} from 'react-icons/fa';
import { getUserInfo, handleLogout } from '../utils/localStorageUtils';
import { authApi } from '../utils/api';
import { useConfirmation } from '../contexts/ConfirmationContext';

const Header = ({ 
  chatMode = false, 
  chatTitle = 'Support Chat', 
  onBackClick 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirmation();
  const userInfo = getUserInfo();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogoutClick = async () => {
    const confirmed = await confirm({
      title: 'Logout',
      message: 'Are you sure you want to log out?',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        await authApi.logout();
        handleLogout();
        navigate('/login');
      } catch (error) {
        console.error('Logout failed:', error);
        handleLogout();
        navigate('/login');
      }
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    if (isDropdownOpen || isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isMobileMenuOpen]);

  const menuItems = [
    { 
      icon: <FaUser />, 
      label: 'Profile', 
      onClick: () => {
        navigate('/profile');
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    },
    { 
      icon: <FaComments />, 
      label: 'Support Chat', 
      onClick: () => {
        navigate('/messages');
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    },
    { 
      icon: <FaSignOutAlt />, 
      label: 'Logout', 
      onClick: handleLogoutClick,
      className: 'text-red-500'
    }
  ];

  // Determine header content based on chat mode and user role
  const renderHeaderContent = () => {
    if (chatMode) {
      return (
        <div className="flex items-center w-full">
          <button 
            onClick={onBackClick || (() => navigate(-1))}
            className="mr-4 text-gray-600 hover:text-blue-500"
          >
            <FaArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{chatTitle}</h2>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Dashboard Logo/Text */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-xl cursor-pointer font-bold text-gray-800"
          onClick={() => navigate('/')}
        >
          {userInfo?.role === 'superadmin' ? 'Super Admin Dashboard' : 
           userInfo?.role === 'admin' ? 'Admin Dashboard' : 
           'Dashboard'}
        </motion.div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={toggleDropdown}
            className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
              <FaUser className="text-white" />
            </div>
            <span className="font-medium mr-2">
              {userInfo?.name || 'User'}
            </span>
            {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
          </div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg"
              >
                {menuItems.map((item, index) => (
                  <div 
                    key={index}
                    onClick={item.onClick}
                    className={`
                      flex items-center p-3 cursor-pointer 
                      hover:bg-gray-100 
                      ${item.className || ''}
                    `}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {renderHeaderContent()}
      </div>
    </header>
  );
};

export default Header;
