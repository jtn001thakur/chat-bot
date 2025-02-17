import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['registration', 'reset_password', 'login'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3 // Maximum number of verification attempts
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Optional, as OTP might be for unregistered users
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // MongoDB will automatically delete the document when it expires
    }
  },
  { 
    timestamps: true 
  }
);

// Compound index to prevent multiple unverified OTPs for same phone and purpose
otpSchema.index({ phoneNumber: 1, purpose: 1, isVerified: 1 }, { unique: true });

// Static method to generate OTP
otpSchema.statics.generateOTP = async function(phoneNumber, purpose) {
  // Delete any existing OTPs for this phone number and purpose
  await this.deleteMany({ phoneNumber, purpose });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Create new OTP record with explicit expiration
  const otpRecord = new this({
    phoneNumber,
    otp,
    purpose,
    attempts: 0,
    isVerified: false,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  });

  await otpRecord.save();
  return otpRecord;
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(phoneNumber, otp, purpose) {
  // Find the OTP record
  const otpRecord = await this.findOne({ 
    phoneNumber, 
    purpose,
    isVerified: false 
  });

  if (!otpRecord) {
    throw new Error('No OTP found');
  }

  // Check if OTP has expired
  if (otpRecord.expiresAt < new Date()) {
    await otpRecord.deleteOne();
    throw new Error('OTP has expired');
  }

  // Check max attempts
  if (otpRecord.attempts >= 3) {
    await otpRecord.deleteOne();
    throw new Error('Max OTP attempts exceeded');
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    if (otpRecord.attempts >= 3) {
      await otpRecord.deleteOne();
      throw new Error('Max OTP attempts exceeded');
    }

    throw new Error('Invalid OTP');
  }

  // Mark as verified
  otpRecord.isVerified = true;
  await otpRecord.save();

  return otpRecord;
};

export default mongoose.model('Otp', otpSchema);
