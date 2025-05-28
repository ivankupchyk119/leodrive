document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('.register-form');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.querySelector('#register-name').value;
        const email = document.querySelector('#register-email').value;
        const surname = document.querySelector("#register-surname").value;
        const password = document.querySelector('#register-password').value;
        const repeatPassword = document.querySelector('#repeat-password').value;
        const role = 'student'; // Тільки учні можуть реєструватися


        if (password !== repeatPassword) {
            alert('Hasła się nie zgadzają!');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, surname, role }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Rejestracja nie powiodła się');
            }

            const data = await response.json();
            console.log('Rejestracja zakończona sukcesem:', data);
            alert('Rejestracja zakończona sukcesem! Teraz możesz się zalogować.');
            window.location.href = '/front/public/konto_login/log.html';
        } catch (error) {
            console.error('Error:', error.message);
            alert('Rejestracja nie powiodła się: ' + error.message);
        }
    });
});
