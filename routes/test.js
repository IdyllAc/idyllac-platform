// routes/test.js
router.get('/test-email', async (req, res) => {
    try {
      await sendConfirmationEmail('your@email.com', 'testtoken123');
      res.send('Test email sent!');
    } catch (err) {
      res.status(500).send('Email failed.');
    }
  });
  