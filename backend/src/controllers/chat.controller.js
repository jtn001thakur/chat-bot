import Message from '../models/message.model.js';
import User from '../models/user.model.js';

export const sendMessage = async (req, res) => {
  try {
    const {
      receiver,
      message,
      application,
      metadata,
      role,
      phoneNumber
    } = req.body;

    console.log("Received message payload:", {
      message,
      receiver,
      application,
      metadata,
      role,
      phoneNumber
    });

    let receiverIds = [];
    let sender = null;

    if (role === 'user') {
      // For external/mobile app users
      // Find admins and superadmins for the specific application
      const adminUsers = await User.find({
        $or: [
          { role: 'admin', applications: { $in: [application] } },
          { role: 'superadmin' }
        ]
      }).select('_id');

      receiverIds = adminUsers.map(user => user._id);
      
      // Create sender details for external user
      sender = {
        _id: `${application}:${phoneNumber}`
      };
    } else if (role === 'admin' || role === 'superadmin') {
      // Existing admin/superadmin logic
      const receiverUser = await User.findOne({ 
        $or: [
          { _id: receiver },
          { combinedId: receiver }
        ]
      });
      
      if (!receiverUser) {
        return res.status(404).json({ message: 'Receiver not found' });
      }
      
      receiverIds = [receiverUser._id];
    }

    const newMessage = new Message({
      // Optional sender details
      sender: sender ? sender._id : null,
      externalSenderId: role === 'user' ? `${application}:${phoneNumber}` : null,

      // Receivers
      receivers: receiverIds,

      // Message content
      message: message,
      content: message,  // Duplicate for backward compatibility

      // Sender details
      senderRole: role || 'external',

      // Application details
      application: application,

      // Metadata
      metadata: metadata || {}
    });

    await newMessage.save();

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessages: [newMessage]
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({
      message: 'Failed to send message',
      error: error.message,
      details: error.errors || {}
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const {
      application,
      limit,
      skip,
      role,
      phoneNumber
    } = req.body;
    
    // For user role, create a unique userId
    const userId = role === 'user' ? `${application}:${phoneNumber}` : null;
    
    console.log("getMessages body ", req.body);

    // Validate required parameters
    if (!application) {
      return res.status(400).json({
        message: 'Application is required'
      });
    }

    const query = {
      application: application
    };

    // If not a superadmin, filter messages
    if (role !== 'superadmin') {
      query.$or = [
        // Messages where user is a receiver
        { receivers: userId },

        // Messages from the user
        { sender: userId },

        // Messages for admin/superadmin in their applications
        ...(role === 'admin' ? [
          {
            senderRole: 'user',
            application: application
          }
        ] : [])
      ];
    }

    // Fetch messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip || 0)
      .limit(limit || 50)
      .populate('sender', 'name')
      .populate('receivers', 'name');

    // Count total messages
    const total = await Message.countDocuments(query);

    res.status(200).json({
      messages: messages,
      total: total,
      userDetails: null  // You can populate this if needed
    });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({
      message: 'Error retrieving messages',
      error: error.message,
      details: error.toString()
    });
  }
};
