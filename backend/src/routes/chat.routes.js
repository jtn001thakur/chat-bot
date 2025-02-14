import express from 'express';
import * as chatController from '../controllers/chat.controller.js';

const router = express.Router();

// Route to send a message
router.post('/send-message', 
  chatController.sendMessage
);

// Route to get messages
router.post('/messages', 
  chatController.getMessages
);

export default router;
