// controllers/subscriptionController.js
const { Subscriber, Message } = require('../models');

// Email subscription handler
exports.subscribeByEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const [subscriber, created] = await Subscriber.findOrCreate({ where: { email } });
    if (!created) return res.status(400).send("Already subscribed");
    // TODO: send confirmation email
    res.send("✅ Subscribed successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
  }
};

// Message submission handler
exports.submitMessage = async (req, res) => {
  const { email, message } = req.body;
  try {
    const subscriber = await Subscriber.findOne({ where: { email } });
    if (!subscriber) return res.status(404).send("❌ Email not found. Please subscribe first.");

    await Message.create({ subscriberId: subscriber.id, message });
    res.send("✅ Message received. Thank you!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
  }
};


// // Fetch all subscribers handler
// exports.getAllSubscribers = async (req, res) => {
//   try {
//     const subscribers = await Subscriber.findAll();
//     res.json(subscribers);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error.");
//   }
// };

// // Fetch all messages handler
// exports.getAllMessages = async (req, res) => {
//   try {
//     const messages = await Message.findAll({ include: Subscriber });
//     res.json(messages);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error.");
//   }
// };
