// public/js/subscribe.js
document.addEventListener('DOMContentLoaded', () => {
  /* -------------------- SUBSCRIBE FORM -------------------- */
  const subscribeForm = document.getElementById('subscribeForm');
  if (subscribeForm) {
    subscribeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = e.target.email.value.trim();

      if (!email) {
        alert('Please enter your email.');
        return;
      }

      try {
        const res = await fetch('/subscribe/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const msg = await res.json();
        alert(msg.message || 'Subscription completed.');
      } catch (err) {
        console.error('❌ Subscribe fetch error:', err);
        alert('Network error. Please try again.');
      }
    });
  } else {
    console.warn('⚠️ No #subscribeForm found on this page.');
  }

  /* -------------------- MESSAGE FORM -------------------- */
  const msgForm = document.getElementById('messageForm');
  if (msgForm) {
    msgForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();

      if (!email || !message) {
        alert('Please fill out both email and message.');
        return;
      }

      try {
        const res = await fetch('/message/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, message }),
        });

        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          msgForm.reset();
        } else {
          alert(data.error || 'Failed to send message.');
        }
      } catch (err) {
        console.error('❌ Message fetch error:', err);
        alert('Network error. Please try again.');
      }
    });
  } else {
    console.warn('⚠️ No #messageForm found on this page.');
  }
});
