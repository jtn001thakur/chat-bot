import Application from '../models/application.model.js';
import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import BlockedUser from '../models/blockedUser.model.js';

// Add role checking for superadmin routes
const checkSuperAdminRole = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ 
      message: 'Access denied. Superadmin role required.',
      error: 'FORBIDDEN' 
    });
  }
  next();
};

// Application Management
export const createApplication = async (req, res) => {
  try {
    // Ensure only superadmin can create applications
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ 
        message: 'Access denied. Superadmin role required.',
        error: 'FORBIDDEN' 
      });
    }

    const { name } = req.body;

    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        message: 'Application name is required',
        error: 'INVALID_INPUT' 
      });
    }

    // Trim and lowercase the name to ensure consistency
    const normalizedName = name.trim().toLowerCase();

    try {
      // Debugging: Log user information
      console.log('User creating application:', {
        userId: req.user.id,
        userRole: req.user.role,
        userName: req.user.phoneNumber
      });

      // Create new application
      const newApplication = new Application({
        name: normalizedName,
        createdBy: req.user.id,
        status: 'active',
        admins: [req.user.id]  
      });

      // Debugging: Log application before saving
      console.log('New Application Object:', {
        name: newApplication.name,
        createdBy: newApplication.createdBy,
        status: newApplication.status
      });

      await newApplication.save();

      res.status(201).json({
        _id: newApplication._id,
        name: newApplication.name,
        status: newApplication.status,
        createdAt: newApplication.createdAt
      });
    } catch (saveError) {
      // Handle mongoose validation errors
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({ 
          message: saveError.message,
          error: 'VALIDATION_ERROR' 
        });
      }

      throw saveError;  // Re-throw other errors
    }
  } catch (error) {
    console.error('Create Application Error:', error);
    res.status(500).json({ 
      message: 'Failed to create application',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
};

export const getApplications = async (req, res) => {
  try {
    // First check superadmin role
    checkSuperAdminRole(req, res, async () => {
      const applications = await Application.find()
        .populate('createdBy', 'name phoneNumber')
        .sort({ createdAt: -1 });

      res.status(200).json(applications);
    });
  } catch (error) {
    console.error('Get Applications Error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch applications',
      error: 'SERVER_ERROR' 
    });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    // First check superadmin role
    checkSuperAdminRole(req, res, async () => {
      const { id } = req.params;

      // Find the application
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({ 
          message: 'Application not found' 
        });
      }

      // Delete the application
      await Application.findByIdAndDelete(id);

      res.status(200).json({ 
        message: 'Application deleted successfully' 
      });
    });
  } catch (error) {
    console.error('Delete Application Error:', error);
    res.status(500).json({ 
      message: 'Failed to delete application',
      error: 'SERVER_ERROR' 
    });
  }
};

// Application Management Details
export const getApplicationManagementDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Received request for application management details:', { 
      applicationId: id, 
      user: req.user 
    });

    // Find application with populated admins, excluding superadmin
    const application = await Application.findById(id)
      .populate({
        path: 'createdBy', 
        select: 'name phoneNumber'
      })
      .populate({
        path: 'admins', 
        select: 'name phoneNumber role',
        match: { role: { $ne: 'superadmin' } } // Exclude superadmin
      });

    console.log('Found application details:', {
      application: application ? {
        _id: application._id,
        name: application.name,
        status: application.status,
        createdBy: application.createdBy,
        admins: application.admins
      } : null
    });

    if (!application) {
      return res.status(404).json({
        message: 'Application not found',
        error: 'NOT_FOUND'
      });
    }

    // Generate custom admin identifiers
    const adminsWithCustomId = application.admins.map((admin, index) => ({
      _id: admin._id,
      name: admin.name,
      phoneNumber: admin.phoneNumber,
      customId: `${application.name.toLowerCase().replace(/\s+/g, '')}${index + 1}${admin.phoneNumber.slice(-4)}`
    }));

    res.status(200).json({
      _id: application._id,
      name: application.name,
      status: application.status,
      createdBy: {
        name: application.createdBy.name,
        phoneNumber: application.createdBy.phoneNumber
      },
      admins: adminsWithCustomId
    });
  } catch (error) {
    console.error('Get Application Management Details Error:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Failed to retrieve application details',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
};

export const addApplicationAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { phoneNumber } = req.body;

    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({
        message: 'Phone number is required',
        error: 'INVALID_INPUT'
      });
    }

    // Find user by phone number
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Find application
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        message: 'Application not found',
        error: 'NOT_FOUND'
      });
    }

    // Check if user is already an admin
    if (application.admins.includes(user._id)) {
      return res.status(400).json({
        message: 'User is already an admin of this application',
        error: 'ALREADY_ADMIN'
      });
    }

    // Add user to admins
    application.admins.push(user._id);
    await application.save();

    res.status(200).json({
      message: 'Admin added successfully',
      admin: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Add Application Admin Error:', error);
    res.status(500).json({
      message: 'Failed to add application admin',
      error: 'SERVER_ERROR'
    });
  }
};

