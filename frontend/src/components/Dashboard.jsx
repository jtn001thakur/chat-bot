import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, handleLogout } from '../utils/localStorageUtils';
import Header from './Header';
import User from './User';
import Admin from './Admin';
import SuperAdmin from './SuperAdmin';

const Dashboard = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const userRole = userInfo?.role || 'user';

  const renderDashboard = () => {
    switch (userRole) {
      case 'user':
        return <User />;
      case 'admin':
        return <Admin />;
      case 'superadmin':
        return <SuperAdmin />;
      default:
        return (
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome</h1>
            <p className="text-gray-600 mb-6">
              Unable to determine user role. Please contact support.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleLogout()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="pt-16 px-4">
        {renderDashboard()}
      </main>
    </div>
  );
};

export default Dashboard;
