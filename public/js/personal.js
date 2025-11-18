
    document.addEventListener("DOMContentLoaded", () => {
      const form = document.getElementById('personal');
      if (!form) return console.error("❌ personal form not found");

      form.addEventListener('submit', async (e) => {
        const accessToken = localStorage.getItem('accessToken');

        // 👉 Only intercept if JWT token exists. 
        // ⚙️ If NO token → it's a normal session form, let browser submit naturally
        if (!accessToken) {
          console.log("🧭 No access token found → submitting form normally (session flow)");
          return; // let HTML form submit normally for session users
        }

        // 🧱 API/JWT flow → prevent default and use fetch
        e.preventDefault();  // prevent browser redirect only for API flow (🚫 stops HTML form submission)

      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true; // disable button to prevent multiple submits
        
        const payload = Object.fromEntries(new FormData(form).entries());

        try {
          console.log("➡ Submitting personal info (JWT flow):", payload);

          const res = await fetch('/protect/submit/personal_info', {
            method: 'POST',
            credentials: 'include',  // send cookies too
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}` 
            },
            body: JSON.stringify(payload)
          });

          const result = await res.json().catch(()=>({}));
          console.log('<= Response info response', res.status, result);

          if (res.ok) {
            alert(result.message || "Personal Info saved successfully.");
             // 👇 redirect client-side automtically to document page
            window.location.href = '/protect/upload/document'; // ✅ Redirect
          } else {
            alert(result.error || result.message || "Submission failed.");
            if (btn) btn.disabled = false; // re-enable button
          }

        } catch (err) {
          console.error('❌ Personal info submit error', err);
          alert('Network or server error saving personal info.');
          if (btn) btn.disabled = false; // re-enable button
        }
      });
    });

   // 🕓 Footer year update
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    


    