// controllers/messageController.js
const { Subscriber, Message } = require('../models');

// 📨 Save a message (existing function)
exports.submitMessage = async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required.' });
    }

    // Find or create subscriber
    let subscriber = await Subscriber.findOne({ where: { email } });
    if (!subscriber) {
      subscriber = await Subscriber.create({ email, verified: false });
      console.log(`🆕 New subscriber created for email: ${email}`);
    }

    const newMsg = await Message.create({
      subscriberId: subscriber.id,
      message,
    });

    console.log(`💬 Message saved for ${email}`);

    return res.status(201).json({
      message: '✅ Message received successfully.',
      data: newMsg,
    });

  } catch (err) {
    console.error('❌ submitMessage error:', err);
    return res.status(500).json({ error: 'Failed to save message.' });
  }
};

// 📬 Retrieve all messages with subscriber email
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      include: [
        {
          model: Subscriber,
          as: 'subscriber',
          attributes: ['email', 'verified', 'created_at'], // show only these fields
        },
      ],
      order: [['created_at', 'DESC']], // latest first
    });

    if (!messages.length) {
      return res.status(404).json({ message: 'No messages found.' });
    }

    return res.status(200).json({
      message: `✅ Found ${messages.length} messages.`,
      data: messages,
    });
  } catch (err) {
    console.error('❌ getAllMessages error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};



