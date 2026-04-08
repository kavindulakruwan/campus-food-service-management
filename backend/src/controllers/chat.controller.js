const ChatMessage = require('../models/ChatMessage');
const { hasBlockedWord } = require('../utils/chatModeration');

const MAX_MESSAGE_LENGTH = 280;
const EDIT_WINDOW_MS = 30 * 1000;

const isOutsideEditWindow = (createdAt) => Date.now() - new Date(createdAt).getTime() > EDIT_WINDOW_MS;

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
    const cleanedText = typeof text === 'string' ? text.trim() : '';

    if (!cleanedText) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    if (cleanedText.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` });
    }

    if (hasBlockedWord(cleanedText)) {
      return res.status(400).json({ message: 'Message contains restricted language' });
    }

    const newMessage = new ChatMessage({
      user: req.user.id,
      text: cleanedText,
    });

    const savedMessage = await newMessage.save();
    await savedMessage.populate('user', 'name role');

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('Error posting chat message:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const cleanedText = typeof text === 'string' ? text.trim() : '';

    if (!cleanedText) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    if (cleanedText.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` });
    }

    if (hasBlockedWord(cleanedText)) {
      return res.status(400).json({ message: 'Message contains restricted language' });
    }

    const message = await ChatMessage.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own message' });
    }

    if (isOutsideEditWindow(message.createdAt)) {
      return res.status(403).json({ message: 'You can only edit messages within 30 seconds' });
    }

    message.text = cleanedText;
    message.editedAt = new Date();
    const updatedMessage = await message.save();
    await updatedMessage.populate('user', 'name role');

    return res.json(updatedMessage);
  } catch (err) {
    console.error('Error updating chat message:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await ChatMessage.findById(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own message' });
    }

    if (isOutsideEditWindow(message.createdAt)) {
      return res.status(403).json({ message: 'You can only delete messages within 30 seconds' });
    }

    await ChatMessage.findByIdAndDelete(id);
    return res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting chat message:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.postBotMessage = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message text is required' });
    }

    let conversationContext = '';
    if (history && Array.isArray(history)) {
       // Only take the last 5 messages to save tokens and keep context fresh
       const recentHistory = history.slice(-5);
       const formattedHistory = recentHistory.map(h => `${h.isBot ? 'Assistant' : 'Student'}: ${h.text}`).join('\n');
       conversationContext = `\nRecent Conversation History:\n${formattedHistory}\n\n`;
    }

    const userName = req.user && req.user.name ? req.user.name : "Student";

    const prompt = `You are a friendly, highly knowledgeable, and strict AI meal planning assistant for the "Campus Food Service Management" application at SLIIT (Sri Lanka Institute of Information Technology - Malabe Campus).

ABOUT SLIIT CAMPUS DINING (Use this to help the student):
- Dining Locations: Main Cafeteria, Food Court Area (near Engineering Block), Student Canteen (Hostel Side), and Juice Bar / Short Eats Kiosk.
- Operating Hours: Breakfast (7:30 AM-10:00 AM), Lunch (11:30 AM-2:30 PM), Dinner (5:00 PM-8:30 PM - mainly hostel area), Snacks (8:00 AM-6:00 PM).
- Meal Plans: Pay-as-you-go, Weekly Budget Plan (e.g., LKR 3000/week), and Hostel Meal Package (fixed monthly).
- Payments & Budgets: Pay via Student ID (RFID/NFC), Cash, or LankaQR/Mobile banking. Prices: Rice & Curry (LKR 250-400), Short Eats (LKR 100-200). Balances top-up via university portal or counters.
- Dietary & Menus: Halal section, vegetarian/limited vegan options, low-spice/healthy choices. Popular menus include Rice & Curry (daily special), Kottu Night, Fried Rice Fridays, and Pasta/Noodles. Short eats: rolls, patties, samosas. Beverages: Fresh juice, Milo, Tea, Coffee.
- Ordering & Pickup: Order 15-30 mins in advance via the app. Show student ID to collect at the counter. (Note: peak times 12-1 PM may cause delays).
- Delivery: Inside campus delivery is limited to hostel areas only. No outside campus delivery. Pickup is the main method.
- Support Contact: For human help, email dining@sliit.lk or call +94 11 754 4801.
- You are talking to: ${userName}. Address them by their name occasionally to be friendly.

YOUR RULES:
1. You may respond to basic conversational greetings (e.g., "hi", "hello", "how are you").
2. You must ONLY answer questions related to SLIIT campus dining, meal planning, food, nutrition, recipes, payments, and dietary requirements.
3. If the student asks about ANYTHING outside of these topics (e.g., coding, weather, general knowledge), you MUST refuse and reply exactly with: "I'm sorry, but I can only assist with meal planning and SLIIT food-related questions."
4. Do not break character. Keep your answers concise, engaging, and helpful.
${conversationContext}${userName}: ${message}`;

    // List of available API keys to use for fallback
    const apiKeys = [
      process.env.GEMINI_API_KEY_MEAL_MANAGEMENT,
      process.env.deepL_API_KEY
    ].filter(Boolean); // removes undefined/empty

    let responseText = null;
    let lastError = null;

    // Loop through each key and attempt generation
    for (const key of apiKeys) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        break; // Stop looping if successful!
      } catch (err) {
        console.error(`Attempt failed using an API key: ${err.status || err.message}`);
        lastError = err;
        // loop continues to try the next key
      }
    }

    // If we have a successful response, send it
    if (responseText) {
      return res.status(200).json({ reply: responseText });
    }

    // If ALL keys failed, gracefully handle the error based on the last recorded error
    console.error('All API keys failed. Last error:', lastError);
    if (lastError && lastError.status === 429) {
      return res.status(200).json({ reply: "I'm currently receiving too many requests. Please wait a moment and try again!" });
    }
    if (lastError && lastError.status === 503) {
      return res.status(200).json({ reply: "I'm currently experiencing very high demand. Please try asking again in a few seconds!" });
    }
    
    return res.status(200).json({ reply: "I encountered a temporary connection error with all services. Please try again." });
  } catch (err) {
    console.error('Critical Error with bot:', err);
    res.status(500).json({ message: 'Server failed to process AI request' });
  }
};