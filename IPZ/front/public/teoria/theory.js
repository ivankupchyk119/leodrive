document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  // 1. Функция маппинга курсов -> категории
  function mapCourseToCategory(course) {
    if (["A1", "A2", "AM"].includes(course)) return "A";
    if (course === "BE") return "B";
    return course;
  }

  // 2. Получаем курс пользователя (допустим, есть API /api/user/profile)
  const userResp = await fetch("http://localhost:5000/api/users/getInfoForMe", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!userResp.ok) {
    alert("Nie udało się pobrać info ob studencie");
    return;
  }
  const userData = await userResp.json();
  const userCourse = userData.course?.category; // например, 'A2', 'BE' и т.п.

  // Маппим курс пользователя на категорию
  const userCategory = mapCourseToCategory(userCourse);

  // ⬇️ СКРЫТЬ кнопки категорий, которые не соответствуют курсу пользователя
  document
    .querySelectorAll(".category-buttons .category-btn")
    .forEach((button) => {
      const category = button.dataset.category?.toUpperCase();
      if (category !== userCategory) {
        button.style.display = "none";
      }
    });

  // 3. Запрос прогресса тестов
  const response = await fetch(
    "http://localhost:5000/api/testResults/getInfoForUser",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    alert("Błąd połączenia z serwerem");
    return;
  }
  const testResults = await response.json();

  // 4. Категории, которые мы хотим отобразить
  // Скрыть прогресс-кружки других категорий
  document.querySelectorAll('.progress-card').forEach(card => {
        const category = card.dataset.category;
        if (category !== userCategory) {
            card.style.display = 'none';
        }
    });


  // Показывать прогресс только по нужной категории
  if (typeof userCategory !== "string") {
    console.error("Invalid userCategory:", userCategory);
    return;
  }
  const categories = [userCategory];

  // Функция для маппинга категории из результата в общую группу
  function mapResultCategory(cat) {
    if (["A1", "A2", "AM"].includes(cat)) return "A";
    if (cat === "BE") return "B";
    return cat;
  }

  categories.forEach(category => {
        const listContainer = document.getElementById(`progressList${category}`);
        if (!listContainer) return;

        listContainer.innerHTML = ''; // очистка

        const results = testResults.filter(r => mapResultCategory(r.category) === category && r.testName);


        if (results.length === 0) {
            listContainer.innerHTML = '<p>Brak wyników testów.</p>';
            return;
        }

        results.forEach(r => {
            const div = document.createElement('div');
            div.className = 'test-progress';

            div.innerHTML = `
      <div class="test-name">${r.testName.replace(/^test/i, 'Test ')}</div>
      <div class="progress-circle-small" style="color: ${r.result > 0 ? 'green' : 'red'}">${r.result}%</div>
    `;

            listContainer.appendChild(div);
        });
    });


  // --- Далее идет остальной твой код без изменений ---
  // Отображение рейтинга, доп.материалы и прочее
  const resp = await fetch("http://localhost:5000/api/testResults/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    alert("Błąd połączenia z serwerem");
    return;
  }
  const listRaiting = await resp.json();
  const userAndScrore = document.querySelector("#userAndScrore");
  listRaiting.forEach((x, idx) => {
    const newElem = `
        <div class='user-and-score'>
            <div class='user'>${x.name} ${x.surname}</div>
            <div class='line'></div>
            <div class='score'>${x.totalScore}</div>
        </div>`;
    userAndScrore.innerHTML += newElem;
  });

  /* ------------- Доп материалы: общий список ----------------- */
  async function refreshMaterials() {
    const list = document.getElementById("materialsList");
    list.innerHTML = "";

    const r = await fetch("http://localhost:5000/api/materials", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) {
      list.innerHTML = '<p class="empty-msg">Błąd ładowania.</p>';
      return;
    }

    const files = await r.json();
    if (!files.length) {
      list.innerHTML =
        '<p class="empty-msg">Materiały nie zostały jeszcze załadowane.</p>';
      return;
    }

    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    files.forEach((f, i) => {
      const row = document.createElement("div");
      row.className = "material-item";
      row.style.animationDelay = `${i * 0.05}s`;

      let actionBtn = "";
      if (f.filePath) {
        // есть файл на сервере – скачиваем через токен
        actionBtn = `<button class="download-btn install-icon" data-id="${f._id}" data-title="${f.title}"><svg xmlns="http://www.w3.org/2000/svg" class="install-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v12m0 0l-4-4m4 4l4-4m-6 8h8a2 2 0 002-2v-4" />
    </svg></button>`;
      } else if (f.link) {
        // только ссылка – открываем напрямую
        actionBtn = `<button class="link-btn install-icon" data-link="${f.link}"><svg xmlns="http://www.w3.org/2000/svg" class="install-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v12m0 0l-4-4m4 4l4-4m-6 8h8a2 2 0 002-2v-4" />
    </svg></button>`;
      }

      row.innerHTML = `<span>${f.title}</span>${actionBtn}`;
      list.appendChild(row);
    });
  }

  document.querySelector('.category-buttons').dataset.loaded = "true";
  document.querySelector('.progress-cards').dataset.loaded = "true";
  document.querySelector('.info-section').dataset.loaded = "true";


  await refreshMaterials();

  /* ----------- скачивание / переход -------------------------- */
  document.addEventListener("click", async (e) => {
    // Переход по внешней ссылке
    if (e.target.closest(".link-btn")) {
      const btn = e.target.closest(".link-btn");
      const url = btn.dataset.link;
      if (url) window.open(url, "_blank");
      return;
    }

    // Скачивание файла
    const downloadBtn = e.target.closest(".download-btn");
    if (!downloadBtn) return;

    const id = downloadBtn.dataset.id;
    const title = downloadBtn.dataset.title || "file";

    try {
      const resp = await fetch(
        `http://localhost:5000/api/materials/download/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!resp.ok) {
        alert("Błąd pobierania");
        return;
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Nie udało się pobrać pliku");
    }
  });
  // Мапа тестов по категориям
const testsByCategory = {
    A: ['testA.html', 'testA1.html', 'testA2.html', 'testAM.html'],
    B: ['testB.html', 'testB_2.html', 'testB_3.html', 'testBE.html' ],
    D: ['testD.html', 'testD_2.html', 'testD_3.html']
};

// Соберём все кнопки в один список
const allButtons = document.querySelectorAll('.category-buttons .category-btn');

allButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        const tests = testsByCategory[category];

        // Получаем список кнопок для данной категории
        const sameCatButtons = Array.from(allButtons).filter(b => b.dataset.category === category);

        // Индекс текущей кнопки в списке кнопок этой категории
        const localIndex = sameCatButtons.indexOf(btn);

        if (tests && tests[localIndex]) {
            window.location.href = `${tests[localIndex]}?cat=${category}`;
        } else {
            alert('Brak pliku dla tego testu.');
        }
    });
});

});

document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;

  // 1. Установить тему при загрузке страницы
  const savedTheme = localStorage.getItem("theme") || "light-theme";
  body.classList.add(savedTheme);
  themeToggle.textContent = savedTheme === "dark-theme" ? "🌙" : "☀️";

  // 2. Добавить слушатель на кнопку
  themeToggle.addEventListener("click", () => {
    // Удалить текущую тему
    body.classList.toggle("light-theme");
    body.classList.toggle("dark-theme");

    // Проверить текущую тему
    const currentTheme = body.classList.contains("dark-theme")
      ? "dark-theme"
      : "light-theme";

    // Обновить иконку
    themeToggle.textContent = currentTheme === "dark-theme" ? "🌙" : "☀️";

    // Сохранить тему в localStorage
    localStorage.setItem("theme", currentTheme);
  });
});

