document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('login-form');

  if (form) {
    form.addEventListener("submit", async (e) => {
    e.preventDefault();


 // ✅ Correct usage of FormData actually grab email and password values form inputs
 const formData = new FormData(form);
  const email = formData.get('email').trim();
  const password = formData.get('password');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json'  
      },
      credentials: 'include', // keep cookies/session
      body: JSON.stringify({ email, password })
    });

    if (res.headers.get("content-type")?.includes("application/json")) {
       // JSON response (API style)
          const data = await res.json();

          if (!res.ok) { 
          alert(data.message || data.message || 'Login failed');
          return;
        } 

    // Store tokens in localStorage (if server returns them)
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }

  alert("Login successful!");
  window.location.href = '/dashboard';
   } else {
      // Redirect session/EJS to dashboard
      window.location.href = '/dashboard'; // go to session dashboard
    }
  } catch (error) {
    console.error('🔥 Login request failed:', error);
    alert('Something went wrong. Please try again.');
  }
});
}
})
