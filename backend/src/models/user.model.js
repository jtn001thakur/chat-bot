import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: 'Phone number must be a 10-digit number',
      },
    },
    avatar: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    combinedId: {
      type: String,
      sparse: true,
    },
    sessions: [
      {
        deviceId: {
          type: String,
          default: () => uuidv4(),
          required: true,
        },
        device: {
          type: String,
          required: true,
        },
        lastActive: {
          type: Date,
          default: Date.now,
        },
        ipAddress: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

// userSchema.index({ combinedId: 1 }, { unique: true, sparse: true });

userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password along with the salt
    this.password = await bcrypt.hash(this.password, salt);
    
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.revokeAllSessions = function () {
  this.sessions = [];
  return this.save();
};

userSchema.methods.revokeSession = function (sessionId) {
  this.sessions = this.sessions.filter((session) => session.deviceId !== sessionId);
  return this.save();
};

export default mongoose.model('User', userSchema);
