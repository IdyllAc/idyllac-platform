/* public/js/selfie.js — hardened debug version */
document.addEventListener("DOMContentLoaded", () => {
  console.log("📷 selfie.js loaded!");

  const form = document.getElementById("selfie-form");
  const input = document.getElementById("selfieInput");
  const snapBtn = document.getElementById("snap");
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const preview = document.getElementById("preview");

  if (!form || !input || !snapBtn || !video || !canvas || !preview) {
    console.error("❌ Missing element(s). Expected IDs: selfie-form, selfieInput, snap, video, canvas, preview");
    return;
  }

  function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(',');
    const meta = parts[0].match(/:(.*?);/);
    const mime = meta ? meta[1] : 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play().catch(()=>{});
      console.log("📷 Camera started");
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Camera access denied. Allow camera and reload page.");
    }
  }
  startCamera();

  video.addEventListener("loadedmetadata", () => {
    console.log("🎥 Metadata loaded:", video.videoWidth, video.videoHeight);
  });
  
  snapBtn.addEventListener("click", () => {
    const ctx = canvas.getContext("2d");
    // ensure canvas resolution matches video
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    preview.src = canvas.toDataURL("image/png");
    preview.style.display = "block";
    video.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("➡ Submit selfie triggered");

    const accessToken = localStorage.getItem("accessToken");
    const fd = new FormData();

    // Use file input if present
    if (input.files && input.files[0]) {
      console.log("📁 Using chosen file:", input.files[0].name, input.files[0].size);
      fd.append("selfie", input.files[0]);
    } else if (preview.src) {
      console.log("📸 Using snapshot (dataURL) length:", preview.src.length);
      const blob = dataURLtoBlob(preview.src);
      fd.append("selfie", blob, "selfie.png");
    } else {
      alert("No selfie selected or captured.");
      return;
    }

    // log FormData keys (can't log values directly)
    for (const k of fd.keys()) console.log("FormData key:", k);

    const url = "/protect/upload/selfie";
    console.log("📡 Uploading to:", url, "credentials: include, Authorization:", !!accessToken);

    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: fd,
      });

      console.log("⤴️ fetch returned (no throw). status:", res.status, res.statusText);

      // Try to read JSON if possible
      const json = await res.json().catch(()=>null);
      console.log("<= server JSON:", json);

      if (res.ok) {
        alert(json?.message || "Selfie uploaded succesfully");
        window.location.href = "/protect/selfie/success";
      } else {
        // If 4xx/5xx — show server message
        alert(json?.error || json?.message || `Upload failed (HTTP ${res.status})`);
      }
    } catch (err) {
      // This is the "Failed to fetch" branch
      console.error("❌ Network/Fetch error:", err);
      alert("Network error during upload. Check server logs and network tab.");
    }
  });
});










// document.addEventListener("DOMContentLoaded", () => {
//   console.log("📷 selfie.js loaded!");

//   const form = document.getElementById("selfie-form");
//   const input = document.getElementById("selfieInput");
//   const snapBtn = document.getElementById("snap");
//   const video = document.getElementById("video");
//   const canvas = document.getElementById("canvas");
//   const preview = document.getElementById("preview");

//   if (!form || !input || !snapBtn || !video || !canvas || !preview) {
//     console.error("❌ Missing HTML elements. Check IDs in selfie.ejs.");
//     return;
//   }

//   // Start camera
//   async function startCamera() {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       video.srcObject = stream;
//       await video.play().catch(() => {});
//       console.log("📷 Camera started");
//     } catch (err) {
//       console.error("Camera denied:", err);
//       alert("Camera blocked. Fix permissions.");
//     }
//   }
//   startCamera();

//   // Snap photo
//   snapBtn.addEventListener("click", () => {
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//     preview.src = canvas.toDataURL("image/png");
//     preview.style.display = "block";
//     video.style.display = "none";
//   });

//   // Submit form
//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const fd = new FormData();
//     const accessToken = localStorage.getItem("accessToken");

//     // If file chosen
//     if (input.files && input.files[0]) {
//       fd.append("selfie", input.files[0]);
//     } else if (preview.src) {
//       // Snapshot
//     //  const blob = await (await fetch(preview.src)).blob(); // this is replacement of blob to prevent CSP .. .. ..

//       // function dataURLtoBlob(dataURL) {
//       //   const arr = dataURL.split(',');
//       //   const mime = arr[0].match(/:(.*?);/)[1];
//       //   const bstr = atob(arr[1]);
//       //   let n = bstr.length;
//       //   const u8arr = new Uint8Array(n);
      
