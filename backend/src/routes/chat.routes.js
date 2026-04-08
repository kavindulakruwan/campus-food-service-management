const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, chatController.getMessages);
router.post('/', protect, chatController.postMessage);
router.post('/bot', protect, chatController.postBotMessage);

module.exports = router;