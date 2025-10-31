  document.addEventListener("DOMContentLoaded", () => {
      const video = document.getElementById("video");
      const canvas = document.getElementById("canvas");
      const snapBtn = document.getElementById("snap");
      const preview = document.getElementById("preview");
      const form = document.getElementById("selfie-form");
      const input = document.getElementById("selfieInput");
    
      // start camera
      async function startCamera() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          video.srcObject = stream;
          // ensure playback (some browsers require explicit play)
          await video.play().catch(()=>{});
          console.log("📷 Camera started");
        } catch (err) {
          console.error("Camera access denied:", err);
          alert("Camera required. If blocked, please allow access and reload page.");
        }
      }
    
      startCamera();
    
      // 📸 snapshot
      snapBtn.addEventListener("click", () => {
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        preview.src = canvas.toDataURL("image/png");
        preview.style.display = "block";
        video.style.display = "none";  // ✅ Hide video after snap
      });
    
      // convert base64 -> Blob helper
      function base64ToBlob(base64Data, contentType='image/png') {
  const parts = base64Data.split(',');
  const byteString = atob(parts[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ia], { type: contentType });
}

    
      // submit selfie
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return; // session flow allowed
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
    
        const fd = new FormData();
        if (input.files && input.files[0]) {
          const f = input.files[0];
          if (f.size > 10*1024*1024) { alert("Image too large"); if (btn) btn.disabled = false; return; }
          fd.append('selfie', f);
        } else if (preview.src) {
       // const parts = preview.src.split(',');
       // const blob = base64ToBlob(parts[1]);
          const blob = base64ToBlob(preview.src);
          fd.append('selfie', blob, 'selfie.png');
        } else {
          alert("No selfie or snapshot present.");
          if (btn) btn.disabled = false;
          return;
        }
    
        try {
          console.log("➡ Uploading selfie...");
          const res = await fetch('/protect/upload/selfie', {
            method: 'POST',
            credentials: 'include',
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
            body: fd
          });
    
          const result = await res.json().catch(()=>({}));
          console.log('<= selfie upload', res.status, result);
    
          if (res.ok) {
            alert(result.message || 'Selfie uploaded successfully!');
            window.location.href = '/protect/selfie/success';
          } else {
            alert(result.error || 'Upload failed.');
            if (btn) btn.disabled = false;
          }
        } catch (err) {
          console.error('❌ Selfie upload error', err);
          alert('Network/upload error.');
          if (btn) btn.disabled = false;
        }
      });
    
      // next button fallback
      const nextBtn = document.getElementById("nextBtn");
      if (nextBtn) nextBtn.addEventListener('click', ()=> window.location.href='/protect/selfie/success');
    });
  