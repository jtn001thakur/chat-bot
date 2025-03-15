import React, { useState, useEffect } from 'react'
import { getUserInfo, getUserRole } from '../utils/localStorageUtils'
import { adminApi, chatApi } from '../utils/api'
import Chat from './Chat'
import { FaArrowLeft, FaArrowRight, FaCommentAlt, FaExclamationTriangle } from 'react-icons/fa'
import './Components.css'

function Admin() {
  const userInfo = getUserInfo()
  const userRole = getUserRole()
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeAppIndex, setActiveAppIndex] = useState(0)

  // Fetch applications when component mounts
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // For admin, use the applications from userInfo
        if (userRole === 'admin') {
          const userApps = userInfo?.applications || []
          setApplications(userApps)
          if (userApps.length > 0) {
            setSelectedApplication(userApps[0])
          }
        } else if (userRole === 'superadmin') {
          // For superadmin, fetch all applications
          const fetchedApplications = await adminApi.getAdminApplications()
          setApplications(fetchedApplications)
          if (fetchedApplications.length > 0) {
            setSelectedApplication(fetchedApplications[0])
          }
        }
      } catch (err) {
        console.error('Error fetching applications:', err)
        setError('Failed to fetch applications. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplications()
  }, []) // Empty dependency array to run only once on mount

  // Create a default chat user for the selected application
  const getChatUser = () => {
    if (!selectedApplication) {
      // Return a placeholder user for empty state
      return {
        _id: 'placeholder',
        application: 'placeholder',
        phoneNumber: 'placeholder',
        name: 'Support System',
        role: 'system'
      }
    }

    return {
      _id: selectedApplication._id,
      application: selectedApplication._id,
      phoneNumber: `app_${selectedApplication._id}`,
      name: `${selectedApplication.name} Support`,
      role: 'application_support'
    }
  }

  // Handle application navigation for superadmin
  const handlePrevApp = () => {
    if (activeAppIndex > 0) {
      const newIndex = activeAppIndex - 1
      setActiveAppIndex(newIndex)
      setSelectedApplication(applications[newIndex])
    }
  }

  const handleNextApp = () => {
    if (activeAppIndex < applications.length - 1) {
      const newIndex = activeAppIndex + 1
      setActiveAppIndex(newIndex)
      setSelectedApplication(applications[newIndex])
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
        <p className="ml-3 text-blue-500">Loading applications...</p>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <FaExclamationTriangle className="inline-block mr-2" />
        {error}
        <p className="mt-2 text-sm">Please refresh the page or contact support if the problem persists.</p>
      </div>
    )
  }

  return (
    <div className="role-container admin-dashboard">
      {userRole === 'superadmin' ? (
        // SuperAdmin view with application navigation
        <div className="dashboard-grid superadmin-layout">
          <div className="dashboard-section applications-list">
            <div className="app-navigation">
              <h3>Applications {applications.length > 0 ? `(${activeAppIndex + 1}/${applications.length})` : ''}</h3>
              <div className="navigation-controls">
                <button 
                  onClick={handlePrevApp} 
                  disabled={activeAppIndex === 0 || applications.length === 0}
                  className={`nav-button ${activeAppIndex === 0 || applications.length === 0 ? 'disabled' : ''}`}
                >
                  <FaArrowLeft />
                </button>
                <button 
                  onClick={handleNextApp} 
                  disabled={activeAppIndex === applications.length - 1 || applications.length === 0}
                  className={`nav-button ${activeAppIndex === applications.length - 1 || applications.length === 0 ? 'disabled' : ''}`}
                >
                  <FaArrowRight />
                </button>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="text-center text-gray-500 p-4">
                <p>No applications assigned</p>
                <p className="text-sm">Contact support for assistance</p>
              </div>
            ) : (
              <div className="current-app-info">
                <h4>{selectedApplication?.name}</h4>
                <div className="app-stats">
                  <p>Users: {selectedApplication?.userCount || 0}</p>
                  <p>Chats: {selectedApplication?.chatCount || 0}</p>
                </div>
              </div>
            )}
          </div>

          <div className="dashboard-section chat-section">
            {selectedApplication ? (
              <Chat 
                initialUser={getChatUser()} 
                fullScreen={true} 
              />
            ) : (
              <div className="no-app-selected">
                <p>No applications available</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Regular Admin view - direct chat interface
        <div className="dashboard-grid admin-layout">
          <div className="dashboard-section chat-section">
            {userInfo?.applications && userInfo.applications.length > 0 ? (
              <Chat 
                initialUser={{
                  _id: userInfo.applications[0]._id,
                  application: userInfo.applications[0]._id,
                  phoneNumber: `app_${userInfo.applications[0]._id}`,
                  name: `${userInfo.applications[0].name} Support`,
                  role: 'application_support'
                }} 
                fullScreen={true}
              />
            ) : (
              <Chat 
                initialUser={{
                  _id: 'placeholder',
                  application: 'placeholder',
                  phoneNumber: 'placeholder',
                  name: 'Support System',
                  role: 'system'
                }}
                fullScreen={true}
                initialMessages={[
                  {
                    _id: 'system-message-1',
                    content: 'No applications are currently assigned to your account.',
                    sender: 'system',
                    timestamp: new Date().toISOString(),
                    isSystemMessage: true
                  },
                  {
                    _id: 'system-message-2',
                    content: 'Please contact the system administrator for assistance.',
                    sender: 'system',
                    timestamp: new Date().toISOString(),
                    isSystemMessage: true
                  }
                ]}
                disableInput={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin