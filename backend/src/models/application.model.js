import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    customId: {
      type: String,
      unique: true,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    password: {
      type: String,
      select: false  // Hide password by default
    }
  }]
}, {
  timestamps: true,
  collection: 'applications'
});

// Pre-save hook to ensure unique name (case-insensitive)
applicationSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    const existingApp = await this.constructor.findOne({ 
      name: this.name.toLowerCase() 
    });
    if (existingApp && existingApp._id.toString() !== this._id.toString()) {
      throw new Error('Application with this name already exists');
    }
  }
  next();
});

// Method to validate admin login
applicationSchema.methods.validateAdminLogin = async function(phoneNumber, password) {
  const admin = this.admins.find(
    admin => admin.phoneNumber === phoneNumber && admin.isActive
  );

  if (!admin) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  
  return isMatch ? {
    customId: admin.customId,
    name: admin.name,
    phoneNumber: admin.phoneNumber
  } : null;
};

// Static method to find application by name and validate admin login
applicationSchema.statics.adminLogin = async function(applicationName, phoneNumber, password) {
  // Find the application by name
  const application = await this.findOne({ 
    name: applicationName.toLowerCase() 
  });

  if (!application) {
    throw new Error('Application not found');
  }

  // Find the admin in the application's admins array
  const admin = application.admins.find(
    admin => admin.phoneNumber === phoneNumber && admin.isActive
  );

  if (!admin) {
    throw new Error('Admin not found');
  }

  // Validate password
  const isMatch = await bcrypt.compare(password, admin.password);
  
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      applicationId: application._id, 
      adminId: admin.customId,
      phoneNumber: admin.phoneNumber,
      role: 'application_admin'
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1h' }
  );

  return {
    token,
    user: {
      customId: admin.customId,
      name: admin.name,
      phoneNumber: admin.phoneNumber,
      applicationName: application.name,
      role: 'application_admin'
    }
  };
};

// Pre-save hook to hash admin passwords
applicationSchema.pre('save', async function(next) {
  // Check if admins array is modified
  if (this.isModified('admins')) {
    // Iterate through admins and hash passwords
    for (let admin of this.admins) {
      // Only hash if password is provided and not already hashed
      if (admin.password && !admin.password.startsWith('$2')) {
        try {
          // Generate salt and hash
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(admin.password, salt);
        } catch (error) {
          // Log and continue to next admin
          console.error('Password hashing error:', error);
        }
      }
    }
  }
  next();
});

const Application = mongoose.model('Application', applicationSchema);

export default Application;
