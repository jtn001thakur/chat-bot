import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
    FaCrown,
  FaShieldAlt
} from 'react-icons/fa';
import { getUserInfo } from '../utils/localStorageUtils';
import { useNavigate } from 'react-router-dom';

const RoleBadge = ({ role }) => {
  const badgeStyles = {
    'superadmin': 'bg-purple-500 text-white',
    'admin': 'bg-blue-500 text-white',
    'user': 'bg-green-500 text-white'
  };

  const badgeIcons = {
    'superadmin': <FaCrown className="mr-1" />,
    'admin': <FaShieldAlt className="mr-1" />,
    'user': <FaUser className="mr-1" />
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[role] || 'bg-gray-100 text-gray-800'}`}>
      {badgeIcons[role]}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo) {
      navigate('/login');
    } else {
      setUser(userInfo);
    }
  }, [navigate]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center relative">
          <div className="absolute top-4 right-4">
            <RoleBadge role={user.role || 'user'} />
          </div>
          
          <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-full flex items-center justify-center text-6xl font-bold text-indigo-600 shadow-lg">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          
          <h2 className="text-3xl font-bold text-white">{user.name || 'User Profile'}</h2>
        </div>

        {/* Profile Details */}
        <div className="p-8 space-y-6">
          {/* Name Section */}
          <div className="flex items-center border-b pb-4">
            <FaUser className="text-indigo-600 text-2xl mr-4" />
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="text-xl font-semibold">{user.name || 'Not provided'}</p>
            </div>
          </div>

          {/* Phone Section */}
          <div className="flex items-center border-b pb-4">
            <FaPhone className="text-green-600 text-2xl mr-4" />
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="text-xl font-semibold">{user.phoneNumber || 'Not provided'}</p>
            </div>
          </div>

          {/* Role Section */}
          <div className="flex items-center border-b pb-4">
            <FaShieldAlt className="text-blue-600 text-2xl mr-4" />
            <div>
              <p className="text-sm text-gray-500">User Role</p>
              <p className="text-xl font-semibold capitalize">{user.role || 'User'}</p>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              Your profile is managed by the system administrator. 
              For any changes, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
