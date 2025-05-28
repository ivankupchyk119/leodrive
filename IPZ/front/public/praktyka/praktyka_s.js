document.addEventListener("DOMContentLoaded", async () => {
  // Zmienna dla wybranego instruktora i aktualnie wybranej daty tygodnia
  let idSelectInstruktor = null;
  let globalSelectDate = null;
  const currentStartDate = new Date();

  let selectedCell = null;
  let lessonType = "praktyka"; // значение по умолчанию


  // Pobranie referencji do elementów DOM
  const prevWeekBtn = document.getElementById("prevWeekBtn");
  const nextWeekBtn = document.getElementById("nextWeekBtn");
  const currentWeekLabel = document.getElementById("currentWeekLabel");
  const instruktorList = document.getElementById("instruktorList");
  const scheduleTable = document.getElementById("schedule");
  const selectStaticDiv = document.getElementById("select-static");
  const dateInput = document.getElementById("note-date");
  const newNoteInput = document.getElementById("new-note");
  const addNoteBtn = document.getElementById("add-note");


  //Берем данные с бд про премиум
  async function fetchCurrentUser() {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Brak tokenu");

      const resp = await fetch("http://localhost:5000/api/users/getInfoForMe", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) throw new Error("Nie udało się pobrać danych użytkownika");

      const user = await resp.json();

      // ⬇️ ДОБАВЛЕННЫЙ КОД
      const baseCoursePrice = parseFloat(user.course?.price || 0);
      const premiumCost = user.premium ? 2000 : 0;
      const total = baseCoursePrice + premiumCost;
      const paid = parseFloat(user.paid || 0);
      user.hasFullPremiumAccess = user.premium && paid >= total;
      // ⬆️ ДОБАВЛЕННЫЙ КОД

      localStorage.setItem("user", JSON.stringify(user));
      return user;
    } catch (err) {
      console.error("Błąd użytkownika:", err.message);
      alert("Nie udało się pobrać danych użytkownika.");
      return null;
    }
  }


  const currentUser = await fetchCurrentUser();
  if (!currentUser) return;



  // 1. Pobranie listy instruktorów z API
  async function getInstructors() {
    const token = localStorage.getItem("token");
    const resp = await fetch(
      "http://localhost:5000/api/schedules/instructors",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await resp.json();
    return data.instruktors;
  }

  // 2. Wypełnienie <select> instruktorów
  function populateInstructors(instructors) {
    if (!instructors || instructors.length === 0) {
      instruktorList.innerHTML =
        '<option value="">Brak dostępnych instruktorów</option>';
      return;
    }

    instruktorList.innerHTML = "";
    const currentUser = JSON.parse(localStorage.getItem("user"));

    const filtered = instructors.filter(instr => {
      if (instr.premium && !currentUser?.hasFullPremiumAccess) return false;
      return true;
    });


    filtered.forEach((instr) => {
      const option = document.createElement("option");
      option.value = instr._id;
      option.textContent = `${instr.name} ${instr.surname}${instr.premium ? " ⭐" : ""}`;
      instruktorList.appendChild(option);
    });

    if (filtered.length > 0) {
      instruktorList.value = filtered[0]._id;
    }
  }


  // 3. Pobranie harmonogramu tygodnia dla danego instruktora i daty
  async function getWeeklySchedule(instructorId, selectedDate) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Nie jesteś zalogowany!");
        return null;
      }
      // Ustalenie poniedziałku dla wybranego tygodnia
      const dateObj = new Date(selectedDate);
      const dayOfWeek = dateObj.getDay() || 7;
      const startOfWeek = new Date(dateObj);
      startOfWeek.setDate(dateObj.getDate() - (dayOfWeek - 1));
      const weekStartStr = startOfWeek.toISOString().split("T")[0];

      const response = await fetch(
        `http://localhost:5000/api/schedules/?instructorId=${instructorId}&date=${weekStartStr}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Błąd połączenia lub autoryzacji");
      return await response.json();
    } catch (error) {
      console.error("Błąd pobierania rekordów:", error.message);
      alert("Nie udało się załadować rekordów instruktora.");
      return null;
    }
  }

  // 4. Aktualizacja tabeli harmonogramu na podstawie danych (wyczyszczenie + oznaczenie zajętych slotów)
  function updateScheduleTable(schedules) {
    const rows = scheduleTable.querySelectorAll("tbody tr");
    // Wyczyść tabelę (usuń kolory, atrybuty i treść poza kolumną z godziną)
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      cells.forEach((cell, idx) => {
        if (idx > 0) {
          cell.style.backgroundColor = "";
          cell.removeAttribute("data-occupied");
          cell.textContent = "";
          cell.classList.remove("clickable");
        }
      });
    });
    // Zaznacz zajęte sloty według pobranych danych
    (schedules || []).forEach((entry) => {
      const entryDate = new Date(entry.date);
      const startTime = entry.startTime;
      const dayIndex = entryDate.getDay() || 7; // Niedziela = 7
      rows.forEach((row) => {
        const timeLabel = row.querySelector("td").textContent.trim();
        if (timeLabel === startTime) {
          const targetCell = row.querySelector(`td:nth-child(${dayIndex + 1})`);
          if (targetCell) {
            // Устранение цвета на основе типа
            let color;
            let typeLabel = ""; // 🟢 добавляем переменную для отображения текста типа
            switch (entry.type) {
              case "praktyka":
                color = "green";
                typeLabel = "Zajęcie Praktyczne";
                break;
              case "wyklad":
                color = "grey";
                typeLabel = "Zajęcie Teoretyczne";
                break;
              case "egzamin_t":
                color = "yellow";
                typeLabel = "Egzamin Teoretyczny";
                break;
              case "egzamin_p":
                color = "blue";
                typeLabel = "Egzamin Praktyczny";
                break;
              case "latwo":
                color = "lightgreen";
                break;
              default:
                color = "violet";
                typeLabel = entry.type; // fallback — просто покажем тип как есть
            }

            // Если занят другим студентом
            if (entry.student && entry.student._id) {
              const currentUserId = localStorage.getItem("userId");
              if (String(entry.student._id) !== String(currentUserId)) {
                color = "red";
                typeLabel = "Zajęte";
              }
            }
            if (entry.status === "cancelled") {
              color = "black";
              typeLabel = "Odwołane";
            }

            targetCell.style.backgroundColor = color;
            targetCell.setAttribute("data-occupied", "true");
            if (color === "black") {
              targetCell.innerHTML = `<strong style="color:white;">${typeLabel}</strong>`;

            } else {
              targetCell.innerHTML = `<strong>${typeLabel}</strong>`;
            }



          }
        }
      });
    });
    // Dodaj klasę .clickable do wszystkich wolnych (niezajętych) komórek
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      cells.forEach((cell, idx) => {
        if (idx > 0 && !cell.hasAttribute("data-occupied")) {
          cell.classList.add("clickable");
        }
      });
    });
  }

  // 5. Aktualizacja etykiety zakresu tygodnia (poniedziałek - niedziela)
  function updateWeekLabel() {
    const start = new Date(currentStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmtOpts = { day: "2-digit", month: "2-digit" };
    currentWeekLabel.textContent = `${start.toLocaleDateString(
      "pl-PL",
      fmtOpts
    )} - ${end.toLocaleDateString("pl-PL", fmtOpts)}`;
  }

  // 6. Aktualizacja dat w nagłówkach dni oraz atrybutów data-date komórek na dany tydzień
  function updateWeekDates(startDate) {
    console.log("✅ updateWeekDates вызвана с датą:", startDate);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const headers = days.map((d) => document.getElementById(d));
    const baseDate = new Date(startDate);
    // Usuń poprzednie podświetlenia "dzisiaj"
    headers.forEach((header) => header?.classList.remove("today"));
    document
      .querySelectorAll(".today-col")
      .forEach((cell) => cell.classList.remove("today-col"));
    // Ustaw daty w nagłówkach dni
    headers.forEach((header, i) => {
      if (header) {
        const date = new Date(baseDate);
        const dayOfWeek = baseDate.getDay() || 7;
        date.setDate(baseDate.getDate() - (dayOfWeek - 1) + i);
        const labelSpan = header.querySelector(".day-date");
        if (labelSpan) {
          labelSpan.textContent = date.toLocaleDateString("pl-PL", {
            day: "2-digit",
            month: "2-digit",
          });
        }
        // Podświetl dzisiejszy dzień (jeśli dotyczy bieżącego tygodnia)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        if (today.getTime() === date.getTime()) {
          header.classList.add("today");
          const colIndex = i + 2; // indeks kolumny w tabeli (1. kolumna to godziny)
          scheduleTable
            .querySelectorAll(`tbody tr td:nth-child(${colIndex})`)
            .forEach((cell) => cell.classList.add("today-col"));
        }
      }
    });
    // Ustaw atrybut data-date dla każdej komórki (dzień+godzina)
    const rows = scheduleTable.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const timeText = row.querySelector("td").textContent.trim(); // godzina z pierwszej kolumny
      const cells = row.querySelectorAll("td");
      cells.forEach((cell, idx) => {
        if (idx > 0) {
          const cellDate = new Date(startDate);
          const baseDayOfWeek = cellDate.getDay() || 7;
          const offset = idx - 1 - (baseDayOfWeek - 1);
          cellDate.setDate(cellDate.getDate() + offset);
          const dateStr = cellDate.toISOString().split("T")[0];
          cell.setAttribute("data-date", `${dateStr}T${timeText}`);
        }
      });
    });
  }

  // 7. Pomocnicze podświetlenie elementu (np. listy instruktorów) w razie potrzeby
  function highlightElement(element) {
    element.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
    element.style.transform = "scale(1.1)";
    element.style.boxShadow = "0 0 10px red";
    setTimeout(() => {
      element.style.transform = "scale(1)";
      element.style.boxShadow = "none";
    }, 500);
  }

  // 8. Aktualizacja planu po zmianie instruktora lub daty (pobranie danych i odświeżenie tabeli)
  async function updateInstruktorOrDate() {
    if (!idSelectInstruktor || !globalSelectDate) return;
    const data = await getWeeklySchedule(idSelectInstruktor, globalSelectDate);
    if (!data) {
      // W przypadku błędu lub braku danych - wyczyść tabelę (pozostaw daty)
      updateScheduleTable([]);
    } else {
      updateScheduleTable(data);
    }
  }

  // 9. Reakcja na zmianę daty (np. przełączenie tygodnia)
  function onDateChange(newDate) {
    globalSelectDate = new Date(newDate);
    updateWeekDates(globalSelectDate);
    updateWeekLabel();
    updateInstruktorOrDate();
  }

  // 10. Funkcja pomocnicza: obliczenie godziny końcowej (start + 1h)
  function getEndTime(startTime) {
    const [hour, minute] = startTime.split(":").map(Number);
    return `${hour + 1}:${minute.toString().padStart(2, "0")}`;
  }

  // 11. Obsługa dodawania notatki (tworzenie nowego wpisu typu "praktyka" z notatką)
  //nowaja zalupa
  async function addNote() {
    const text = newNoteInput.value.trim();
    const selectValue = document.getElementById("lesson-select").value;

    if (!selectValue) {
      alert("Wybierz zajęcia z listy!");
      return;
    }

    const [dateVal, timeVal] = selectValue.split("||");

    if (!text) {
      alert("Wprowadź treść notatki.");
      return;
    }
    if (!idSelectInstruktor) {
      alert("Wybierz najpierw instruktora.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const resp = await fetch("http://localhost:5000/api/schedules/setNotes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instructor: idSelectInstruktor,
          date: dateVal,
          startTime: timeVal,
          studentNotes: text,
        }),
      });

      if (resp.ok) {
        alert("Notatka została zapisana.");
        // Очистка и обновление расписания
        newNoteInput.value = "";
        document.getElementById("lesson-select").value = "";
        updateInstruktorOrDate();
      } else {
        const err = await resp.json();
        alert(`Błąd: ${err.message}`);
      }
    } catch (err) {
      console.error("Błąd przy zapisie notatki:", err);
      alert("Wystąpił błąd podczas zapisu notatki.");
    }
  }

  // 12. Ustawienie obsługi zdarzeń
  instruktorList.addEventListener("change", () => {
    idSelectInstruktor = instruktorList.value;
    updateInstruktorOrDate();
  });
  prevWeekBtn.addEventListener("click", () => {
    currentStartDate.setDate(currentStartDate.getDate() - 7);
    onDateChange(currentStartDate);
  });
  nextWeekBtn.addEventListener("click", () => {
    currentStartDate.setDate(currentStartDate.getDate() + 7);
    onDateChange(currentStartDate);
  });
  scheduleTable.addEventListener("click", async (event) => {
    const cell = event.target.closest("td");
    if (!cell || !cell.hasAttribute("data-date")) return;

    if (!idSelectInstruktor) {
      highlightElement(instruktorList);
      return;
    }

    const cellDateStr = cell.getAttribute("data-date");
    const selectedDate = new Date(cellDateStr);
    if (isNaN(selectedDate)) {
      alert("Wybrana nieprawidłowa data!");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    const diff = selectedDate - today;
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;

    if (diff < 0) {
      alert("Data nie może być w przeszłości!");
      return;
    }

    if (diff > twoWeeks) {
      alert("Data musi być w zakresie dwóch tygodni od dzisiaj!");
      return;
    }

    const color = cell.style.backgroundColor;

    if (color === "black" || color === "red") {
      // Odwołane lub zajęte przez innego — brak interakcji
      return;
    }

    // Блокируем отмену менее чем за день до занятия
    if (color === "green" && diff < 24 * 60 * 60 * 1000) {
      alert("Nie można anulować zajęć na mniej niż jeden dzień przed!");
      return;
    }

    selectedCell = cell;

    const [datePart, timePart] = cellDateStr.split("T");
    const startTime = timePart.slice(0, 5);
    document.getElementById("bookingInfo").textContent = `${datePart} ${startTime}`;

    bookingModal.classList.remove("hidden");
  });


  addNoteBtn.addEventListener("click", addNote);

  //ЙООООУ
  const bookingModal = document.getElementById("bookingModal");
  const confirmBookingBtn = document.getElementById("confirmBooking");
  const cancelBookingBtn = document.getElementById("cancelBooking");
  const closeBookingModalBtn = document.getElementById("closeBookingModal");
  const bookingTypeSelect = document.getElementById("bookingType");

  // Сохраняем тип занятия при выборе
  bookingTypeSelect.addEventListener("change", () => {
    lessonType = bookingTypeSelect.value;
  });

  // Кнопка "Zarezerwuj"
  confirmBookingBtn.addEventListener("click", async () => {
    if (!selectedCell || !idSelectInstruktor) return;

    const dateStr = selectedCell.getAttribute("data-date");
    const [datePart, timePart] = dateStr.split("T");
    const startTime = timePart.slice(0, 5);
    const endTime = getEndTime(startTime);

    try {
      const token = localStorage.getItem("token");
      const resp = await fetch("http://localhost:5000/api/schedules/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instructor: idSelectInstruktor,
          date: datePart,
          startTime: startTime,
          endTime: endTime,
          type: lessonType,
        }),
      });

      if (resp.ok) {
        alert("Rezerwacja dodana!");
        bookingModal.classList.add("hidden");
        updateInstruktorOrDate();
      } else {
        const err = await resp.json();
        alert(`Błąd: ${err.message}`);
      }
    } catch (err) {
      console.error("Błąd przy rezerwacji:", err);
      alert("Nie udało się utworzyć rezerwacji.");
    }
  });

  // Кнопки "Anuluj" и "X"
  cancelBookingBtn.addEventListener("click", async () => {
    if (!selectedCell || !idSelectInstruktor) {
      bookingModal.classList.add("hidden");
      selectedCell = null;
      return;
    }

    const dateStr = selectedCell.getAttribute("data-date");
    const [datePart, timePart] = dateStr.split("T");
    const startTime = timePart.slice(0, 5);

    try {
      const token = localStorage.getItem("token");
      const resp = await fetch("http://localhost:5000/api/schedules/", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instructor: idSelectInstruktor,
          date: datePart,
          startTime: startTime,
          isStudent: true,
        }),
      });

      if (resp.ok) {
        alert("Rekord został pomyślnie usunięty!");
        updateInstruktorOrDate();
      } else {
        const err = await resp.json();
        alert(`Błąd: ${err.message}`);
      }
    } catch (err) {
      console.error("Błąd przy usuwaniu zajęć:", err);
      alert("Nie udało się anulować zajęć.");
    }

    bookingModal.classList.add("hidden");
    selectedCell = null;
  });


  closeBookingModalBtn.addEventListener("click", () => {
    bookingModal.classList.add("hidden");
    selectedCell = null;
  });

  //------

  // 13. Inicjalizacja harmonogramu przy starcie strony
  const instructors = await getInstructors();
  populateInstructors(instructors);
  idSelectInstruktor =
    instructors && instructors.length ? instructors[0]._id : null;
  globalSelectDate = new Date(currentStartDate);
  if (idSelectInstruktor) {
    onDateChange(currentStartDate); // załadowanie bieżącego tygodnia
  } else {
    updateWeekDates(currentStartDate);
    updateWeekLabel();
  }

  // 14. Ustawienie zakresu dat dla wyboru notatki (od dziś do dwóch tygodni naprzód)
  if (dateInput) {
    const todayStr = new Date().toISOString().split("T")[0];
    const twoWeeksDate = new Date();
    twoWeeksDate.setDate(twoWeeksDate.getDate() + 14);
    dateInput.min = todayStr;
    dateInput.max = twoWeeksDate.toISOString().split("T")[0];
  }

  // 15. Pobranie i wyświetlenie statystyk (liczba wykładów, egzaminów itp.)
  try {
    const token = localStorage.getItem("token");
    const resp = await fetch("http://localhost:5000/api/schedules/getCount", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.ok) {
      const data = await resp.json();
      selectStaticDiv.innerHTML = "";
      const stats = [
        { label: "Wykłady", count: data.lectureCount },
        { label: "Egzaminy teoretyczne", count: data.examCountT },
        { label: "Egzaminy praktyczne", count: data.examCountP },
        { label: "Jazdy praktyczne", count: data.practiceCount },
      ];
      stats.forEach((item) => {
        const div = document.createElement("div");
        Object.assign(div.style, {
          padding: "10px",
          marginBottom: "10px",
          backgroundColor: "#f4f4f4",
          border: "1px solid #ddd",
          borderRadius: "5px",
        });
        div.textContent = `${item.label}: ${item.count}`;
        selectStaticDiv.appendChild(div);
      });
    } else {
      console.error("Błąd pobierania statystyk z serwera.");
    }
  } catch (err) {
    console.error("Błąd pobierania statystyk:", err);
  }

  
});
async function loadUserLessons() {
  const token = localStorage.getItem("token");
  const resp = await fetch("http://localhost:5000/api/schedules/myLessons", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const lessons = await resp.json();
  const lessonSelect = document.getElementById("lesson-select");
  lessonSelect.innerHTML = "";

  lessons.forEach((lesson) => {
    const opt = document.createElement("option");
    opt.value = `${lesson.date}||${lesson.startTime}`;
    opt.textContent = `${lesson.date.slice(0, 10)} ${lesson.startTime} - ${lesson.instructor?.name || "Instruktor"
      }`;
    lessonSelect.appendChild(opt);
  });
}