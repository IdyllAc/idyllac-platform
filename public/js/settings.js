// public/js/settings.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settings-form');
  if (!form) return console.warn('⚠️ settings form not found');

  // helper to set element value properly
  function setField(el, value) {
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = !!value;
    } else {
      el.value = value ?? '';
    }
  }

  // Helper to read checkbox presence
  function boolValue(el) {
    return !!el && (el.checked === true || el.value === 'true' || el.value === '1');
  }

  async function refresh() {
    try {
      const res = await fetch('/profile/settings/data', {
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) {
        console.warn('Could not fetch settings data', res.status);
        return;
      }
      const s = await res.json();

      // Fill simple values
      setField(document.getElementById('language'), s.language);
      setField(document.getElementById('timezone'), s.timezone);
      setField(document.getElementById('auto_logout_minutes'), s.auto_logout_minutes ?? s.autoLogoutMinutes ?? 30);
      setField(document.getElementById('profile_visibility'), s.profile_visibility);

      // Checkboxes
      setField(document.getElementById('email_notifications'), s.email_notifications);
      setField(document.getElementById('sms_notifications'), s.sms_notifications);
      setField(document.getElementById('marketing_emails'), s.marketing_emails);
      setField(document.getElementById('app_notifications'), s.app_notifications);

      setField(document.getElementById('two_factor_enabled'), s.two_factor_enabled);
      setField(document.getElementById('show_email'), s.show_email);
      setField(document.getElementById('show_phone'), s.show_phone);
      setField(document.getElementById('data_collection_opt_in'), s.data_collection_opt_in);
      setField(document.getElementById('allow_tagging'), s.allow_tagging);

      setField(document.getElementById('dark_mode'), s.dark_mode);
      setField(document.getElementById('auto_play_media'), s.auto_play_media);
      setField(document.getElementById('save_activity_history'), s.save_activity_history);
      setField(document.getElementById('content_language'), s.content_language || s.language);

    } catch (err) {
      console.warn('Could not auto-refresh settings', err);
    }
  }

  // Submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    // Collect payload from named inputs
    const body = {};
    form.querySelectorAll('[name]').forEach((el) => {
      const name = el.name;
      if (!name) return;
      if (el.type === 'checkbox') {
        body[name] = el.checked;
      } else {
        body[name] = el.value;
      }
    });

    try {
      const res = await fetch('/profile/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to save settings');
        if (btn) btn.disabled = false;
        return;
      }

      alert(data.message || 'Settings saved');
      // refresh to reflect normalized values (e.g. server defaults)
      await refresh();
      if (btn) btn.disabled = false;
    } catch (err) {
      console.error('❌ Network error saving settings', err);
      alert('Network error saving settings');
      if (btn) btn.disabled = false;
    }
  });

  // Reset button fallback
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (!confirm('Reset settings to server defaults?')) return;
      await refresh();
      alert('Form refreshed with current server values.');
    });
  }

  // initial refresh
  refresh();
});










// // public/js/settings.js
// document.addEventListener('DOMContentLoaded', () => {
//   const form = document.getElementById('settings-form');
//   if (!form) return;

//   // Helper to read checkbox presence
//   function boolValue(el) {
//     return !!el && (el.checked === true || el.value === 'true' || el.value === '1');
//   }

//   // On submit, send via fetch to update
//   form.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const body = {};

//     // collect fields (all inputs with name attribute)
//     form.querySelectorAll('[name]').forEach((el) => {
//       const name = el.name;
//       if (!name) return;
//       if (el.type === 'checkbox') {
//         body[name] = el.checked;
//       } else {
//         body[name] = el.value;
//       }
//     });

//     try {
//       const res = await fetch('/protect/settings', {
//         method: 'POST',
//         credentials: 'include',
//         headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
//         body: JSON.stringify(body)
//       });

//       const data = await res.json().catch(()=>({}));
//       if (!res.ok) {
//         alert(data.error || 'Failed to save settings');
//         return;
//       }
//       alert(data.message || 'Settings saved');
//     } catch (err) {
//       console.error('❌ Network error saving settings', err);
//       alert('Network error saving settings');
//     }
//   });

//   // Optionally refresh form with latest settings via JSON endpoint
//   async function refresh() {
//     try {
//       const res = await fetch('/protect/settings/data', { credentials: 'include', headers: { Accept: 'application/json' }});
//       if (!res.ok) return;
//       const s = await res.json();
//       // fill inputs
//       form.querySelectorAll('[name]').forEach((el) => {
//         const name = el.name;
//         if (s[name] === undefined) return;
//         if (el.type === 'checkbox') {
//           el.checked = !!s[name];
//         } else {
//           el.value = s[name];
//         }
//       });
//     } catch (err) {
//       console.warn('Could not auto-refresh settings', err);
//     }
//   }

//   // initial refresh
//   refresh();
// });









// // public/js/settings.js  
// fetch('/profile/settings', { 
//   headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') } })
//   .then(res => res.json())
//   .then(data => {
//     if (data.email_notifications) document.querySelector('[name="email_notifications"]').checked = true;
//     if (data.dark_mode) document.querySelector('[name="dark_mode"]').checked = true;
//     if (data.language) document.querySelector('[name="language"]').value = data.language;
//   });

// document.querySelector('#settings-form').addEventListener('submit', async (e) => {
//   e.preventDefault();
//   const formData = Object.fromEntries(new FormData(e.target).entries());
  
//   formData.email_notifications = !!formData.email_notifications;
//   formData.dark_mode = !!formData.dark_mode;

//   const res = await fetch('/profile/settings', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: 'Bearer ' + localStorage.getItem('accessToken')
//     },
//     body: JSON.stringify(formData)
//   });

//   const msg = await res.json();
//   alert(msg.message);
// });




