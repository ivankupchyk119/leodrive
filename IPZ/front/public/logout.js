document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.querySelector('#logout-btn');
  
    if (!logoutBtn) return; // если кнопки нет — ничего не делаем
  
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
  
      const confirmLogout = confirm('Czy na pewno chcesz się wylogować?');
      if (!confirmLogout) return;
  
      const token = localStorage.getItem('token');
  
      try {
        const res = await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
  
        if (!res.ok) {
          throw new Error('Serwer nie odpowiedział poprawnie');
        }
  
        // ✅ Показ уведомления
        alert('Wylogowano pomyślnie!');
      } catch (err) {
        console.warn('Nie udało się wylogować z serwera. Czyści lokalnie.');
        alert('Wystąpił problem z serwerem, ale zostałeś wylogowany lokalnie.');
      }
  
      // 🧹 Очистка и редирект
      localStorage.removeItem('token');
      localStorage.removeItem('selectedAvatar');
      localStorage.removeItem('userId');
  
      window.location.href = '/front/public/konto_login/log.html';
    });
  });
  