import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../utils/localStorageUtils';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  redirectPath = '/login' 
}) => {
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState({
    isLoggedIn: isAuthenticated(),
    role: getUserRole()
  });

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      setAuthStatus({
        isLoggedIn: isAuthenticated(),
        role: getUserRole()
      });
    };

    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Check authentication 
  if (!authStatus.isLoggedIn) {
    // Redirect to login, preserving the current location
    return <Navigate 
      to={redirectPath} 
      state={{ from: location }} 
      replace 
    />;
  }

  // Check role if required roles are specified
  if (requiredRoles.length > 0 && !requiredRoles.includes(authStatus.role)) {
    // Redirect to unauthorized page if role doesn't match
    return <Navigate 
      to="/unauthorized" 
      state={{ from: location }} 
      replace 
    />;
  }

  // Render children if authenticated and role is valid
  return children;
};

export default ProtectedRoute;