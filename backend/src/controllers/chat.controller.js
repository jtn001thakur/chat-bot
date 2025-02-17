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

    // console.log("Received message payload:", {
    //   message,
    //   receiver,
    //   application,
    //   metadata,
    //   role,
    //   phoneNumber
    // });

    let sender = null;
    let receiverIds = [];

    if (role === 'user') {
      // Create sender details for external user
      sender = `${application}${phoneNumber}`;
    } else if (role === 'admin' || role === 'superadmin') {
      // Existing admin/superadmin logic
      const user = await User.findOne({ 
        $or: [
          { _id: receiver },
          { combinedId: receiver }
        ]
      });
      
      if (!user) {
        return res.status(404).json({ message: 'Receiver not found' });
      }
      
      sender = user._id;
      
      // If a specific receiver is provided
      if (receiver) {
        receiverIds = [receiver];
      }
    }

    // Determine receivers based on role
    if (receiver) {
      receiverIds = [receiver];
    } else if (role === 'user') {
      // For user messages, leave receivers empty or set to support
      receiverIds = [];
    }

    const newMessage = new Message({
      // Optional sender details
      sender: sender,
      externalSenderId: role === 'user' ? `${application}${phoneNumber}` : null,

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
    const userId = role === 'user' ? `${application}${phoneNumber}` : null;
    
    // console.log("getMessages body ", req.body, "user id : ", userId);

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
      ];
    }

    // Fetch messages with pagination and enrich with sender details
    const messages = await Message.aggregate([
      { $match: query },
      // Sort in ascending order by creation time
      { $sort: { createdAt: 1 } },
      { $skip: skip || 0 },
      { $limit: limit || 100 },
      {
        $addFields: {
          senderInfo: {
            application: '$application',
            phoneNumber: { $substr: ['$sender', application.length, -1] }
          }
        }
      }
    ]);

    // Count total messages for pagination
    const totalMessages = await Message.countDocuments(query);

    return res.status(200).json({
      messages,
      total: totalMessages
    });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return res.status(500).json({
      message: 'Error retrieving messages',
      error: error.message
    });
  }
};
