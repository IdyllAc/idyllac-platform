document.addEventListener('DOMContentLoaded', () => {
 const form = document.getElementById('document-form');
 if (!form) return console.error("❌ document form not found");

 form.addEventListener('submit', async (e) => {
 const accessToken = localStorage.getItem('accessToken');
 // If no token, let normal form submit (session flow)
 if (!accessToken) return; // let HTML form submit normally for session users

 e.preventDefault(); // prevent redirect only for API users
 const btn = form.querySelector('button[type="submit"]');
 if (btn) btn.disabled = true; // disable button to prevent multiple submits

 const formData = new FormData(form);

try {
console.log("➡ Uploading documents (API)...");
const res = await fetch('/protect/upload/document', {
  method: 'POST',
  credentials: 'include',
  headers: { 
    'Authorization': `Bearer ${accessToken}` 
  },
  body: formData
});

const result = await res.json().catch(() => ({}));
console.log('<= upload documents result', res.status, result);

if (res.ok) {
alert(result.message || 'Documents uploaded successfully!');
// Redirect to selfie capture step
window.location.href = '/protect/upload/selfie'; // ✅ Redirect
} else {
alert(result.error || result.message || 'Document upload failed.');
if (btn) btn.disabled = false; // re-enable button
}
} catch (err) {
console.error('❌ Upload document error:', err);
alert('Network/upload documents error.');
if (btn) btn.disabled = false; // re-enable button
}
});
});



// Set current year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    
  

