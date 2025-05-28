document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.querySelector('#email').value.trim();
        const password = document.querySelector('#password').value.trim();

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Błąd logowania');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);

            // Извлечение userId из токена
            const payload = JSON.parse(atob(data.token.split('.')[1])); // Декодируем токен
            const userId = payload.userId;
            localStorage.setItem('userId', userId); // Сохраняем userId в localStorage

            console.log('Logowanie zakończone sukcesem, ID użytkownika:', userId);

            // 🔔 Подписка на push-уведомления
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    await subscribeUser(userId);
                    console.log('🔔 Użytkownik subskrybowany na powiadomienia push');
                } catch (err) {
                    console.warn('⚠️ Subskrypcja push nie powiodła się:', err);
                }
            }

            // Перенаправление в зависимости от роли
            if (payload.role === 'student') {
                location.replace('/front/public/cennik/cennik.html');
            } else if (payload.role === 'instructor') {
                location.replace('/front/public/konto/kontoi.html');
            } else {
                alert('Nieznana rola');
            }
            
        } catch (error) {
            console.error('Błąd:', error.message);
            alert('Błąd logowania: ' + error.message);
        }
    });
});
