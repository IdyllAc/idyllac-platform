    // -------------------------
    // Dashboard client script
    // -------------------------
  
    // Auto year
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  
    // API base: use localhost:3000 for dev, otherwise current origin
    const API_BASE = window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : window.location.origin;
  
    // Helper to refresh access token using HttpOnly refresh token cookie
    async function refreshAccessToken() {
      try {
        // If server expects cookie (HttpOnly refreshToken), use credentials: 'include'
        const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include', // 👈 send cookie, receive JSON with new accessToken
        });
  
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Refresh failed');
  
        if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
      } catch (err) {
        console.error('Refresh failed:', err);
        // Let caller handle redirect; we return null so caller can decide
        return null;
      }
    }
  
    // Load dashboard with spinner, retry once after refresh if 401/403
    async function loadDashboard() {
      const spinner = document.getElementById('loading-spinner');
      const dashboard = document.getElementById('dashboard-content');
  
      if (!dashboard) {
        console.error('Dashboard container not found (#dashboard-content).');
        return;
      }
  
      // Defensive: create a minimal spinner if missing
      if (!spinner) {
        console.warn('Spinner element not found (#loading-spinner). Creating fallback.');
        const s = document.createElement('div');
        s.id = 'loading-spinner';
        s.innerHTML = '<div class="spinner" aria-hidden="true"></div><div>Loading your dashboard...</div>';
        dashboard.parentNode.insertBefore(s, dashboard);
      }
  
      const showSpinner = () => {
        const sp = document.getElementById('loading-spinner');
        if (sp) sp.style.display = 'flex'; // sp = spinner
        dashboard.style.display = 'none';
      };
      const hideSpinner = () => {
        const sp = document.getElementById('loading-spinner');
        if (sp) sp.style.display = 'none';
        dashboard.style.display = 'block';
      };
  
      showSpinner();
  
      // Abort controller + timeout to avoid hanging forever
      const TIMEOUT_MS = 8000;
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
      try {
        let token = localStorage.getItem('accessToken') || null;

         // initial attempt
        let res = await fetch(`${API_BASE}/api/auth/dashboard`, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include', // 👈 harmless, and required if server checks cookie auth
          signal: controller.signal,
        });
  
        // If unauthorized (access token expired/invalid), try refresh once
        if (res.status === 401 || res.status === 403) {
          // clear old timeout and create new one for retry
          clearTimeout(to); // to = timeout. And cancel previous timeout
  
          const newToken = await refreshAccessToken(); // throws if fails
          if (!newToken) throw new Error('Session expired. Please log in again.');
  
          // retry with new token and a fresh controller/timeout
          const controller2 = new AbortController();
          const to2 = setTimeout(() => controller2.abort(), TIMEOUT_MS); // to2 = timeout2
  
          res = await fetch(`${API_BASE}/api/auth/dashboard`, { // retry request after refreshing
            method: 'GET',
            headers: { Authorization: `Bearer ${newToken}` },
            credentials: 'include',
            signal: controller2.signal,
          });
  
          clearTimeout(to2);
        } else {
          clearTimeout(to);
        }
  
        if (!res.ok) {
          // attempt to parse error body
          const errBody = await res.json().catch(() => ({}));
          const msg = errBody.error || errBody.message || `HTTP ${res.status}`;
          throw new Error(msg);
        }
  
        const data = await res.json();
  
        // ✅ Update only the user info section instead of replacing all dashboard HTML
        const userSection = document.getElementById('user-info');
        if (userSection) {
          userSection.innerHTML = `
            <h2>Hello, ${escapeHtml(data.user.name || '')}</h2>
            <p>Email: ${escapeHtml(data.user.email || '')}</p>
            <p>User ID: ${escapeHtml(String(data.user.id || ''))}</p>
          `;
        }

        // ✅ success -> hide spinner and reveal full dashboard
        hideSpinner();
        dashboard.style.display = 'block';

        } catch (err) {
        console.error('❌ Dashboard load error:', err);
  
        // Show helpful error block in dashboard area
        dashboard.innerHTML = `
          <div style="text-align:center; padding:1rem;">
            <p style="color: #f44; font-weight:600;">Failed to load dashboard</p>
            <p style="color:#ddd; margin:0.5rem 0;">${escapeHtml(err.message || 'Unknown error')}</p>
            <p style="margin-top:12px;">
              <a href="/login" style="padding:10px 14px; background:orange; color:#fff; border-radius:6px; text-decoration:none;">Sign in</a>
            </p>
          </div>
        `;
  
        // stop spinner and show dashboard error UI
        const sp = document.getElementById('loading-spinner');
        if (sp) sp.style.display = 'none';
        dashboard.style.display = 'block';
  
        // If error suggests expiry, auto-redirect to login shortly
        if (/expired|session|log in/i.test((err.message || '').toLowerCase())) {
          setTimeout(() => { window.location.href = '/login'; }, 2000);
        }
      }
    }
  
    // Small utility to avoid XSS when injecting server strings into HTML
    function escapeHtml(s) {
      if (!s && s !== 0) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  
    // Unified logout — calls server endpoint that handles session & JWT
    async function doLogout() {
      try {
        const res = await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          credentials: 'include', // important if cookies (refreshToken) are used
          headers: { Accept: 'application/json' },
        });
  
        // cleanup client local tokens just in case
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

         // If server returns JSON with redirect, follow it
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.redirect) {
            window.location.href = data.redirect;
            return;
          }
        }

         // fallback redirect
        window.location.href = '/login';
      } catch (err) {
        console.error('Logout error:', err);
         // ensure client cleaned up anyway
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
  
    // ✅ Attach events when DOM ready
    document.addEventListener('DOMContentLoaded', () => {
      // bind logout button (works whether it's a form or button)
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          // if inside a form, prevent actual form submit and use JS
          e.preventDefault();
          doLogout();
        });
      }
  
      // ✅ start loading dashboard once DOM is ready
      loadDashboard();
  
      // periodic silent refresh of access token (optional)
      setInterval(() => {
        refreshAccessToken().catch(() => {});
      }, 14 * 60 * 1000); // 14 minutes
    });
 
  

    