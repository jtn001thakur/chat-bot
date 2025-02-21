import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimesCircle, FaCommentAlt, FaArrowLeft } from 'react-icons/fa';
import { getUserInfo } from '../utils/localStorageUtils';
import { superAdminApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Chat from './Chat'; 
import './Components.css';

function SuperAdmin() {
  const userInfo = getUserInfo();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [newApplicationName, setNewApplicationName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [isChatFullScreen, setIsChatFullScreen] = useState(false);

  // Fetch applications on component mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        const fetchedApplications = await superAdminApi.getApplications();
        setApplications(fetchedApplications);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 
                             err.message || 
                             'An unknown error occurred';
        setError(`Failed to fetch applications: ${errorMessage}`);
        console.error('Detailed fetch applications error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Handle new application creation
  const handleCreateApplication = async (e) => {
    e.preventDefault();
    
    // Validate application name
    if (!newApplicationName.trim()) {
      setCreateError('Application name is required');
      return;
    }

    // Check for duplicate application (client-side validation)
    const isDuplicate = applications.some(
      app => app.name.toLowerCase() === newApplicationName.trim().toLowerCase()
    );

    if (isDuplicate) {
      setCreateError('An application with this name already exists');
      return;
    }

    try {
      setIsLoading(true);
      setCreateError(null);
      
      const createdApp = await superAdminApi.createApplication({
        name: newApplicationName.trim()
      });

      // Update applications list with new app
      setApplications([...applications, createdApp]);
      
      // Reset form
      setNewApplicationName('');
      setIsModalOpen(false);
    } catch (err) {
      // More detailed error handling
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        'Failed to create application';
      
      setCreateError(errorMessage);
      console.error('Create application error:', err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat button click
  const handleChatClick = (app) => {
    // Create a default user object for chat matching Chat component requirements
    const defaultChatUser = {
      application: app._id, // Use application ID as application
      phoneNumber: `app_${app._id}`, // Unique phone number
      name: `${app.name} Support`, // Use application name in chat user name
      role: 'application_support',
      _id: app._id // Maintain _id for message fetching
    };
    
    setSelectedChatUser(defaultChatUser);
    setIsChatFullScreen(true);
  };

  // Close chat
  const handleCloseChat = () => {
    setSelectedChatUser(null);
    setIsChatFullScreen(false);
  };

  // Go back to applications view from full-screen chat
  const handleBackToApplications = () => {
    setIsChatFullScreen(false);
  };

  // Function to handle application management navigation
  const handleManageApplication = (applicationId) => {
    navigate(`/superadmin/applications/${applicationId}/manage`);
  };

  // Modal variants for Framer Motion
  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9, 
      y: 50,
      transition: { duration: 0.3 }
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Application Management Section */}
      <AnimatePresence>
        {!isChatFullScreen ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Applications</h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition flex items-center"
              >
                <FaPlus className="w-5 h-5" />
              </button>
            </div>

            {/* Applications Grid */}
            {isLoading ? (
              <div className="text-center text-gray-500">Loading applications...</div>
            ) : error ? (
              <div className="text-center text-red-500">{error}</div>
            ) : applications.length === 0 ? (
              <div className="text-center text-gray-500">
                No applications created yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {applications.map((app) => (
                  <div 
                    key={app._id} 
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition flex flex-col"
                  >
                    <h3 className="text-lg font-semibold text-gray-800">{app.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      Created: {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex justify-end space-x-2 mt-2">
                      <button 
                        onClick={() => handleChatClick(app)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition flex items-center"
                      >
                        <FaCommentAlt className="mr-2" /> Chat
                      </button>
                      <button 
                        onClick={() => handleManageApplication(app._id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            {/* Full-screen Chat Header */}
            {/* <div className="bg-gray-100 p-4 flex items-center">
              <button 
                onClick={handleBackToApplications}
                className="mr-4 text-gray-700 hover:text-gray-900"
              >
                <FaArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-semibold">
                {selectedChatUser?.name || 'Application Chat'}
              </h2>
            </div> */}

            {/* Full-screen Chat Component */}
            <div className="flex-grow overflow-hidden">
              <Chat 
                initialUser={selectedChatUser} 
                onClose={handleCloseChat} 
                fullScreen={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS-like Modal for Creating Application */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white w-96 rounded-xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Create Application
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateApplication}>
                <div className="mb-4">
                  <label 
                    htmlFor="appName" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Application Name
                  </label>
                  <input
                    type="text"
                    id="appName"
                    value={newApplicationName}
                    onChange={(e) => {
                      setNewApplicationName(e.target.value);
                      setCreateError(null);
                    }}
                    placeholder="Enter application name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {createError && (
                    <p className="text-red-500 text-sm mt-2">{createError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-md text-white transition ${
                    isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? 'Creating...' : 'Create Application'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SuperAdmin;