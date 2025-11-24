document.getElementById('completeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('accessToken');
  
      const res = await fetch('/protect/complete', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        window.location.href = data.next;
      } else {
        alert('Error: ' + data.message);
      }
    });