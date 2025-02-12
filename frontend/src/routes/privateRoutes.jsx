import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../components/Dashboard';
import NotFound from '../components/NotFound';
import User from '../components/User';
import Admin from '../components/Admin';
import SuperAdmin from '../components/SuperAdmin';
import ProfilePage from '../components/Profile';
import Header from '../components/Header';

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
    path: '*',
    element: <NotFound />
  }
];
