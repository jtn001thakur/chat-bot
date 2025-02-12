import React from 'react'
import { getUserInfo } from '../utils/localStorageUtils'
import './Components.css'

function User() {
  const userInfo = getUserInfo()

  return (
    <div className="role-container">
      <div className="role-header">
        <h2>User Dashboard</h2>
        <span className="role-badge">User</span>
      </div>
      <div className="user-info">
        <p>Welcome, {userInfo?.name || 'User'}!</p>
      </div>
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>My Chats</h3>
          <p>View and manage your chat history</p>
        </div>
        <div className="dashboard-card">
          <h3>Profile</h3>
          <p>Update your profile information</p>
        </div>
      </div>
    </div>
  )
}

export default User