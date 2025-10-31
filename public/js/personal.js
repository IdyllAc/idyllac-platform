
    document.addEventListener("DOMContentLoaded", () => {
      const form = document.getElementById('personal');
      if (!form) return console.error("❌ personal form not found");

      form.addEventListener('submit', async (e) => {
        const accessToken = localStorage.getItem('accessToken');
        // 👉 Only intercept if JWT token exists. 
        if (!accessToken) return alert("Missing access token"); // let HTML form submit normally for session users
        e.preventDefault();  // prevent browser redirect only for API flow (🚫 stops HTML form submission)

      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true; // disable button to prevent multiple submits
        
        const payload = Object.fromEntries(new FormData(form).entries());

        try {
          console.log("➡ Submitting personal (API) payload:", payload);
          const res = await fetch('/protect/personal_info', {
            method: 'POST',
            credentials: 'include',  // send cookies too
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}` 
            },
            body: JSON.stringify(payload)
          });

          const result = await res.json().catch(()=>({}));
          console.log('<= response info response', res.status, result);

          if (res.ok) {
            alert(result.message || "Personal Info saved successfully.");
             // 👇 redirect client-side automtically to document upload page
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

// Set current year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    


    