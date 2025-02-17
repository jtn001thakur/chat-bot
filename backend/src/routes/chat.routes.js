import express from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Route to send a message
router.post('/send-message', 
            verifyToken,
            chatController.sendMessage
);

// Route to get messages
router.post('/messages', 
            verifyToken,
            chatController.getMessages
);

export default router;
