import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  superAdminApi 
} from '../utils/api';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 120, 
      damping: 10 
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { 
      ease: "easeInOut" 
    }
  }
};

const ApplicationManagement = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [applicationDetails, setApplicationDetails] = useState(null);
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [blockUserPhone, setBlockUserPhone] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockReason, setBlockReason] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        console.log('Attempting to fetch application details for ID:', applicationId);
        setIsLoading(true);
        setError(null);

        // Validate applicationId
        if (!applicationId) {
          throw new Error('No application ID provided');
        }

        const details = await superAdminApi.getApplicationManagementDetails(applicationId);
        
        console.log('Successfully fetched application details:', details);
        
        // Validate fetched details
        if (!details || !details._id) {
          throw new Error('Invalid application details received');
        }

        setApplicationDetails(details);
      } catch (err) {
        console.error('Detailed error fetching application details:', {
          error: err,
          applicationId: applicationId
        });

        // Set a user-friendly error message
        setError(
          err.message || 
          'Failed to fetch application details. Please try again or contact support.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [applicationId]);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (applicationDetails && applicationDetails._id) {
        try {
          const users = await superAdminApi.getBlockedUsersForApplication(applicationDetails._id);
          setBlockedUsers(users);
        } catch (err) {
          console.error('Error fetching blocked users:', err);
          // Optionally set an error state or show a notification
        }
      }
    };

    fetchBlockedUsers();
  }, [applicationDetails]);

  const validatePhoneNumber = (phone) => {
    // Ensure only digits, exactly 10 characters
    const sanitizedPhone = phone.replace(/\D/g, '');
    return sanitizedPhone.length === 10 ? sanitizedPhone : null;
  };

  const handleAddAdmin = async () => {
    try {
      // Validate phone number
      const validPhone = validatePhoneNumber(newAdminPhone);
      
      if (!validPhone) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      console.log('Attempting to add admin:', { 
        applicationId, 
        phoneNumber: validPhone 
      });

      const result = await superAdminApi.addApplicationAdmin(applicationId, validPhone);
      
      console.log('Admin added successfully:', result);

      // Update the local state with the new admin
      setApplicationDetails(prev => ({
        ...prev,
        admins: [...prev.admins, result.admin]
      }));

      // Reset form
      setNewAdminPhone('');
      setError(null);
    } catch (err) {
      console.error('Detailed error adding admin:', {
        error: err,
        applicationId: applicationId,
        phoneNumber: newAdminPhone
      });

      // Set a user-friendly error message
      setError(
        err.message || 
        'Failed to add admin. Please try again or contact support.'
      );
    }
  };

  const handleBlockUser = async () => {
    try {
      // Validate phone number
      const validPhone = validatePhoneNumber(blockUserPhone);
      
      if (!validPhone) {
        setError('Please enter a valid 10-digit phone number to block');
        return;
      }

      console.log('Attempting to block user:', { 
        applicationId, 
        phoneNumber: validPhone,
        reason: blockReason
      });

      const result = await superAdminApi.blockUserFromApplication(
        applicationId, 
        validPhone, 
        blockReason
      );
      
      console.log('User blocked successfully:', result);

      // Update blocked users list
      setBlockedUsers(prev => [...prev, {
        phoneNumber: validPhone,
        blockedAt: new Date().toISOString(),
        reason: blockReason
      }]);

      // Close modal and reset
      setActiveModal(null);
      setBlockUserPhone('');
      setBlockReason('');
      setError(null);
    } catch (err) {
      console.error('Detailed error blocking user:', {
        error: err,
        applicationId: applicationId,
        phoneNumber: blockUserPhone
      });

      setError(
        err.message || 
        'Failed to block user. Please try again or contact support.'
      );
    }
  };

  const handleUnblockUser = async (phoneNumber) => {
    try {
      console.log('Attempting to unblock user:', { 
        applicationId, 
        phoneNumber 
      });

      await superAdminApi.unblockUserFromApplication(applicationId, phoneNumber);
      
      // Remove user from blocked list
      setBlockedUsers(prev => 
        prev.filter(user => user.phoneNumber !== phoneNumber)
      );

      setError(null);
    } catch (err) {
      console.error('Detailed error unblocking user:', {
        error: err,
        applicationId: applicationId,
        phoneNumber: phoneNumber
      });

      setError(
        err.message || 
        'Failed to unblock user. Please try again or contact support.'
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <motion.div 
        className="flex justify-center items-center h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div 
        className="flex flex-col justify-center items-center h-screen p-4 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => navigate('/superadmin')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to Applications
        </button>
      </motion.div>
    );
  }

  // No application details found
  if (!applicationDetails) {
    return (
      <motion.div 
        className="flex flex-col justify-center items-center h-screen p-4 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="text-gray-500 text-xl mb-4">
          No application details found
        </div>
        <button 
          onClick={() => navigate('/superadmin')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to Applications
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div 
        className="container mx-auto p-6 pt-20" 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3 border-gray-200">
            {applicationDetails.name} Management
          </h1>

          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 font-medium">Application Management</p>
                <p className="text-lg font-semibold text-gray-800">
                  {applicationDetails.name}
                </p>
              </div>
              <motion.button
                onClick={() => setActiveModal('block')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition"
              >
                Block User
              </motion.button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Application Admins</h2>
            <AnimatePresence>
              <motion.div 
                className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {applicationDetails.admins && applicationDetails.admins.length > 0 ? (
                  applicationDetails.admins.map((admin, index) => (
                    <motion.div 
                      key={admin._id} 
                      className="flex justify-between items-center border-b last:border-b-0 py-3 border-gray-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div>
                        <p className="font-medium text-gray-800 text-base">
                          {admin.customId || 'N/A'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {admin.name || 'N/A'}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-base">
                      No additional admins have been added yet
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      You can add more admins using the input below
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-gray-100 px-3 py-2.5 rounded-l-xl border border-gray-200 text-gray-700">
                {applicationDetails.name}
              </div>
              <div className="flex-grow">
                <motion.input
                  type="tel"
                  value={newAdminPhone}
                  onChange={(e) => {
                    // Limit to 10 characters and only digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewAdminPhone(value);
                  }}
                  maxLength={10}
                  placeholder="Enter admin phone number"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                  whileFocus={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                />
              </div>
              <motion.button 
                onClick={handleAddAdmin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-500 text-white px-4 py-2.5 rounded-xl hover:bg-blue-600 transition"
              >
                Add Admin
              </motion.button>
            </div>
            
            {error && (
              <motion.p 
                className="text-red-500 mt-3 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Blocked Users</h2>
            <AnimatePresence>
              <motion.div 
                className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {blockedUsers && blockedUsers.length > 0 ? (
                  blockedUsers.map((user, index) => (
                    <motion.div 
                      key={user.phoneNumber} 
                      className="flex justify-between items-center border-b last:border-b-0 py-3 border-gray-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div>
                        <p className="font-medium text-gray-800 text-base">
                          {user.phoneNumber}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Blocked: {new Date(user.blockedAt).toLocaleString()}
                        </p>
                        {user.reason && (
                          <p className="text-gray-500 text-xs">
                            Reason: {user.reason}
                          </p>
                        )}
                      </div>
                      <motion.button
                        onClick={() => handleUnblockUser(user.phoneNumber)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition"
                      >
                        Unblock
                      </motion.button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-base">
                      No users are currently blocked
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Block users who violate application rules
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Block User Modal */}
      <AnimatePresence>
        {activeModal === 'block' && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold mb-4 text-gray-800">Block User</h2>
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 bg-gray-100 px-3 py-2.5 rounded-l-xl border border-gray-200 text-gray-700">
                  {applicationDetails.name}
                </div>
                <div className="flex-grow">
                  <input
                    type="tel"
                    value={blockUserPhone}
                    onChange={(e) => {
                      // Limit to 10 characters and only digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setBlockUserPhone(value);
                    }}
                    maxLength={10}
                    placeholder="Enter user phone to block"
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-0 focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Reason for blocking (optional)"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-0 focus:border-red-500 transition-colors"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleBlockUser}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition"
                >
                  Block User
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ApplicationManagement;
