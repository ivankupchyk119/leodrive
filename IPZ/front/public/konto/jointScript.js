document.addEventListener('DOMContentLoaded', async () => {
  // Отримання токену для авторизації
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Nie jesteś autoryzowany!');
    return;
  }

  try {
    // Виконання запиту на отримання сповіщень
    const response = await fetch('http://localhost:5000/api/users/notifications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Błąd podczas pobierania powiadomień.');
    }

    // Парсимо відповідь
    const notifications = await response.json();

    // Отримуємо елемент для відображення сповіщень
    const infoDiv = document.querySelector('#info');

    // Додаємо стилі для контейнера
    infoDiv.style.padding = '20px';
    infoDiv.style.backgroundColor = '#fff9f3';
    infoDiv.style.borderRadius = '8px';
    infoDiv.style.border = '1px solid #ccc';
    infoDiv.style.maxHeight = '400px';
    infoDiv.style.overflowY = 'auto';

    // Перевірка на наявність сповіщень
    if (notifications.length === 0) {
      infoDiv.innerHTML = '<p>Nie masz powiadomień.</p>';
      return;
    }

    // Виведення сповіщень
    notifications.reverse().forEach((notification) => {
      const notificationElement = document.createElement('div');
      notificationElement.style.marginBottom = '15px';
      notificationElement.style.padding = '10px';
      notificationElement.style.backgroundColor = '#fff';
      notificationElement.style.border = '1px solid #ddd';
      notificationElement.style.borderRadius = '5px';
      notificationElement.style.borderLeft = "4px solid #ff7a00";

      // Додаємо заголовок та повідомлення
      const title = document.createElement('h4');
      title.textContent = `Powiadomienie`;
      title.style.marginBottom = '5px';

      const message = document.createElement('p');
      message.textContent = notification.message;

      // Перевірка на null для отримання користувачів
      const recipient = notification.recipient || {};
      const sender = notification.sender || {};

      let instructor = null;
      let student = null;

      if (sender.role === 'instructor') {
        instructor = sender;
        student = recipient;
      } else if (recipient.role === 'instructor') {
        instructor = recipient;
        student = sender;
      }

      // Додаємо імена у правильному порядку
      if (instructor && instructor.name && instructor.surname) {
        message.textContent += `. Nauczyciel: ${instructor.name} ${instructor.surname}`;
      }

      if (student && student.name && student.surname) {
        message.textContent += `, Student: ${student.name} ${student.surname}`;
      }

      // Вставляємо елементи
      notificationElement.appendChild(title);
      notificationElement.appendChild(message);
      infoDiv.appendChild(notificationElement);
    });

  } catch (error) {
    console.error('Błąd:', error.message);
    alert('Nie udało się otrzymać powiadomienia.');
  }
});