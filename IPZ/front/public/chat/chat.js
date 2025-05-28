const token = localStorage.getItem('token');

if (!token) {
    alert("Brak tokena. Zaloguj się najpierw.");
    throw new Error("Brak tokena – przerwano działanie chat.js");
}

const socket = io('http://localhost:5000', { auth: { token } });

const recipientSelect = document.getElementById('recipient');
const messagesDiv = document.getElementById('messages');
const input = document.getElementById('input');
const userListSidebar = document.getElementById('userList');

let currentRecipient = null;

// Получаем ID текущего пользователя из токена
function getUserIdFromToken() {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (e) {
        console.error("Nieprawidłowy token JWT.");
        alert("Nieprawidłowy token. Zaloguj się ponownie.");
        throw e;
    }
}

const myId = getUserIdFromToken();

// Загружаем список пользователей
// Получаем данные о пользователе (включая проверку на полную оплату)
fetch("http://localhost:5000/api/users/getInfoForMe", {
    headers: { Authorization: `Bearer ${token}` }
})
    .then(resp => {
        if (!resp.ok) throw new Error("Nie udało się pobrać danych użytkownika");
        return resp.json();
    })
    .then(user => {
        const baseCoursePrice = parseFloat(user.course?.price || 0);
        const premiumCost = user.premium ? 2000 : 0;
        const total = baseCoursePrice + premiumCost;
        const paid = parseFloat(user.paid || 0);
        user.hasFullPremiumAccess = user.premium && paid >= total;

        localStorage.setItem("user", JSON.stringify(user));

        // 👇 ДОБАВЬ ЭТО ЗДЕСЬ
        fetch('http://localhost:5000/api/users', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(users => {
                displayUsersInSidebar(users);
                populateRecipientSelect(users);
            })
            .catch(err => console.error("Błąd ładowania użytkowników:", err));
    })
    .catch(err => {
        console.error("Błąd przy ładowaniu danych użytkownika:", err);
        alert("Błąd użytkownika. Zaloguj się ponownie.");
    });

// Заполняем селектор получателей
function populateRecipientSelect(users) {
    recipientSelect.innerHTML = '<option value="">--</option>';
    const currentUser = JSON.parse(localStorage.getItem("user"));

    users.forEach(user => {
        if (user._id === myId) return;

        // 🔐 Не показывать premium-инструкторов
        if (
            user.premium === true &&
            user.role === 'instructor' &&
            !currentUser?.hasFullPremiumAccess
        ) return;
        const opt = document.createElement('option');
        opt.value = user._id;
        opt.textContent = `${user.name} ${user.surname}`;
        recipientSelect.appendChild(opt);
    });
}

// Отображаем пользователей в сайдбаре
function displayUsersInSidebar(users) {
    userListSidebar.innerHTML = '';
    const currentUser = JSON.parse(localStorage.getItem("user"));

    users.forEach(user => {
        if (user._id === myId) return;

        // 🔐 Скрыть премиум-инструкторов от обычных юзеров без доступа
        if (
            user.premium === true &&
            user.role === 'instructor' &&
            !currentUser?.hasFullPremiumAccess
        ) return;

        const userDiv = document.createElement('div');
        userDiv.classList.add('user');
        userDiv.onclick = () => {
            document.querySelectorAll('.user').forEach(el => el.classList.remove('active'));
            userDiv.classList.add('active');
            recipientSelect.value = user._id;
            currentRecipient = user._id;
            fetchMessagesForPrivateChat();
        };

        // ⭐ Показываем звёздочку, если пользователь реально оплатил премиум
        const isPremium = user.fullyPaidPremium === true;
        const roleLabel = user.role === 'student' ? 'Student' : 'Instruktor';

        userDiv.innerHTML = `
        <img src="http://localhost:5000${user.avatarUrl || '/front/images/ultradefolt.png'}" alt="Avatar">
        <div class="info">
          <strong>${user.name} ${user.surname}${isPremium ? ' ⭐' : ''}</strong>
          <span class="status role">${roleLabel}</span>
        </div>
        `;

        userListSidebar.appendChild(userDiv);
    });
}


// При выборе получателя вручную
recipientSelect.addEventListener('change', () => {
    currentRecipient = recipientSelect.value;
    messagesDiv.innerHTML = '';
    if (currentRecipient) fetchMessagesForPrivateChat();
});

// Получение сообщений для приватного чата
function fetchMessagesForPrivateChat() {
    fetch(`http://localhost:5000/api/messages/private/${currentRecipient}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(displayMessages)
        .catch(err => console.error('Błąd wiadomości prywatnych:', err));
}

// Отображение сообщений
function displayMessages(messages) {
    if (!Array.isArray(messages)) return;

    messagesDiv.innerHTML = '';
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const isPremium = currentUser?.hasFullPremiumAccess;

    messages.forEach(msg => {
        const sender = msg.sender === myId ? 'Ty' : msg.name;

        // Обёртка сообщения + кнопки
        const wrapper = document.createElement('div');
        wrapper.classList.add('message-wrapper');

        // Сообщение
        const messageElement = document.createElement('p');
        messageElement.dataset.messageId = msg._id;
        messageElement.innerHTML = `<strong>${sender}:</strong> ${msg.content}`;
        messageElement.classList.add('message-content');

        wrapper.appendChild(messageElement);

        // Кнопка удаления
        if (msg.sender === myId && isPremium) {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.title = 'Usuń wiadomość';

            deleteBtn.onclick = () => {
                if (confirm("Na pewno usunąć wiadomość?")) {
                    deleteMessage(msg._id);
                }
            };

            wrapper.appendChild(deleteBtn);
        }

        messagesDiv.appendChild(wrapper);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}





// Отправка сообщения
function sendMessage() {
    const content = input.value.trim();
    if (!content || !currentRecipient) return;

    const data = {
        recipient: currentRecipient,
        content
    };

    socket.emit('message', data);
    input.value = '';
}
// Отправка сообщения при нажатии Enter
input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // предотвращаем перенос строки
        sendMessage();
    }
});
function deleteMessage(messageId) {
    fetch(`http://localhost:5000/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => {
            if (res.ok) {
                fetchMessagesForPrivateChat(); // перезагрузка сообщений
            } else {
                alert("Nie udało się usunąć wiadomości.");
            }
        })
        .catch(err => console.error("Błąd usuwania wiadomości:", err));
}



socket.on('message', (msg) => {
    const isPrivate = (msg.sender === myId && msg.recipient === currentRecipient) ||
        (msg.sender === currentRecipient && msg.recipient === myId);

    if (!isPrivate) return;

    const sender = msg.sender === myId ? 'Ty' : msg.name;
    const messageElement = document.createElement('p');
    messageElement.dataset.messageId = msg._id;
    messageElement.innerHTML = `<strong>${sender}:</strong> ${msg.content}`;

    const currentUser = JSON.parse(localStorage.getItem("user"));
    const isPremium = currentUser?.hasFullPremiumAccess;


    if (msg.sender === myId && isPremium) {
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '🗑';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.title = 'Usuń wiadomość';

        deleteBtn.onclick = () => {
            if (confirm("Na pewno usunąć wiadomość?")) {
                deleteMessage(msg._id);
            }
        };

        messageElement.appendChild(deleteBtn);
    }

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
