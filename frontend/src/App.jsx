import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getUserInfo, isAuthenticated } from './utils/localStorageUtils';
import { publicRoutes } from './routes/publicRoutes';
import { privateRoutes } from './routes/privateRoutes';
import Unauthorized from './components/Unauthorized';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (isAuthenticated()) {
          const userInfo = getUserInfo();
          setUserRole(userInfo?.role || 'user');
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    window.addEventListener('authChange', checkAuth);
    return () => window.removeEventListener('authChange', checkAuth);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      {publicRoutes.map((route) => (
        <Route 
          key={route.path} 
          path={route.path} 
          element={route.element} 
        />
      ))}

      {/* Private Routes */}
      {privateRoutes.map((route) => (
        <Route 
          key={route.path} 
          path={route.path} 
          element={route.element} 
        />
      ))}

      {/* Unauthorized Route */}
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}

export default App;
