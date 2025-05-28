document.getElementById('update-password-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Забороняємо стандартне відправлення форми

    const password = document.getElementById('password').value; // Отримуємо новий пароль
    const confirmPassword = document.getElementById('confirm-password').value; // Отримуємо підтвердження пароля

    // Перевірка чи паролі співпадають
    if (password !== confirmPassword) {
        document.getElementById('error-message').textContent = "Hasła nie pasują do siebie."; // Повідомлення про помилку
        return;
    }

    // Якщо паролі співпадають, відправляємо запит на сервер
    const token = new URLSearchParams(window.location.search).get('token'); // Отримуємо токен з URL

    try {
        const response = await fetch('http://localhost:5000/api/auth/update-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password, token }), // Відправляємо новий пароль і токен
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Nie udało się zresetować hasła');
        }

        alert('Hasło zostało zaktualizowane!');
        window.location.href = '/front/public/konto_login/log.html'; // Перенаправляємо користувача на сторінку входу після оновлення пароля
    } catch (error) {
        console.error('Error:', error.message);
        alert('Błąd: ' + error.message); // Виведення помилки, якщо вона сталася
    }
});