// User Management
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Exclude password
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users', 
      error: error.message 
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { 
      name, 
      phoneNumber, 
      role, 
      password, 
      application 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      phoneNumber, 
      application 
    });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this phone number already exists' 
      });
    }

    // Create new user
    const newUser = new User({
      name,
      phoneNumber,
      role: role || 'user',
      password,
      application
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        application: newUser.application
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      message: 'Failed to create user', 
      error: error.message 
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    res.status(200).json({ 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      message: 'Failed to delete user', 
      error: error.message 
    });
  }
};

// Analytics and Reporting
export const getSystemAnalytics = async (req, res) => {
  try {
    const analytics = {
      totalApplications: await Application.countDocuments(),
      totalUsers: await User.countDocuments(),
      totalMessages: await Message.countDocuments(),
      usersByRole: await User.aggregate([
        { $group: { 
          _id: '$role', 
          count: { $sum: 1 } 
        }}
      ]),
      messagesByApplication: await Message.aggregate([
        { $group: { 
          _id: '$application', 
          count: { $sum: 1 } 
        }}
      ])
    };

    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch system analytics', 
      error: error.message 
    });
  }
};

// Block User from Application
export const blockUserFromApplication = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const { phoneNumber, reason = '' } = req.body;

    // Validate application
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ 
        message: 'Application not found',
        error: 'NOT_FOUND'
      });
    }

    // Validate phone number
    const sanitizedPhone = phoneNumber.replace(/\D/g, '');
    if (sanitizedPhone.length !== 10) {
      return res.status(400).json({
        message: 'Invalid phone number',
        error: 'INVALID_PHONE'
      });
    }

    // Block the user
    const blockedUser = await BlockedUser.blockUser(
      applicationId, 
      sanitizedPhone, 
      req.user._id, 
      reason
    );

    res.status(201).json({
      message: 'User blocked successfully',
      blockedUser: {
        phoneNumber: blockedUser.phoneNumber,
        blockedAt: blockedUser.blockedAt
      }
    });
  } catch (error) {
    console.error('Block User Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to block user',
      error: 'SERVER_ERROR'
    });
  }
};

// Unblock User from Application
export const unblockUserFromApplication = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const { phoneNumber } = req.body;

    // Validate application
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ 
        message: 'Application not found',
        error: 'NOT_FOUND'
      });
    }

    // Validate phone number
    const sanitizedPhone = phoneNumber.replace(/\D/g, '');
    if (sanitizedPhone.length !== 10) {
      return res.status(400).json({
        message: 'Invalid phone number',
        error: 'INVALID_PHONE'
      });
    }

    // Unblock the user
    const unblockedUser = await BlockedUser.unblockUser(
      applicationId, 
      sanitizedPhone, 
      req.user._id
    );

    res.status(200).json({
      message: 'User unblocked successfully',
      unblockedUser: {
        phoneNumber: unblockedUser.phoneNumber,
        unBlockedAt: unblockedUser.unBlockedAt
      }
    });
  } catch (error) {
    console.error('Unblock User Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to unblock user',
      error: 'SERVER_ERROR'
    });
  }
};

// Get Blocked Users for an Application
export const getBlockedUsersForApplication = async (req, res) => {
  try {
    const { id: applicationId } = req.params;

    // Validate application
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ 
        message: 'Application not found',
        error: 'NOT_FOUND'
      });
    }

    // Find active blocked users
    const blockedUsers = await BlockedUser.find({
      application: applicationId,
      isActive: true
    }).populate('blockedBy', 'name phoneNumber');

    res.status(200).json({
      blockedUsers: blockedUsers.map(user => ({
        phoneNumber: user.phoneNumber,
        blockedAt: user.blockedAt,
        reason: user.reason,
        blockedBy: {
          name: user.blockedBy.name,
          phoneNumber: user.blockedBy.phoneNumber
        }
      }))
    });
  } catch (error) {
    console.error('Get Blocked Users Error:', error);
    res.status(500).json({
      message: 'Failed to retrieve blocked users',
      error: 'SERVER_ERROR'
    });
  }
};
