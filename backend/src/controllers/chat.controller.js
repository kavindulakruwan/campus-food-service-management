const ChatMessage = require('../models/ChatMessage');

exports.getMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find()
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages.reverse());
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const newMessage = new ChatMessage({
      user: req.user.id,
      text: text.trim(),
    });

    const savedMessage = await newMessage.save();
    await savedMessage.populate('user', 'name role');
    
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('Error posting chat message:', err);
    res.status(500).json({ message: 'Server error' });
  }
};