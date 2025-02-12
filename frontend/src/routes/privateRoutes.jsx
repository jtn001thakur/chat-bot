import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../components/Dashboard';
import NotFound from '../components/NotFound';
import User from '../components/User';
import Admin from '../components/Admin';
import SuperAdmin from '../components/SuperAdmin';

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
    path: '/user',
    element: (
      <ProtectedRoute requiredRoles={['user']}>
        <User />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRoles={['admin']}>
        <Admin />
      </ProtectedRoute>
    )
  },
  {
    path: '/superadmin',
    element: (
      <ProtectedRoute requiredRoles={['superadmin']}>
        <SuperAdmin />
      </ProtectedRoute>
    )
  },
  {
    path: '*',
    element: <NotFound />
  }
];
