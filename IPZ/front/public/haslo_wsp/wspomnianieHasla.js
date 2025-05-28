document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('remind-password-form');

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = document.getElementById('email').value;

      try {
        const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Nie udało się wysłać wiadomości e-mail');
        }

        alert('Wysłano e-maila z twoim hasłem!');
        window.location.href = '/front/public/konto_login/log.html';
      } catch (error) {
        console.error('Błąd:', error.message);
        alert('Błąd: ' + error.message); // Виведення помилки
      }
    });
  } else {
    console.error('Nie znaleziono formularza o ID "remind-password-form".');
  }
});