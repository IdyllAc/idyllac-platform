// test-email.js
require("dotenv").config();
const sendEmail = require("./utils/sendEmail");

(async () => {
  try {
    await sendEmail("victor.via7@gmail.com", "Test Email", "1234567890TOKEN");
    console.log("✅ Email test finished");
  } catch (err) {
    console.error("❌ Test failed:", err);
  }
})();
