// public/js/settings.js  (rename file from sittings.js -> settings.js)
fetch('/profile/settings', { headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') } })
  .then(res => res.json())
  .then(data => {
    if (data.email_notifications) document.querySelector('[name="email_notifications"]').checked = true;
    if (data.dark_mode) document.querySelector('[name="dark_mode"]').checked = true;
    if (data.language) document.querySelector('[name="language"]').value = data.language;
  });

document.querySelector('#settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(e.target).entries());
  
  formData.email_notifications = !!formData.email_notifications;
  formData.dark_mode = !!formData.dark_mode;

  const res = await fetch('/profile/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('accessToken')
    },
    body: JSON.stringify(formData)
  });

  const msg = await res.json();
  alert(msg.message);
});




