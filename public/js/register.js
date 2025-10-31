                   document.addEventListener("DOMContentLoaded", () => {
                    const form = document.getElementById('register-form');

                    const nameEl = document.getElementById('name');
                    const emailEl = document.getElementById('email');
                    const cemailEl = document.getElementById('cemail');
                    const passwordEl = document.getElementById('password');

                    // ✅ Email confirmation validation border (live check)
                    cemailEl.addEventListener('keyup', () => {
                      if (cemailEl.value !== emailEl.value) {
                        cemailEl.style.border = "2px solid red";
                      } else {
                        cemailEl.style.border = "6px solid green";
                      }
                    });

                    
                    if (form) {
                    form.addEventListener('submit', async (e) => {
                      e.preventDefault();
                  
                      const payload = {
                        name: nameEl.value.trim(),
                        email: emailEl.value.trim(),
                        cemail: cemailEl.value.trim(),
                        password: passwordEl.value
                      };
                  
                      if (!payload.name || !payload.email || !payload.password) {
                        alert('Please fill name, email, and password');
                        return;
                      }
                  
                      if (payload.email.toLowerCase() !== payload.cemail.toLowerCase()) {
                        alert('Emails do not match!');
                        return;
                      }
                  
                      console.log('➡ Submitting register payload:', payload);
                  
                      try {
                        const res = await fetch('/api/auth/register', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                          },
                          credentials: 'include', 
                          body: JSON.stringify(payload)
                        });

                        // If backend responds with JSON (API mode)
                        if (res.headers.get("content-type")?.includes("application/json")) {
                        const data = await res.json();

                        if (!res.ok) {
                           alert(data.error || 'Registration failed');
                           return;
                         }

                          alert(data.message || 'Registration successful! Check your email');
                          window.location.href = '/login';
                        } else {
                            // Redirect fallback (HTML mode)
                           window.location.href = "/login";
                        }
                      } catch (err) {
                        console.error('Network/register error:', err);
                        alert('Network error: ' + err.message);
                      }
                    });
                    }
                  });
                