import Chat from '../models/chat.model.js';
import User from '../models/user.model.js';
import Application from '../models/application.model.js';

exports.sendMessage = async (req, res) => {
  try {
    const { receiver, message, application } = req.body;

    // Validate receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Validate application if provided (for admin)
    let applicationDoc = null;
    if (application && req.user.role !== 'superadmin') {
      applicationDoc = await Application.findById(application);
      if (!applicationDoc) {
        return res.status(404).json({ message: 'Application not found' });
      }
    }

    // Role-based message sending
    const newChat = new Chat({
      sender: req.user._id,
      receiver,
      message,
      senderRole: req.user.role,
      application: applicationDoc ? applicationDoc._id : null
    });

    await newChat.save();

    res.status(201).json({
      message: 'Message sent successfully',
      chat: newChat
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error sending message', 
      error: error.message 
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    let query = {};

    // User can only see their own messages
    if (req.user.role === 'user') {
      query = {
        $or: [
          { sender: req.user._id },
          { receiver: req.user._id }
        ]
      };
    } 
    // Admin can see messages for their specific applications
    else if (req.user.role === 'admin') {
      const adminApplications = await Application.find({ admin: req.user._id }).select('_id');
      const applicationIds = adminApplications.map(app => app._id);

      query = {
        $or: [
          { 
            sender: req.user._id,
            application: { $in: applicationIds }
          },
          { 
            receiver: req.user._id,
            application: { $in: applicationIds }
          }
        ]
      };
    }
    // Superadmin can see all messages
    // No additional query needed for superadmin

    const messages = await Chat.find(query)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('application', 'name')
      .sort({ createdAt: -1 });

    // Mark messages as read for the current user
    await Chat.updateMany(
      { 
        receiver: req.user._id, 
        isRead: false 
      }, 
      { isRead: true }
    );

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving messages', 
      error: error.message 
    });
  }
};
