document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  if (!token || !userId) {
    console.error('Nie znaleziono tokena lub ID użytkownika');
    return;
  }

  async function getUserInfo() {
    try {
      const resp = await fetch('http://localhost:5000/api/users/getInfoForMe', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!resp.ok) throw new Error('Błąd podczas pobierania danych użytkownika');
      return await resp.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  const user = await getUserInfo();


  if (user) {
    const baseCoursePrice = parseFloat(user.course?.price || 0);
    const premiumCost = user.premium ? 2000 : 0;
    const total = baseCoursePrice + premiumCost;
    const paid = parseFloat(user.paid || 0);
    const hasFullPremiumAccess = user.premium && paid >= total;

    const nameEl = document.querySelector('#name');
    const avatarEl = document.querySelector('.avatar');

    // Имя и визуал
    if (hasFullPremiumAccess) {
      nameEl.innerHTML = `<span class="premium-icon">⭐</span> <span class="smoke-text">${user.name} ${user.surname}</span>`;
      avatarEl.classList.add('premium-avatar');
    } else {
      nameEl.textContent = `${user.name} ${user.surname}`;
      avatarEl.classList.remove('premium-avatar');
    }

    // Скрыть премиум-аватар, если нет полного доступа
    const premiumAvatar = document.getElementById('premium-avatar');
    if (!hasFullPremiumAccess && premiumAvatar) {
      premiumAvatar.style.display = 'none';
    }


    document.querySelector('#category').textContent = user.course?.category || 'Brak';
    document.querySelector('#kurs').textContent = user.course?.description || 'Brak';

    // Цены
    const cenaEl = document.getElementById('cena');
    const paidEl = document.getElementById('paid');
    const mustPayEl = document.getElementById('must-pay');

    cenaEl.textContent = premiumCost > 0
      ? `${total.toLocaleString()} zł (z premium)`
      : `${baseCoursePrice.toLocaleString()} zł`;

    paidEl.textContent = `${paid.toLocaleString()} zł`;
    mustPayEl.textContent = `${(total - paid).toLocaleString()} zł`;

    // Ограничения доступа
    if (paid < total) {
      if (paid < baseCoursePrice) {
        // Нет даже базовой оплаты — всё заблокировано
        document.querySelectorAll(".nav-link").forEach(link => {
          if (link.href.includes("praktyka") || link.href.includes("theory")) {
            link.addEventListener("click", (e) => {
              e.preventDefault();
              alert("Dostęp zablokowany. Opłać podstawowy kurs.");
            });
            link.style.pointerEvents = "none";
            link.style.opacity = "0.5";
          }
        });

        const warning = document.createElement("p");
        warning.textContent = "⚠️ Nie zapłaciłeś nawet podstawowej kwoty za kurs!";
        warning.style.color = "red";
        warning.style.fontWeight = "bold";
        document.getElementById("info").appendChild(warning);

      } else if (user.premium) {
        // Есть базовая оплата, но премиум не доплачен
        const info = document.createElement("p");
        info.textContent = "Masz dostęp do kursu podstawowego. Aby odblokować funkcje premium, opłać całość.";
        info.style.color = "orange";
        info.style.fontWeight = "bold";
        document.getElementById("info").appendChild(info);
      }
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

    async function loadStudentGrades() {
      const container = document.getElementById('student-grades');

      if (!userId || !token) {
        container.innerHTML = '<p>Błąd: brak autoryzacji</p>';
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/schedules/student/grades/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          container.innerHTML = '<p>Nie udało się załadować ocen</p>';
          return;
        }

        const grades = await res.json();
        const now = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);

        const recentGrades = grades.filter(item => new Date(item.date) >= oneWeekAgo);

        if (recentGrades.length === 0) {
          container.innerHTML = '<p>Brak ocen z ostatniego tygodnia</p>';
          return;
        }

        recentGrades.forEach(item => {
          const date = new Date(item.date).toISOString().split('T')[0];
          const div = document.createElement('div');
          div.classList.add('grade-item');
          div.textContent = `Data: ${date}, Godzina: ${item.startTime}–${item.endTime}, Typ: ${item.type}, Ocena: ${item.assessment}`;
          container.appendChild(div);
        });

      } catch (err) {
        container.innerHTML = '<p>Błąd połączenia z serwerem</p>';
        console.error('Błąd ładowania ocen:', err);
      }
    }

    loadStudentGrades();

    const reportBtn = document.getElementById('generate-report');
    if (reportBtn) {
      reportBtn.addEventListener('click', async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/schedules/student/grades/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const grades = await res.json();
          const now = new Date();
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);

          const recentGrades = grades.filter(item => new Date(item.date) >= oneWeekAgo);

          if (recentGrades.length === 0) {
            alert("Brak ocen z ostatniego tygodnia.");
            return;
          }

          let report = 'RAPORT OCEN – ostatni tydzień\n\n';
          recentGrades.forEach(item => {
            const date = new Date(item.date).toISOString().split('T')[0];
            report += `Data: ${date}, Godzina: ${item.startTime}–${item.endTime}, Typ: ${item.type}, Ocena: ${item.assessment}\n`;
          });

          const blob = new Blob([report], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'raport_ocen.txt';
          a.click();
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Błąd generowania raportu:', err);
        }
      });
    }
  };
});
