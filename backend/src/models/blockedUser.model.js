import mongoose from 'mongoose';

const blockedUserSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    default: 'No reason provided'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  blockedAt: {
    type: Date,
    default: Date.now
  },
  unBlockedAt: {
    type: Date,
    default: null
  },
  unBlockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate blocked entries
blockedUserSchema.index({ application: 1, phoneNumber: 1 }, { unique: true });

// Method to block a user
blockedUserSchema.statics.blockUser = async function(
  applicationId, 
  phoneNumber, 
  blockedBy, 
  reason = ''
) {
  // Check if user is already blocked for this application
  const existingBlock = await this.findOne({ 
    application: applicationId, 
    phoneNumber, 
    isActive: true 
  });

  if (existingBlock) {
    throw new Error('User is already blocked for this application');
  }

  // Create new blocked user entry
  const blockedUser = new this({
    application: applicationId,
    phoneNumber,
    blockedBy,
    reason,
    isActive: true,
    blockedAt: new Date()
  });

  return blockedUser.save();
};

// Method to unblock a user
blockedUserSchema.statics.unblockUser = async function(
  applicationId, 
  phoneNumber
) {
  // Find the active block for this application and phone number
  const blockedUser = await this.findOne({ 
    application: applicationId, 
    phoneNumber, 
    isActive: true 
  });

  if (!blockedUser) {
    throw new Error('No active block found for this user');
  }

  // Update the block to inactive
  blockedUser.isActive = false;
  blockedUser.unBlockedAt = new Date();

  return blockedUser.save();
};

const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);

export default BlockedUser;