//       //   while (n--) {
//       //     u8arr[n] = bstr.charCodeAt(n);
//       //   }
      
//       //   return new Blob([u8arr], { type: mime });
//       // }
//       fd.append("selfie", blob, "selfie.png");
//     } else {
//       alert("No selfie selected");
//       return;
//     }

//     const res = await fetch("/protect/upload/selfie", {
//       method: "POST",
//       credentials: "include",
//       headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
//       body: fd,
//     });

//     const result = await res.json().catch(() => ({}));
//     console.log("<= upload response", res.status, result);

//     if (res.ok) {
//       alert(result.message || "Selfie uploaded.");
//       window.location.href = "/protect/selfie/success";
//     } else {
//       alert(result.error || "Upload failed.");
//     }
//   });
// });








// console.log("📷 selfie.js loaded!");

//   document.addEventListener("DOMContentLoaded", () => {
//       const video = document.getElementById("video");
//       const canvas = document.getElementById("canvas");
//       const snapBtn = document.getElementById("snap");
//       const preview = document.getElementById("preview");
//       const form = document.getElementById("selfie-form");
//       if (!form) return console.error("Selfie form NOT found!");
//       const input = document.getElementById("selfieInput");
//       if (!input) return console.error("Selfie file input NOT found!");

    
//       // start camera
//       async function startCamera() {
//         try {
//           const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//           video.srcObject = stream;
//           // ensure playback (some browsers require explicit play)
//           await video.play().catch(()=>{});
//           console.log("📷 Camera started");
//         } catch (err) {
//           console.error("Camera access denied:", err);
//           alert("Camera required. If blocked, please allow access and reload page.");
//         }
//       }
    
//       startCamera();
    
//       // 📸 snapshot
//       snapBtn.addEventListener("click", () => {
//         const ctx = canvas.getContext("2d");
//         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//         preview.src = canvas.toDataURL("image/png");
//         preview.style.display = "block";
//         video.style.display = "none";  // ✅ Hide video after snap
//       });
    
//       // convert base64 -> Blob helper
//       function base64ToBlob(base64Data, contentType='image/png') {
//   const parts = base64Data.split(',');
//   const byteString = atob(parts[1]);
//   const ab = new ArrayBuffer(byteString.length);
//   const ia = new Uint8Array(ab);
//   for (let i = 0; i < byteString.length; i++) {
//     ia[i] = byteString.charCodeAt(i);
//   }
//   return new Blob([ia], { type: contentType });
// }

    
//       // submit selfie
//       form.addEventListener("submit", async (e) => {
//         e.preventDefault();
//         const accessToken = localStorage.getItem("accessToken");
//         if (!accessToken) return; // session flow allowed
//         const btn = form.querySelector('button[type="submit"]');
//         if (btn) btn.disabled = true;
    
//         const fd = new FormData();
//         if (input.files && input.files[0]) {
//           const f = input.files[0];
//           if (f.size > 10*1024*1024) { alert("Image too large"); if (btn) btn.disabled = false; return; }
//           fd.append('selfie', f);
//         } else if (preview.src) {
//        // const parts = preview.src.split(',');
//        // const blob = base64ToBlob(parts[1]);
//           const blob = base64ToBlob(preview.src);
//           fd.append('selfie', blob, 'selfie.png');
//         } else {
//           alert("No selfie or snapshot present.");
//           if (btn) btn.disabled = false;
//           return;
//         }
    
//         try {
//           console.log("➡ Uploading selfie...");
//           const res = await fetch('/upload/selfie', {
//             method: 'POST',
//             credentials: 'include',
//             headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
//             body: fd
//           });
    
//           const result = await res.json().catch(()=>({}));
//           console.log('<= selfie upload', res.status, result);
    
//           if (res.ok) {
//             alert(result.message || 'Selfie uploaded successfully!');
//             window.location.href = '/protect/selfie/success';
//           } else {
//             alert(result.error || 'Upload failed.');
//             if (btn) btn.disabled = false;
//           }
//         } catch (err) {
//           console.error('❌ Selfie upload error', err);
//           alert('Network/upload error.');
//           if (btn) btn.disabled = false;
//         }
//       });
    
//       // next button fallback
//       const nextBtn = document.getElementById("nextBtn");
//       if (nextBtn) nextBtn.addEventListener('click', ()=> window.location.href='/protect/selfie/success');
//     });
  