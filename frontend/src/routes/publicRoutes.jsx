import { Navigate } from 'react-router-dom';
import Login from '../components/Login';
import Register from '../components/Register';
import ResetPassword from '../components/ResetPassword';
import NotFound from '../components/NotFound';

export const publicRoutes = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  },
  {
    path: '*',
    element: <NotFound />
  }
];
