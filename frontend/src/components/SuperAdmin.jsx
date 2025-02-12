import React from 'react'
import { getUserInfo } from '../utils/localStorageUtils'
import './Components.css'

function SuperAdmin() {
  const userInfo = getUserInfo()

  return (
    <div className="role-container">
      <div className="role-header">
        <h2>Super Admin Dashboard</h2>
        <span className="role-badge super-admin">Super Admin</span>
      </div>
      <div className="user-info">
        <p>Welcome, {userInfo?.name || 'Super Admin'}!</p>
      </div>
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>System Configuration</h3>
          <p>Manage system-wide settings and configurations</p>
        </div>
        <div className="dashboard-card">
          <h3>Admin Management</h3>
          <p>Manage admin accounts and roles</p>
        </div>
        <div className="dashboard-card">
          <h3>Security Settings</h3>
          <p>Configure security policies and access controls</p>
        </div>
        <div className="dashboard-card">
          <h3>Advanced Analytics</h3>
          <p>Access detailed system analytics and reports</p>
        </div>
      </div>
    </div>
  )
}

export default SuperAdmin