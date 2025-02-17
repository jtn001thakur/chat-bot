import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 50
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
      const error = new Error('Application with this name already exists');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

const Application = mongoose.model('Application', applicationSchema);

export default Application;
