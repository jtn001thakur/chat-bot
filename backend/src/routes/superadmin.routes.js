import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  createApplication,
  getApplications,
  deleteApplication,
  getAllUsers,
  createUser,
  deleteUser,
  getSystemAnalytics,
  getApplicationManagementDetails,
  addApplicationAdmin,
  blockUserFromApplication,
  unblockUserFromApplication,
  getBlockedUsersForApplication
} from '../controllers/superadmin.controller.js';
import { isSuperAdmin } from '../middleware/role.middleware.js';

const router = express.Router();

// Application Routes
router.post(
  '/applications', 
  verifyToken, 
  createApplication
);

router.get(
  '/applications', 
  verifyToken, 
  getApplications
);

router.delete(
  '/applications/:id', 
  verifyToken, 
  deleteApplication
);

// Application Management Routes
router.get(
  '/applications/:id/manage', 
  verifyToken, 
  getApplicationManagementDetails
);

router.post(
  '/applications/:id/add-admin', 
  verifyToken, 
  addApplicationAdmin
);

// User Management Routes
router.get(
  '/users', 
  verifyToken, 
  getAllUsers
);

router.post(
  '/users', 
  verifyToken, 
  createUser
);

router.delete(
  '/users/:id', 
  verifyToken, 
  deleteUser
);

// Analytics Routes
router.get(
  '/analytics', 
  verifyToken, 
  getSystemAnalytics
);

// Block User from Application
router.post(
  '/applications/:id/block-user', 
  verifyToken, 
  isSuperAdmin, 
  blockUserFromApplication
);

// Unblock User from Application
router.post(
  '/applications/:id/unblock-user', 
  verifyToken, 
  isSuperAdmin, 
  unblockUserFromApplication
);

// Get Blocked Users for Application
router.get(
  '/applications/:id/blocked-users', 
  verifyToken, 
  isSuperAdmin, 
  getBlockedUsersForApplication
);

export default router;
