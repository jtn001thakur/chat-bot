import express from 'express';
import chatController from '../controllers/chat.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// Route to send a message
router.post('/send', 
  authMiddleware.protect, 
  chatController.sendMessage
);

// Route to get messages
router.get('/messages', 
  authMiddleware.protect, 
  chatController.getMessages
);

module.exports = router;
