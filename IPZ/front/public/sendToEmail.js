document.addEventListener('DOMContentLoaded', () => {
    const sendMessage = document.querySelector("#sendMessage");
    sendMessage.style.cursor='pointer'
    sendMessage.style.color='yellow '
    sendMessage.style.fontSize='15px'
    sendMessage.addEventListener('click', () => {
        // Створюємо overlay
        const overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '1000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // Створюємо форму
        const popupForm = document.createElement('div');
        popupForm.style.background = '#fff';
        popupForm.style.borderRadius = '10px';
        popupForm.style.padding = '20px';
        popupForm.style.width = '300px';
        popupForm.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
        popupForm.style.zIndex = '1001';

        popupForm.innerHTML = `
           <form id="messageForm">
                <h2 style="text-align: center; margin-bottom: 20px;">Napisz do administratora</h2>
                <label for="email">Email:</label>
                <input type="email" id="email" placeholder="Wpisz swój email" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 5px;" required>
                <span class="error" id="emailError" style="color: red; font-size: 12px; display: none;"></span>
                <label for="description">Opis:</label>
                <textarea id="description" placeholder="Wpisz opis..." style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 5px;" required></textarea>
                <span class="error" id="descriptionError" style="color: red; font-size: 12px; display: none;"></span>
                <div style="display: flex; justify-content: space-between;">
                    <button type="submit" style="padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Wyślij</button>
                    <button type="button" id="cancelButton" style="padding: 8px 15px; background: #ccc; color: black; border: none; border-radius: 5px; cursor: pointer;">Anuluj</button>
                </div>
            </form>

        `;

        // Додаємо overlay і форму в DOM
        overlay.appendChild(popupForm);
        document.body.appendChild(overlay);

        // Обробка закриття форми
        const cancelButton = popupForm.querySelector("#cancelButton");
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // Обробка відправки форми
        const messageForm = popupForm.querySelector("#messageForm");
        messageForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = popupForm.querySelector("#email").value.trim();
            const description = popupForm.querySelector("#description").value.trim();

            // Валідація
            let isValid = true;
            const emailError = popupForm.querySelector("#emailError");
            const descriptionError = popupForm.querySelector("#descriptionError");

            emailError.style.display = 'none';
            descriptionError.style.display = 'none';

            if (!email) {
                emailError.textContent = 'Введіть email!';
                emailError.style.display = 'block';
                isValid = false;
            }

            if (!description) {
                descriptionError.textContent = 'Введіть опис!';
                descriptionError.style.display = 'block';
                isValid = false;
            }

            if (!isValid) return;

            try {
                const response = await fetch('http://localhost:5000/api/auth/sendToAdminEmail', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ emailUser: email, description }),
                });

                if (response.ok) {
                    alert('Wiadomość wysłana pomyślnie!');
                    document.body.removeChild(overlay);
                } else {
                    const error = await response.json();
                    alert(`Błąd: ${error.message}`);
                }
            } catch (err) {
                alert('Nie udało się wysłać wiadomości!'); 
            }
        });
    });
});
