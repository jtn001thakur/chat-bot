import Message from '../models/message.model.js';
import User from '../models/user.model.js';

export const sendMessage = async (req, res) => {
  try {
    const {
      receiverId,
      content,
      application,
      metadata = {},
      role = 'external',
      phoneNumber
    } = req.body;

    // Validate required fields
    if (!content || !application) {
      return res.status(400).json({ 
        message: 'Content and application are required' 
      });
    }

    let sender = null;
    let receiverIds = [];

    // Determine sender based on role
    switch (role) {
      case 'user':
        // For user, create a unique external sender ID
        sender = `${application}${phoneNumber}`;
        break;
      
      case 'admin':
      case 'superadmin':
        // For admin/superadmin, use the provided receiverId or find a user
        if (receiverId) {
          const user = await User.findOne({ 
            $or: [
              { _id: receiverId },
              { combinedId: receiverId }
            ]
          });
          
          if (!user) {
            return res.status(404).json({ message: 'Receiver not found' });
          }
          
          sender = user._id;
          receiverIds = [receiverId];
        }
        break;
      
      case 'application_support':
        // For application support, use application as sender context
        sender = `app_${application}`;
        break;
      
      default:
        sender = 'unknown';
    }

    // Create new message
    const newMessage = new Message({
      sender: sender,
      externalSenderId: role === 'user' ? `${application}${phoneNumber}` : null,
      receivers: receiverIds,
      message: content,
      content,  // Duplicate for backward compatibility
      senderRole: role,
      application: application,
      metadata: metadata
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
    console.log('application : ', application)
    console.log('limit : ', limit)
    console.log('skip : ', skip)
    console.log('role : ', role)
    console.log('phoneNumber : ', phoneNumber)
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
