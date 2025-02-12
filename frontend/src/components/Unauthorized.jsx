import React from 'react';
import { useNavigate } from 'react-router-dom';
import { handleLogout } from '../utils/localStorageUtils';

const Unauthorized = () => {
  const navigate = useNavigate();

  const handleLogoutAndRedirect = () => {
    handleLogout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Unauthorized</h1>
        <p className="text-gray-700 mb-6">
          You do not have permission to access this page.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Go Home
          </button>
          <button
            onClick={handleLogoutAndRedirect}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
