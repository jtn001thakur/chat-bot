import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../components/Dashboard';
import NotFound from '../components/NotFound';
import User from '../components/User';
import Admin from '../components/Admin';
import SuperAdmin from '../components/SuperAdmin';
import ProfilePage from '../components/Profile';
import Header from '../components/Header';
import ApplicationManagement from '../components/ApplicationManagement';

export const privateRoutes = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Header />
        <ProfilePage />
      </ProtectedRoute>
    )
  },
  {
    path: '/superadmin/applications/:applicationId/manage',
    element: (
      <ProtectedRoute>
        <Header />
        <ApplicationManagement />
      </ProtectedRoute>
    )
  },
  {
    path: '*',
    element: <NotFound />
  }
];
