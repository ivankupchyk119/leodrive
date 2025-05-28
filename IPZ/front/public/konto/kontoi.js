document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in first!');
    window.location.href = 'login.html';
    return;
  }
  let user;
  try {
    // 🔄 получаем данные (с включённым populate(course))
    const response = await fetch('http://localhost:5000/api/users/getInfoForMe', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return;
      }
      throw new Error(`Błąd serwera: ${response.statusText}`);
    }

    user = await response.json();
    console.log('USER FROM API →', user);

    if (!user.name || !user.surname || !user.role) {
      throw new Error('Niekompletne dane użytkownika');
    }

    document.getElementById('user-name').textContent = `${user.name} ${user.surname}`;
    document.getElementById('user-role').textContent = user.role;
    document.getElementById('user-category').textContent = `Kategoria: ${user.course?.category ?? 'Nieokreślone'}`;
    const avatarEl = document.querySelector('.avatar');

    if (user.role === 'instructor') {
      avatarEl.classList.add('instructor-avatar');
    }

  } catch (err) {
    console.error(err);
    alert("Nie można pobrać danych użytkownika");
    return;
  }

  /* ----- Аватар ----- */
  const avatar = document.querySelector('.avatar');
  const picker = document.getElementById('avatar-picker');
  const closeBtn = document.getElementById('close-picker');
  const options = document.querySelectorAll('.avatar-option');

  // Установка аватара с сервера
  if (user.avatarUrl) {
    avatar.setAttribute('src', user.avatarUrl);
  }

  // Клик по аватару — открыть панель
  avatar.addEventListener('click', () => {
    picker.classList.remove('hidden');
  });

  // Закрытие панели
  closeBtn.addEventListener('click', () => {
    picker.classList.add('hidden');
  });

  // Выбор нового аватара
  options.forEach(img => {
    img.addEventListener('click', async () => {
      const newSrc = img.getAttribute('src');
      avatar.setAttribute('src', newSrc);
      picker.classList.add('hidden');

      // Обновление на сервере
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/users/set-avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarUrl: newSrc })
      });
    });
  });

  const uploadInput = document.getElementById('upload-avatar');

  uploadInput.addEventListener('change', async () => {
    const file = uploadInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    // 🔧 Вот так:
    const avatar = document.querySelector('.avatar');
    const picker = document.getElementById('avatar-picker');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/upload-avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Błąd podczas przesyłania avatara');
      }

      const data = await response.json();
      avatar.setAttribute('src', data.avatarUrl);
      picker.classList.add('hidden');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Nie udało się przesłać avatara');
    }
  });



  /* -------- Материалы -------- */
  const addBtn = document.getElementById('addMaterialsBtn');
  const modal = document.getElementById('materialModal');
  const closeMd = document.getElementById('closeModal');
  const matForm = document.getElementById('materialForm');

  // показываем кнопку, если роль = instructor (регистр не важен)
  if (user.role && user.role.toLowerCase() === 'instructor') {
    addBtn.style.display = 'inline-block';

  }

  addBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  closeMd.addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

  matForm.addEventListener('submit', async e => {
    e.preventDefault();

    // <‑‑ вставьте эти 6 строк в начале обработчика -->
    const fileInput = matForm.querySelector('input[name="file"]');
    const linkInput = matForm.querySelector('input[name="link"]');
    if (!fileInput.files.length && !linkInput.value.trim()) {
      alert('Dodaj plik lub link');
      return;
    }

    const fd = new FormData(matForm);
    // добавляем courseId, только если он реально существует
    try {
      const res = await fetch('http://localhost:5000/api/materials', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        // próbujemy odczytać JSON, jeśli go nie ma – używamy statusText
        let errMsg = res.statusText;
        try {
          const err = await res.json();
          errMsg = err.message || errMsg;
        } catch { }
        throw new Error(errMsg);
      }

      alert('Plik został wysłany!');
      matForm.reset();
      modal.classList.add('hidden');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Błąd podczas przesyłania pliku');
    }
  });

  async function fetchNotes() {
    const token = localStorage.getItem("token");
    const resp = await fetch("http://localhost:5000/api/schedules/notesForInstructor", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const notes = await resp.json();
    const container = document.getElementById("notes-list");
    container.innerHTML = "";

    notes.forEach(note => {
      const div = document.createElement("div");
      div.className = "note-card";
      div.innerHTML = `
          <p>${note.studentNotes}</p>
          <div class="note-meta">
            <span>${note.date.slice(0, 10)} ${note.startTime}</span>
            <strong>${note.student?.name || ''} ${note.student?.surname || ''}</strong>
          </div>
        `;
      container.appendChild(div);
    });

  }
  // Показываем кнопку "Посмотреть нотатки", если это инструктор
  const showNotesBtn = document.getElementById('showNotesBtn');
  const notesList = document.getElementById('notes-list');

  if (user.role && user.role.toLowerCase() === 'instructor') {
    showNotesBtn.style.display = 'inline-block';
  }

  showNotesBtn.addEventListener('click', async () => {
    showNotesBtn.disabled = true;
    try {
      await fetchNotes(); // твоя функция уже определена
      notesList.classList.remove("hidden");
    } catch (err) {
      console.error("Ошибка при загрузке нотаток", err);
      alert("Не удалось загрузить нотатки.");
    } finally {
      showNotesBtn.disabled = false;
    }
  });
  const closeNotesBtn = document.getElementById('closeNotesModal');
  const notesModal = document.getElementById('notesModal');

  // Закрытие по крестику
  closeNotesBtn.addEventListener('click', () => {
    notesModal.classList.add('hidden');
  });

  // Закрытие по клику вне окна
  window.addEventListener('click', e => {
    if (e.target === notesModal) {
      notesModal.classList.add('hidden');
    }
  });


});