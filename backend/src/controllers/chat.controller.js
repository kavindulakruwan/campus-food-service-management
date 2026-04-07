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

    const prompt = `You are a friendly and strict AI meal planning assistant for a university campus food service application. 
YOUR RULES:
1. You may respond to basic conversational greetings (e.g., "hi", "hello", "how are you").
2. You must ONLY answer questions related to meal planning, food, nutrition, campus dining, recipes, and dietary requirements.
3. If the student asks about ANYTHING outside of these topics (e.g., coding, weather, general knowledge), you MUST refuse and reply exactly with: "I'm sorry, but I can only assist with meal planning and food-related questions."
4. Do not break character. Keep your answers concise, engaging, and helpful.
${conversationContext}Student: ${message}`;

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