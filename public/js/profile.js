// public/js/profile.js
document.getElementById("year").textContent = new Date().getFullYear();

// 🟢 1. Pre-fill existing profile
fetch('/profile/data', {
  headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') } 
})
  .then(res => res.json())
  .then(data => {
    for (const key in data) {
      const el = document.querySelector(`[name="${key}"]`);
      if (el) el.value = data[key] || '';
    }

    // 🔒 Make locked fields read-only
    if (data.lockedFields) {
      data.lockedFields.forEach(f => {
        const el = document.querySelector(`[name="${f}"]`);
        if (el) el.setAttribute('readonly', true);
      });
    }


    // If there's already profile photo, show preview
    if (data.profile_photo) {
      const preview = document.getElementById('photo-preview');
      if (preview) preview.src = data.profile_photo;
    }
  })
  .catch(err => console.error('Failed to load profile:', err));

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector('#profile-form');
    if (!form) {
      console.error("❌ #profile-form not found");
      return;
    }
// 🟡 2. Handle form submission (including file upload)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('accessToken');
  const form = e.target;
   // ✅ Use FormData (works for files + text)
  const formData = new FormData(form);

  // // Alternatively, append fields manually:
  // formData.append('first_name', document.getElementById('first_name').value);
  // formData.append('last_name', document.getElementById('last_name').value);
  // formData.append('date_of_birth', document.getElementById('date_of_birth').value);


  try {
    const res = await fetch('/profile/api', { // <-- correct POST route
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token  // no Content-Type here — FormData handles it automatically
      },
      body: formData  // ✅ send as multipart/form-data
    });

    const data = await res.json();

    if (res.ok) {
      alert('✅ ' + (data.message || 'Profile updated!'));
      if (data.profile && data.profile.profile_photo) {
        const preview = document.getElementById('photo-preview');
        if (preview) preview.src = data.profile.profile_photo;
      }
    // if (res.ok) {
    //   alert('✅ Profile updated!');
    //   if (data.profile?.profile_photo) {
    //     document.getElementById('photo-preview').src = data.profile.profile_photo;
    //   }
    } else {
      alert('⚠️ ' + (data.error || 'Failed to update profile.'));
    }
  } catch (err) {
    console.error('❌ Upload failed:', err);
    alert('Network or server error.');
  }
});
});




// document.getElementById("year").textContent = new Date().getFullYear();

//     // Pre-fill existing profile
//     fetch('/profile', { 
//         headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') }
//      })
//       .then(res => res.json())
//       .then(data => {
//         for (const key in data) {
//           if (document.querySelector(`[name="${key}"]`)) {
//             document.querySelector(`[name="${key}"]`).value = data[key];
//           }
//         }
//       });

//     document.querySelector('#profile-form').addEventListener('submit', async (e) => {
//       e.preventDefault();
//       const formData = Object.fromEntries(new FormData(e.target).entries());

//       const res = await fetch('/profile', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: 'Bearer ' + localStorage.getItem('accessToken')
//         },
//         body: JSON.stringify(formData)
//       });

//       const msg = await res.json();
//       alert(msg.message);
//     });