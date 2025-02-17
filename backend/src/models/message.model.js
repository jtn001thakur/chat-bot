import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // Sender can be a User reference or external identifier
  sender: { 
    type: mongoose.Schema.Types.Mixed,
    refPath: 'senderModel',
    required: false 
  },
  
  // Specify the model for sender
  senderModel: {
    type: String,
    enum: ['User', 'ExternalSender'],
    default: 'User'
  },

  // External sender details
  externalSenderId: {
    type: String,
    required: false
  },

  // Receivers can be multiple User references
  receivers: [{ 
    type: mongoose.Schema.Types.Mixed,
    refPath: 'receiverModel',
    required: false 
  }],

  // Specify the model for receivers
  receiverModel: {
    type: String,
    enum: ['User', 'ExternalReceiver'],
    default: 'User'
  },

  // Flexible message content
  message: { 
    type: String, 
    required: true 
  },

  // Optional content for backward compatibility
  content: { 
    type: String, 
    required: false 
  },

  // Sender role with more flexibility
  senderRole: { 
    type: String, 
    enum: ['user', 'admin', 'superadmin', 'external'],
    default: 'external' 
  },

  // Application as a string
  application: { 
    type: String, 
    required: true 
  },

  // Flexible metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  // Allow additional fields not in schema
  strict: false 
});

// Compound index for efficient querying
// messageSchema.index({ 
//   application: 1, 
//   createdAt: -1 
// });

const Message = mongoose.model('Message', messageSchema);

export default Message;
