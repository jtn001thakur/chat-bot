import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, 
  FaPhone, 
  FaEdit, 
  FaSave, 
  FaTimes 
} from 'react-icons/fa';
import { getUserInfo } from '../utils/localStorageUtils';
import { useNavigate } from 'react-router-dom';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { authApi } from '../utils/api';
import { validatePhoneNumber, sanitizePhoneNumber } from '../utils/validation';

// Utility function to remove country code
const removeCountryCode = (phoneNumber = '') => {
  return phoneNumber.replace(/^\+91/, '').replace(/\s/g, '');
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const confirm = useConfirmation();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sessions, setSessions] = useState([]);
  const [phoneChanged, setPhoneChanged] = useState(false);

  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo) {
      navigate('/login');
    } else {
      setUser(userInfo);
      setEditedUser({
        name: userInfo.name || '',
        phoneNumber: removeCountryCode(userInfo.phoneNumber) || ''
      });
      
      // Fetch active sessions
      fetchActiveSessions();
    }
  }, [navigate]);

  const fetchActiveSessions = async () => {
    try {
      const response = await authApi.getUserSessions();
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Limit phone number to 10 digits
    if (name === 'phoneNumber') {
      const sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
      setEditedUser(prev => ({
        ...prev,
        [name]: sanitizedValue
      }));
      
      // Check if phone number changed
      setPhoneChanged(sanitizedValue !== removeCountryCode(user.phoneNumber));
    } else {
      setEditedUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear specific field error
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!editedUser.name || editedUser.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }
    
    if (phoneChanged) {
      const sanitizedPhone = editedUser.phoneNumber;
      if (!validatePhoneNumber(sanitizedPhone)) {
        newErrors.phoneNumber = "Please enter a valid phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) return;

    try {
      await authApi.sendOTP({
        countryCode: '+91',
        phoneNumber: editedUser.phoneNumber
      });
      setOtpSent(true);
    } catch (error) {
      setErrors({ 
        api: error.response?.data?.message || "Failed to send OTP" 
      });
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const response = await authApi.verifyOTPAndUpdateProfile({
        countryCode: '+91',
        phoneNumber: editedUser.phoneNumber,
        otp: otp,
        name: editedUser.name
      });
      
      // Update local storage and state
      setUser(response.data.user);
      setIsEditing(false);
      setOtpSent(false);
      setOtp('');
      setPhoneChanged(false);
    } catch (error) {
      setErrors({ 
        otp: error.response?.data?.message || "OTP verification failed" 
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    try {
      // If phone number changed, require OTP
      if (phoneChanged) {
        handleSendOTP();
        return;
      }

      // Only update name if no phone change
      const response = await authApi.updateProfile({
        name: editedUser.name
      });
      
      // Update local storage and state
      setUser(response.data.user);
      setIsEditing(false);
    } catch (error) {
      setErrors({ 
        api: error.response?.data?.message || "Failed to update profile" 
      });
    }
  };

  const handleRevokeSession = async (sessionId) => {
    const confirmed = await confirm({
      title: 'Revoke Session',
      message: 'Are you sure you want to end this session?',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        await authApi.revokeSession(sessionId);
        fetchActiveSessions();
      } catch (error) {
        console.error('Failed to revoke session', error);
      }
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setErrors({});
    setOtpSent(false);
    setOtp('');
    setPhoneChanged(false);
    
    // Reset edited user to original values
    setEditedUser({
      name: user.name || '',
      phoneNumber: removeCountryCode(user.phoneNumber) || ''
    });
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 pt-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden">
        {/* Profile Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center relative"
        >
          <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-full flex items-center justify-center text-6xl font-bold text-indigo-600 shadow-lg">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          
          <h2 className="text-3xl font-bold text-white">{user.name || 'User Profile'}</h2>
        </motion.div>

        {/* Profile Details */}
        <div className="p-8 space-y-6">
          {/* Name Section */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center border-b pb-4"
          >
            <FaUser className="text-indigo-600 text-2xl mr-4" />
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editedUser.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                  placeholder="Enter your name"
                />
              ) : (
                <>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-xl font-semibold">{user.name || 'Not provided'}</p>
                </>
              )}
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
          </motion.div>

          {/* Phone Section */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center border-b pb-4"
          >
            <FaPhone className="text-green-600 text-2xl mr-4" />
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editedUser.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                  placeholder="Enter phone number"
                  maxLength="10"
                />
              ) : (
                <>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="text-xl font-semibold">{user.phoneNumber || 'Not provided'}</p>
                </>
              )}
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>
          </motion.div>

          {/* OTP Section */}
          <AnimatePresence>
            {isEditing && otpSent && phoneChanged && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                  placeholder="Enter OTP"
                  maxLength="6"
                />
                <button 
                  onClick={handleVerifyOTP}
                  className="mt-2 w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Verify OTP
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex space-x-4 mt-6"
          >
            {isEditing ? (
              <>
                <button 
                  onClick={handleEditToggle}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition flex items-center justify-center"
                >
                  <FaTimes className="mr-2" /> Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center"
                >
                  <FaSave className="mr-2" /> Save
                </button>
              </>
            ) : (
              <button 
                onClick={handleEditToggle}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center"
              >
                <FaEdit className="mr-2" /> Edit Profile
              </button>
            )}
          </motion.div>

          {/* Active Sessions */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <h3 className="text-xl font-semibold mb-4">Active Sessions</h3>
            {sessions.length === 0 ? (
              <p className="text-gray-500">No active sessions</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div 
                    key={session.deviceId} 
                    className="flex justify-between items-center bg-gray-100 p-3 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{session.device}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.lastActive).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeSession(session.deviceId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
