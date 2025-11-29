// public/js/dashboard.js
// -------------------------
// Dashboard client script
// -------------------------

// Auto year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

console.log("✅ dashboard.js loaded and running!");

// Read injected user data if present (server-rendered)
const userDataScript = document.getElementById("user-data");
let serverUser = {};
if (userDataScript) {
  try {
    serverUser = JSON.parse(userDataScript.textContent || "{}");
    console.log("👤 User from server:", serverUser);
  } catch (err) {
    console.error("⚠️ Failed to parse user data:", err);
  }
} else {
  console.warn("⚠️ No user-data script found in DOM.");
}

// API base
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : window.location.origin;

// Helper to refresh access token using HttpOnly refresh token cookie
async function refreshAccessToken() {
  try {
    console.log("📡 Refreshing token:", `${API_BASE}/api/auth/refresh-token`);
    const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Refresh failed');

    if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  } catch (err) {
    console.error('Refresh failed:', err);
    return null;
  }
}

// Small utility to avoid XSS
function escapeHtml(s) {
  if (!s && s !== 0) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Load dashboard with spinner, retry once after refresh if 401/403
let dashboardLoading = false;
async function loadDashboard() {
  if (dashboardLoading) return;
  dashboardLoading = true;
  console.log("🚀 loadDashboard called");

  const spinner = document.getElementById('loading-spinner');
  const dashboard = document.getElementById('dashboard-content');

  if (!dashboard) {
    console.error('Dashboard container not found (#dashboard-content).');
    return;
  }

  // Defensive spinner
  if (!spinner) {
    console.warn('Spinner element not found (#loading-spinner). Creating fallback.');
    const s = document.createElement('div');
    s.id = 'loading-spinner';
    s.innerHTML = '<div class="spinner" aria-hidden="true"></div><div>Loading your dashboard...</div>';
    dashboard.parentNode.insertBefore(s, dashboard);
  }

  const showSpinner = () => {
    const sp = document.getElementById('loading-spinner');
    if (sp) sp.style.display = 'flex';
    dashboard.style.display = 'none';
  };
  const hideSpinner = () => {
    const sp = document.getElementById('loading-spinner');
    if (sp) sp.style.display = 'none';
    dashboard.style.display = 'block';
  };

  showSpinner();

  // Decide which endpoint to call:
  // - If an accessToken exists in localStorage -> use JWT API (/api/auth/dashboard)
  // - Otherwise use session-protected JSON endpoint -> /api/auth/session
  const accessToken = localStorage.getItem('accessToken') || null;
  const TIMEOUT_MS = 2000;

  try {
    let res;

    //
    // ===========================================
    // 1️⃣  JWT FLOW (Browser has accessToken)
    // ===========================================
    //
    if (accessToken) {
      console.log("📡 Using JWT flow:", `${API_BASE}/api/auth/dashboard`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      res = await fetch(`${API_BASE}/api/auth/dashboard`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      //
        // JWT expired → attempt refresh
        //
      if (res.status === 401 || res.status === 403) {
        console.warn("🔁 Access token expired, attempting refresh...");
        const newToken = await refreshAccessToken();

        if (!newToken) {
            console.warn("❌ Refresh failed: session fully expired");
            setTimeout(() => window.location.href = "/login", 2000);

            return;
          }

        // retry request with new token
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);

        res = await fetch(`${API_BASE}/api/auth/dashboard`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${newToken}` },
          credentials: 'include',
          signal: controller2.signal,
        });

        clearTimeout(timeout2);
      }
    } 
    
    //
    // ===========================================
    // 2️⃣  SESSION FLOW (No accessToken stored)
    // ===========================================
    //
    else {
      console.log(
        "📡 No accessToken found — using session endpoint:", 
        `${API_BASE}/api/auth/session`
      );
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      res = await fetch(`${API_BASE}/api/auth/session`, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeout);
    }

    //
    // ===========================================
    // 3️⃣  UNIFIED 401 HANDLER (Auto-logout included)
    // ===========================================
    //
    if (res.status === 401) {
      console.warn("⛔ 401 received — redirecting to login...");
      setTimeout(() => window.location.href = "/login", 2000); // ⬅ THIS IS THE LINE YOU NEEDED
      return;
  }

    //
    // ===========================================
    // 4️⃣  OTHER ERRORS
    // ===========================================
    //
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody.error || errBody.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    //
    // ===========================================
    // 5️⃣  SUCCESS — PARSE DASHBOARD DATA
    // ===========================================
    //
    const data = await res.json();
    console.log("✅ Dashboard data:", data);

    // update DOM
    const userSection = document.getElementById('user-info');
    if (userSection && data.user) {
      userSection.innerHTML = `
        <h2>Hello, ${escapeHtml(data.user.name || '')}</h2>
        <p>Email: ${escapeHtml(data.user.email || '')}</p>
        <p>User ID: ${escapeHtml(String(data.user.id || ''))}</p>
      `;
    } else if (userSection && serverUser && serverUser.name) {
      // fallback to server-rendered user object
      userSection.innerHTML = `<h2>Hello, ${escapeHtml(serverUser.name || '')}</h2><p>Email: ${escapeHtml(serverUser.email || '')}</p>`;
    }

    hideSpinner();
  } catch (err) {
    console.error('❌ Dashboard load error:', err);

    // show helpful error block
    dashboard.innerHTML = `
      <div style="text-align:center; padding:1rem;">
        <p style="color: #f44; font-weight:600;">Failed to load dashboard</p>
        <p style="color:#ddd; margin:0.5rem 0;">${escapeHtml(err.message || 'Unknown error')}</p>
        <p style="margin-top:12px;">
          <a href="/login" style="padding:10px 14px; background:orange; color:#fff; border-radius:6px; text-decoration:none;">Sign in</a>
        </p>
      </div>
    `;

    // ensure spinner hidden and dashboard visible (show error UI)
    const sp = document.getElementById('loading-spinner');
    if (sp) sp.style.display = 'none';
    dashboard.style.display = 'block';

    // if expired, redirect after short delay
    if (/expired|session|log in/i.test((err.message || '').toLowerCase())) {
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    }
  } finally {
    // ensure loading lock released so user can attempt again if desired
    dashboardLoading = false;
  }
}

// // Unified logout
// async function doLogout() {
//   try {
//     const res = await fetch(`${API_BASE}/logout`, {
//       method: 'POST',
//       credentials: 'include',
//       headers: { Accept: 'application/json' },
//     });

//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('refreshToken');

//     if (res.ok) {
//       const data = await res.json().catch(() => ({}));
//       if (data.redirect) {
//         window.location.href = data.redirect;
//         return;
//       }
//     }

//     window.location.href = '/login';
//   } catch (err) {
//     console.error('Logout error:', err);
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('refreshToken');
//     window.location.href = '/login';
//   }
// }


// ----------------------------------------------------------
// MANUAL LOGOUT (logout button)
// ----------------------------------------------------------
async function doLogout() {
  console.log("🚪 Manual logout triggered");

  // STEP 1 — show spinner immediately (same as auto)
  showLogoutSpinner();

  // STEP 2 — allow DOM to repaint (same 100ms as auto!)
  setTimeout(async () => {

    // STEP 3 — backend logout
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
    } catch (err) {
      console.error("Logout error (ignored):", err);
    }

    // Always remove JWT tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // STEP 4 — keep spinner visible for smooth UX
    setTimeout(() => {

      // STEP 5 — redirect to login
      window.location.href = "/login";

    }, 1000);

  }, 100); // SAME repaint delay as auto logout
}


// async function doLogout() {
//   console.log("🔒 Manual logout triggered");

//   // 1️⃣ Instantly show spinner (same as auto-logout)
//   const sp = document.getElementById('loading-spinner');
//   const dash = document.getElementById('dashboard-content');

//   if (sp) sp.style.display = 'flex';
//   if (dash) dash.style.display = 'none';

//   // 2️⃣ Force redirect after 2s (or longer for testing)
//   //    This makes manual logout always work.
//   setTimeout(() => {
//     console.warn("⏳ Forced redirect to /login after timeout");
//     window.location.href = "/login";
//   }, 2000); // You can test with 5000–8000ms

//   // 3️⃣ Backend logout in the background (non-blocking)
//   try {
//     fetch(`${API_BASE}/logout`, {
//       method: 'POST',
//       credentials: 'include',
//       headers: { Accept: 'application/json' },
//     })
//       .then(r => r.json())
//       .then(data => {
//         if (data?.redirect) window.location.href = data.redirect;
//       })
//       .catch(() => {});
//   } catch (err) {
//     console.error("Logout error (ignored):", err);
//   }

//   // 4️⃣ Always remove JWT browser tokens
//   localStorage.removeItem('accessToken');
//   localStorage.removeItem('refreshToken');

//    // 🔥 NEW — show same spinner as auto logout
//    showLogoutSpinner();

//    // 🔥 NEW — redirect after small delay
//    setTimeout(() => {
//      window.location.href = "/login";
//    }, 800); // 0.8s same smooth feeling
 
//    return;
// }


// // -------------------------------------------------
// // 🚨 INACTIVITY LOGOUT (10 minutes)
// // -------------------------------------------------
// let inactivityTimer;

// function resetInactivityTimer() {
//     clearTimeout(inactivityTimer);

//     inactivityTimer = setTimeout(() => {
//       console.warn("⏳ User inactive — auto-logout triggered.");

//         // Show spinner before logout
//         const sp = document.getElementById('loading-spinner');
//         const dash = document.getElementById('dashboard-content');
//         if (sp) sp.style.display = 'flex';
//         if (dash) dash.style.display = 'none';

//         // Delay ensures spinner is visible
//         setTimeout(() => { 
//           window.location.href = "/login"; 
//         }, 2000);

//     }, 10 * 60 * 1000); // 10 minutes
// }

// // Reset timer on user activity
// ['mousemove', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
//     document.addEventListener(evt, resetInactivityTimer);
// });
// resetInactivityTimer();


// // ----------------------------------------------------------
// // AUTO-LOGOUT ON INACTIVITY (15 minutes)
// // ----------------------------------------------------------

// let inactivityTimer;
// const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

// function showLogoutSpinner() {
//   const sp = document.getElementById('loading-spinner');
//   const dash = document.getElementById('dashboard-content');

//   if (sp) {
//     sp.style.display = 'flex';
//     sp.querySelector('.spinner')?.classList.add('active');
//   }

//   if (dash) dash.style.display = 'none';
// }

// function resetInactivityTimer() {
//   clearTimeout(inactivityTimer);

//   inactivityTimer = setTimeout(() => {
//     console.warn("⏳ User inactive — logging out...");

//     // Step 1 — show spinner immediately
//     showLogoutSpinner();

//     // Step 2 — ensure spinner is visible before backend logout
//     setTimeout(async () => {

//       await doLogout();  // Step 3 — perform logout without redirect

//       // Step 4 — wait so spinner stays visible
//       setTimeout(() => {
//         window.location.href = "/login";    
//       }, 1000);

//     }, 100); // small wait to allow DOM repaint
//   }, INACTIVITY_LIMIT);
// }

// // Reset timer on any user activity
// ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(evt => {
//   window.addEventListener(evt, resetInactivityTimer);
// });

// resetInactivityTimer();


// ----------------------------------------------------------
// AUTO-LOGOUT ON INACTIVITY (15 minutes)
// ----------------------------------------------------------

let inactivityTimer;
const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

function showLogoutSpinner() {
  const sp = document.getElementById('loading-spinner');
  const dash = document.getElementById('dashboard-content');

  if (sp) {
    sp.style.display = 'flex';
    sp.querySelector('.spinner')?.classList.add('active');
  }

  if (dash) dash.style.display = 'none';
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);

  inactivityTimer = setTimeout(() => {
    console.warn("⏳ User inactive — logging out...");

    // STEP 1 — show spinner
    showLogoutSpinner();

    // STEP 2 — same repaint delay
    setTimeout(async () => {

      // STEP 3 — do backend logout (same function)
      await doLogout();  // no redirect here (redirect is inside doLogout!)

      // IMPORTANT: doLogout already handles redirect

    }, 100);

  }, INACTIVITY_LIMIT);
}

// Reset timer on any user activity
["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(evt => {
  window.addEventListener(evt, resetInactivityTimer);
});

// Start timer on load
resetInactivityTimer();


// // ----------------------------------------------------------
// // AUTO-LOGOUT ON INACTIVITY (15 minutes = 900000 ms)
// // ----------------------------------------------------------

// let inactivityTimer;
// const INACTIVITY_LIMIT = 1 * 60 * 1000; // 15 minutes

// function resetInactivityTimer() {
//   clearTimeout(inactivityTimer);

//   inactivityTimer = setTimeout(() => {
//     console.warn("⏳ User inactive for 1 minutes — logging out...");

//     // Show spinner if exists
//     const sp = document.getElementById('loading-spinner');
//     const dash = document.getElementById('dashboard-content');
//     if (sp) sp.style.display = 'flex';
//     if (dash) dash.style.display = 'none';

//     // Show spinner  BEFORE logout trigger
//     showLogoutSpinner();

//     // Delay a bit to allow spinner to show
//     setTimeout(() => {
//     // Trigger unified logout (session + JWT)
//     doLogout(); // your existing unified logout
//   }, 30000); // <— THIS makes spinner stay visible long enough to see
// }, INACTIVITY_LIMIT);
// }

// // User activity resets timer
// ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(evt => {
//   window.addEventListener(evt, resetInactivityTimer);
// });

// // Initialize inactivity timer immediately
// resetInactivityTimer();



// DOM ready wiring
document.addEventListener('DOMContentLoaded', () => {
  console.log("📦 DOM ready — calling loadDashboard once");

  // call loadDashboard once
  loadDashboard().catch(err => console.error("Initial load failed:", err));

  // periodic silent refresh of access token (optional)
  setInterval(() => {
    refreshAccessToken().catch(() => {});
  }, 14 * 60 * 1000);

  const logoutBtn = document.querySelector('.btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      doLogout();
    });
  }
});

 
    
    
    
    
    
    
    
    
    // // -------------------------
    // // Dashboard client script
    // // -------------------------

    //  // Auto year
    //  const yearEl = document.getElementById("year");
    //  if (yearEl) yearEl.textContent = new Date().getFullYear();
 
    // console.log("✅ dashboard.js loaded and running!");

    // // Read the injected user data if present
    // const userDataScript = document.getElementById("user-data");
    // let user = {};
    
    // if (userDataScript) {
    //   try {
    //     user = JSON.parse(userDataScript.textContent);
    //     console.log("👤 User from server:", user);
    //   } catch (err) {
    //     console.error("⚠️ Failed to parse user data:", err);
    //   }
    // } else {
    //   console.warn("⚠️ No user-data script found in DOM.");
    // }
    
    // // Define API_BASE (in case it’s not already global)
    // // API base: use localhost:3000 for dev, otherwise current origin
    // const API_BASE = window.location.hostname === 'localhost'
    //   ? 'http://localhost:3000'
    //   : window.location.origin;

  
    // // Helper to refresh access token using HttpOnly refresh token cookie
    // async function refreshAccessToken() {
    //   try {
    //     console.log("📡 Refreshing token:", `${API_BASE}/api/auth/refresh-token`);
    //     // If server expects cookie (HttpOnly refreshToken), use credentials: 'include'
    //     const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
    //       method: 'POST',
    //       credentials: 'include', // 👈 send cookie, receive JSON with new accessToken
    //     });
  
    //     const data = await res.json().catch(() => ({}));
    //     if (!res.ok) throw new Error(data.message || 'Refresh failed');
  
    //     if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
    //     return data.accessToken;
    //   } catch (err) {
    //     console.error('Refresh failed:', err);
    //     // Let caller handle redirect; we return null so caller can decide
    //     return null;
    //   }
    // }




    // // Load dashboard with spinner, retry once after refresh if 401/403
    // async function loadDashboard() {
    //   const spinner = document.getElementById('loading-spinner');
    //   const dashboard = document.getElementById('dashboard-content');
  
    //   if (!dashboard) {
    //     console.error('Dashboard container not found (#dashboard-content).');
    //     return;
    //   }
  
    //   // Defensive: create a minimal spinner if missing
    //   if (!spinner) {
    //     console.warn('Spinner element not found (#loading-spinner). Creating fallback.');
    //     const s = document.createElement('div');
    //     s.id = 'loading-spinner';
    //     s.innerHTML = '<div class="spinner" aria-hidden="true"></div><div>Loading your dashboard...</div>';
    //     dashboard.parentNode.insertBefore(s, dashboard);
    //   }
  
    //   const showSpinner = () => {
    //     const sp = document.getElementById('loading-spinner');
    //     if (sp) sp.style.display = 'flex'; // sp = spinner
    //     dashboard.style.display = 'none';
    //   };
    //   const hideSpinner = () => {
    //     const sp = document.getElementById('loading-spinner');
    //     if (sp) sp.style.display = 'none';
    //     dashboard.style.display = 'block';
    //   };
  
    //   showSpinner();
    //   console.log("📡 Fetching:", `${API_BASE}/api/auth/dashboard`);
  
    //   // Abort controller + timeout to avoid hanging forever
    //   const TIMEOUT_MS = 8000;
    //   const controller = new AbortController();
    //   const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    //   try {
    //     let token = localStorage.getItem('token') || null;

    //      // initial attempt
    //     let res = await fetch(`${API_BASE}/api/auth/dashboard`, {
    //       method: 'GET',
    //       headers: token ? { Authorization: `Bearer ${accessToken}` } : {},
    //       credentials: 'include', // 👈 harmless, and required if server checks cookie auth
    //       signal: controller.signal,
    //     });
  
    //     // If unauthorized (access token expired/invalid), try refresh once
    //     if (res.status === 401 || res.status === 403) {
    //       // clear old timeout and create new one for retry
    //       clearTimeout(timeout); // to = timeout. And cancel previous timeout
    //       console.warn("🔁 Access token expired, attempting refresh...");
  
    //       const newToken = await refreshAccessToken(); // throws if fails
    //       if (!newToken) {
    //         console.warn('Refresh failed → stopping dashboard reload.');
    //         throw new Error('Session expired. Please log in again.');
    //       }
  
    //       // retry with new token and a fresh controller/timeout
    //       const controller2 = new AbortController();
    //       const timeout2 = setTimeout(() => controller2.abort(), TIMEOUT_MS); // new timeout
        
    //       res = await fetch(`${API_BASE}/api/auth/dashboard`, { // retry request after refreshing
    //         method: 'GET',
    //         headers: { Authorization: `Bearer ${newToken}` },
    //         credentials: 'include',
    //         signal: controller2.signal,
    //       });
  
    //       clearTimeout(timeout2);
    //     } else {
    //       clearTimeout(timeout);
    //     }
  
    //     if (!res.ok) {
    //       // attempt to parse error body
    //       const errBody = await res.json().catch(() => ({}));
    //       const msg = errBody.error || errBody.message || `HTTP ${res.status}`;
    //       throw new Error(msg);
    //     }
  
    //     const data = await res.json();
    //     console.log("✅ Dashboard data:", data);

    //     // ✅ Update only the user info section instead of replacing all dashboard HTML
    //     const userSection = document.getElementById('user-info');
    //     if (userSection && data.user) {
    //       userSection.innerHTML = `
    //         <h2>Hello, ${escapeHtml(data.user.name || '')}</h2>
    //         <p>Email: ${escapeHtml(data.user.email || '')}</p>
    //         <p>User ID: ${escapeHtml(String(data.user.id || ''))}</p>
    //       `;
    //     }

    //     // ✅ success -> hide spinner and reveal full dashboard
    //     hideSpinner();
    //   //  dashboard.style.display = 'block';
    //     } catch (err) {
    //        console.error('❌ Dashboard load error:', err);

    //     // Show helpful error block in dashboard area
    //     dashboard.innerHTML = `
    //       <div style="text-align:center; padding:1rem;">
    //         <p style="color: #f44; font-weight:600;">Failed to load dashboard</p>
    //         <p style="color:#ddd; margin:0.5rem 0;">${escapeHtml(err.message || 'Unknown error')}</p>
    //         <p style="margin-top:12px;">
    //           <a href="/login" style="padding:10px 14px; background:orange; color:#fff; border-radius:6px; text-decoration:none;">Sign in</a>
    //         </p>
    //       </div>
    //     `;
  
    //     // stop spinner and show dashboard error UI
    //     const sp = document.getElementById('loading-spinner');
    //     if (sp) sp.style.display = 'none';
    //     dashboard.style.display = 'block';
  
    //     // If error suggests expiry, auto-redirect to login shortly
    //     hideSpinner();
    //     if (/expired|session|log in/i.test((err.message || '').toLowerCase())) {
    //       setTimeout(() => { window.location.href = '/login'; }, 2000);
    //     }
    //   }
    // }


    // // Small utility to avoid XSS when injecting server strings into HTML
    // function escapeHtml(s) {
    //   if (!s && s !== 0) return '';
    //   return String(s)
    //     .replace(/&/g, '&amp;')
    //     .replace(/</g, '&lt;')
    //     .replace(/>/g, '&gt;')
    //     .replace(/"/g, '&quot;')
    //     .replace(/'/g, '&#39;');
    // }
  

    // // Unified logout — calls server endpoint that handles session & JWT
    // async function doLogout() {
    //   try {
    //     const res = await fetch(`${API_BASE}/logout`, {
    //       method: 'POST',
    //       credentials: 'include', // important if cookies (refreshToken) are used
    //       headers: { Accept: 'application/json' },
    //     });
  
    //     // cleanup client local tokens just in case
    //     localStorage.removeItem('accessToken');
    //     localStorage.removeItem('refreshToken');

    //      // If server returns JSON with redirect, follow it
    //     if (res.ok) {
    //       const data = await res.json().catch(() => ({}));
    //       if (data.redirect) {
    //         window.location.href = data.redirect;
    //         return;
    //       }
    //     }

    //      // fallback redirect
    //     window.location.href = '/login';
    //   } catch (err) {
    //     console.error('Logout error:', err);
    //      // ensure client cleaned up anyway
    //     localStorage.removeItem('accessToken');
    //     localStorage.removeItem('refreshToken');
    //     window.location.href = '/login';
    //   }
    // }
  


    // // ✅ Attach events when DOM ready
    // document.addEventListener('DOMContentLoaded', () => {
    //   console.log("📦 DOM ready — calling loadDashboard once");

    //   //  ✅ Load dashboard content once DOM is ready
    //   loadDashboard().catch(err => console.error("Initial load failed:", err));

    //   // periodic silent refresh every 14 min
    //   setInterval(() => {
    //     refreshAccessToken().catch(() => {});
    //   }, 14 * 60 * 1000); // 14 minutes

    //   // bind logout button (works whether it's a form or button)
    //    const logoutBtn = document.querySelector('.btn-logout');
    //   // const logoutBtn = document.getElementById('logout-btn');
    //   if (logoutBtn) {
    //     logoutBtn.addEventListener('click', (e) => {
    //       // if inside a form, prevent actual form submit and use JS
    //       e.preventDefault();
    //       doLogout();
    //     });
    //   }
    // });