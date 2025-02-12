import React from 'react'
import { getUserInfo } from '../utils/localStorageUtils'
import './Components.css'

function Admin() {
  const userInfo = getUserInfo()

  return (
    <div className="role-container">
      <div className="role-header">
        <h2>Admin Dashboard</h2>
        <span className="role-badge admin">Admin</span>
      </div>
      <div className="user-info">
        <p>Welcome, {userInfo?.name || 'Admin'}!</p>
      </div>
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>User Management</h3>
          <p>Manage user accounts and permissions</p>
        </div>
        <div className="dashboard-card">
          <h3>Chat Monitoring</h3>
          <p>Monitor and moderate chat activities</p>
        </div>
        <div className="dashboard-card">
          <h3>Analytics</h3>
          <p>View chat analytics and reports</p>
        </div>
      </div>
    </div>
  )
}

export default Admin