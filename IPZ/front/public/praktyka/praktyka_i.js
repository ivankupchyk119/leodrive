document.addEventListener('DOMContentLoaded', async () => {
    let globalSelectDate = null;
    let selectUser = null;
    let selectedCell = null;

    let currentStartDate = new Date();
    const prevWeekBtn = document.getElementById("prevWeekBtn");
    const nextWeekBtn = document.getElementById("nextWeekBtn");
    const currentWeekLabel = document.getElementById("currentWeekLabel");

    async function getWeeklySchedule(selectedDate) {
        try {
            const token = localStorage.getItem('token'); // Отримуємо токен із localStorage

            if (!token) {
                alert('Nie masz uprawnień!');
                return null;
            }

            // Обчислення початку тижня (понеділок)
            const date = new Date(selectedDate);
            const dayOfWeek = date.getDay() || 7; // Неділя = 7
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - (dayOfWeek - 1));
            const formattedStartOfWeek = startOfWeek.toISOString().split('T')[0]; // Формат YYYY-MM-DD

            // Формуємо запит до API
            const response = await fetch(`http://localhost:5000/api/schedules/?date=${formattedStartOfWeek}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Передаємо токен у заголовку
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Błąd połączenia z serwerem lub błąd autoryzacji');
            }

            // Парсимо дані з відповіді
            const data = await response.json();
            return data; // Повертаємо записи
        } catch (error) {
            console.error('Błąd pobierania rekordów:', error.message);
            alert('Nie udało się załadować rekordów');
            return null;
        }
    }



    const table = document.querySelector("#schedule");
    const listDays = document.querySelector("#list-days");

    const highlightElement = (element) => {
        element.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
        element.style.transform = "scale(1.2)";
        element.style.boxShadow = "0 0 10px red";

        setTimeout(() => {
            element.style.transform = "scale(1)";
            element.style.boxShadow = "none";
        }, 500);
    };



    const updateInstruktorOrDate = async () => {
        if (!globalSelectDate) return;
        let weeklySchedule = await getWeeklySchedule(globalSelectDate);

        // Фильтрация по студенту, если выбран
        if (selectUser) {
            weeklySchedule = weeklySchedule.filter(s => s.student && s.student._id === selectUser);
        }

        updateScheduleTable(weeklySchedule, globalSelectDate);
    };

    const modal = document.getElementById("instruktorModal");
    const bookingInfo = document.getElementById("bookingInfo");
    const closeInstruktorModal = document.getElementById("closeInstruktorModal");

    closeInstruktorModal.addEventListener("click", () => {
        modal.classList.add("hidden");
        selectedCell = null;
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
            modal.classList.add("hidden");
            selectedCell = null;
        }
    });
    document.getElementById("instruktorConfirm").addEventListener("click", async () => {
        if (!selectedCell || !selectUser) {
            alert("Wybierz studenta i slot!");
            return;
        }

        const dateStr = selectedCell.getAttribute("data-date");
        const [date, time] = dateStr.split("T");
        const startTime = time.slice(0, 5);
        const endTime = `${parseInt(startTime.split(":")[0]) + 1}:00`;
        const type = document.getElementById("lessonType").value;

        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:5000/api/schedules/", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                student: selectUser,
                type,
                date,
                startTime,
                endTime,
                isInstruktorSet: true
            }),
        });

        if (response.ok) {
            alert("Zajęcia dodane!");
            updateInstruktorOrDate();
        } else {
            const err = await response.json();
            alert(`Błąd: ${err.message}`);
        }

        modal.classList.add("hidden");
        selectedCell = null;
    });

    document.getElementById("instruktorDelete").addEventListener("click", async () => {
        if (!selectedCell) return;
        const dateStr = selectedCell.getAttribute("data-date");
        const [date, time] = dateStr.split("T");
        const startTime = time.slice(0, 5);

        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:5000/api/schedules/instruktorDel", {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "usun",
                date,
                startTime,
            }),
        });

        if (response.ok) {
            alert("Zajęcia usunięte");
            updateInstruktorOrDate();
        } else {
            const err = await response.json();
            alert(`Błąd: ${err.message}`);
        }

        modal.classList.add("hidden");
        selectedCell = null;
    });

    document.getElementById("instruktorOcena").addEventListener("click", async () => {
        const ocena = prompt("Podaj ocenę 1–6");
        if (!ocena || isNaN(ocena) || ocena < 1 || ocena > 6) {
            alert("Niepoprawna ocena");
            return;
        }

        const dateStr = selectedCell.getAttribute("data-date");
        const [date, time] = dateStr.split("T");
        const startTime = time.slice(0, 5);

        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:5000/api/schedules/setassessment", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                assessment: ocena,
                date,
                startTime,
            }),
        });

        if (response.ok) {
            alert("Ocena dodana");
            updateInstruktorOrDate();
        } else {
            const err = await response.json();
            alert(`Błąd: ${err.message}`);
        }

        modal.classList.add("hidden");
        selectedCell = null;
    });


    table.addEventListener("click", async (event) => {
        const cell = event.target.closest("td");
        if (!cell || !cell.hasAttribute("data-date")) return;

        const dateStr = cell.getAttribute("data-date");
        const [date, time] = dateStr.split("T");
        const startTime = time.slice(0, 5);

        selectedCell = cell;
        bookingInfo.textContent = `${date} ${startTime}`;

        modal.classList.remove("hidden");
    });


    function updateScheduleTable(schedules, selectedDate) {
        const table = document.querySelector("#schedule");
        // Спочатку очищуємо таблицю
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row) => {
            const cells = row.querySelectorAll("td");
            cells.forEach((cell, index) => {
                if (index > 0) { // Пропускаємо перший стовпець із часом
                    cell.style.backgroundColor = ''; // Скидаємо стилі
                    cell.removeAttribute('data-occupied'); // Скидаємо зайнятість
                    cell.textContent = '';
                    cell.innerHTML = '';
                }
            });
        });

        // Перебираємо всі записи та відображаємо зайняті поля
        schedules.forEach((schedule) => {
            const scheduleTypeNames = {
                praktyka: "Zajęcia praktyczne",
                wyklad: "Zajęcia teoretycznу",
                egzamin_t: "Egzamin teoretyczny",
                egzamin_p: "Egzamin praktyczny",
                latwo: "Preferowany czas"
            };

            const scheduleDate = new Date(schedule.date).toISOString().split('T')[0];
            const startTime = schedule.startTime;

            rows.forEach((row) => {
                const timeCell = row.querySelector("td").textContent.trim();
                if (timeCell === startTime) {
                    const dayIndex = new Date(schedule.date).getDay() || 7; // Неділя = 7
                    const targetCell = row.querySelector(`td:nth-child(${dayIndex + 1})`);



                    if (targetCell) {

                        let color;
                        if (schedule.type === 'praktyka') {
                            color = 'green';
                        } else if (schedule.type === 'wyklad') {
                            color = 'grey';
                        } else if (schedule.type === 'egzamin_t') {
                            color = 'yellow';
                        } else if (schedule.type === 'egzamin_p') {
                            color = 'blue';
                        } else if (schedule.type === 'latwo') {
                            color = 'lightgreen';
                        } else {
                            color = 'violet'; // Для інших типів занять
                        }
                        targetCell.style.backgroundColor = color; // Користувач записаний
                        if (schedule.type !== 'latwo') {
                            const displayName = scheduleTypeNames[schedule.type] || schedule.type;
                            targetCell.innerHTML = `<div><strong>${displayName}</strong></div><div>${schedule.student.name} ${schedule.student.surname}</div>`;
                        }

                        targetCell.setAttribute('data-occupied', 'true');
                        if (schedule.status == 'cancelled') {
                            targetCell.style.backgroundColor = 'black'
                            //targetCell.textContent='очікує підтвердження'
                            targetCell.style.color = '#ffffff'
                            //targetCell.style.padding=0;
                        }
                        if (schedule.type == 'praktyka' || schedule.type == 'wyklad' || schedule.type == 'egzamin_t' || schedule.type == 'egzamin_p') {
                            if (schedule.assessment !== undefined && schedule.assessment !== null) {
                                targetCell.innerHTML += '</br>Ocena: ' + schedule.assessment;
                            }
                        }
                    }
                }
            });

        });
    }

    // Функція для отримання користувачів і заповнення select
    async function getUsers() {
        const token = localStorage.getItem('token'); // Отримуємо токен із localStorage
        try {
            const response = await fetch('http://localhost:5000/api/users', { // Запит на отримання всіх користувачів
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Błąd pobierania użytkowników');
            }

            const users = await response.json();
            const filterUsers = users.filter(x => x.role === 'student'); // Фільтрація користувачів за роллю 'student'
            const selectElement = document.querySelector("#users"); // Отримуємо елемент select

            // Очищаємо select перед додаванням нових варіантів
            selectElement.innerHTML = '';

            // Додаємо порожній варіант для початкового вибору

            const defaultOptionAll = document.createElement("option");
            defaultOptionAll.value = ""; // Оставим value пустым — это будет означать "все"
            defaultOptionAll.textContent = "Wszyscy studenci";
            selectElement.appendChild(defaultOptionAll);

            // Додаємо варіанти для кожного студента
            filterUsers.forEach(user => {
                const option = document.createElement("option");
                option.value = user._id;
                option.textContent = `${user.name} ${user.surname}`; // Можна додати інші дані, наприклад, email
                selectElement.appendChild(option);
            });


            // Обробник зміни вибору
            selectElement.addEventListener("change", async (event) => {
                const selectedUserId = event.target.value; // Отримуємо ID вибраного користувача
                if (selectedUserId) {
                    selectUser = selectedUserId;
                    console.log(`Wybrany student: ${selectedUserId}`);
                } else {
                    selectUser = null; // null если выбрано "все" или ничего
                    console.log("Student nie został wybrany");
                }

                await updateInstruktorOrDate(); // <-- Вызов асинхронной функции
            });


        } catch (error) {
            console.error('Błąd pobierania użytkowników:', error.message);
            return null;
        }
    }

    // Викликаємо функцію для заповнення select
    getUsers();



    document.getElementById('set-availability').addEventListener('click', async () => {
        const dateInput = document.getElementById('available-date').value;
        const fromTime = document.getElementById('available-from').value;
        const toTime = document.getElementById('available-to').value;

        if (!dateInput || !fromTime || !toTime) {
            alert('Wypełnij wszystkie pola!');
            return;
        }

        const token = localStorage.getItem('token');
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const instructorId = decodedToken.userId;

        const fromHour = parseInt(fromTime.split(':')[0], 10);
        const toHour = parseInt(toTime.split(':')[0], 10);

        for (let hour = fromHour; hour < toHour; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

            try {
                const response = await fetch('http://localhost:5000/api/schedules/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        instructor: instructorId,
                        type: 'latwo',
                        date: dateInput,
                        startTime: startTime,
                        endTime: endTime
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    alert(`Błąd przy ${startTime}: ${err.message}`);
                }
            } catch (err) {
                console.error(err);
                alert(`Błąd sieci при ${startTime}`);
            }
        }

        alert('Dostępność została ustawiona!');
        await updateInstruktorOrDate();
    });


    function updateWeekLabel() {
        const endDate = new Date(currentStartDate);
        endDate.setDate(currentStartDate.getDate() + 6);
        const options = { day: '2-digit', month: '2-digit' };
        currentWeekLabel.textContent = `${currentStartDate.toLocaleDateString('pl-PL', options)} - ${endDate.toLocaleDateString('pl-PL', options)}`;
    }
    function onDateChange(date) {
        updateWeekDates(date);
        updateWeekLabel();
        globalSelectDate = date;
        updateInstruktorOrDate();
    }

    prevWeekBtn.addEventListener("click", () => {
        currentStartDate.setDate(currentStartDate.getDate() - 7);
        onDateChange(currentStartDate);

    });

    nextWeekBtn.addEventListener("click", () => {
        currentStartDate.setDate(currentStartDate.getDate() + 7);
        onDateChange(currentStartDate);
    });

    onDateChange(currentStartDate);

});

function updateWeekDates(startDate) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const headers = days.map(day => document.getElementById(day));
    const currentDate = new Date(startDate);

    // Сброс предыдущих классов
    headers.forEach(header => header?.classList.remove('today'));
    document.querySelectorAll('.today-col').forEach(el => el.classList.remove('today-col'));

    headers.forEach((header, i) => {
        if (header) {
            const date = new Date(currentDate);
            const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
            date.setDate(currentDate.getDate() - dayOfWeek + 1 + i);

            const label = header.querySelector('.day-date');
            if (label) {
                label.textContent = date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
            }

            // Подсветка текущего дня
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            if (today.getTime() === date.getTime()) {
                header.classList.add('today');
                const rows = document.querySelectorAll('#schedule tbody tr');
                rows.forEach(row => {
                    const cell = row.querySelector(`td:nth-child(${i + 2})`);
                    if (cell && !cell.hasAttribute('data-occupied')) {
                        cell.classList.add('today-col');
                    }
                });
            }
        }
    });

    // ✅ Добавление атрибута data-date и .clickable к ячейкам
    const rows = document.querySelectorAll('#schedule tbody tr');
    rows.forEach((row) => {
        const time = row.querySelector('td').textContent.trim();
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
            if (index > 0) {
                const cellDate = new Date(startDate);
                const dayIndex = index - 1;
                const dayOfWeek = cellDate.getDay() || 7;
                const offset = dayIndex - (dayOfWeek - 1);
                cellDate.setDate(cellDate.getDate() + offset);
                const fullDate = `${cellDate.toISOString().split('T')[0]}T${time}`;
                cell.setAttribute('data-date', fullDate);

                // Установка класса clickable
                if (cell.innerHTML.trim() === '') {
                    cell.classList.add('clickable');
                } else {
                    cell.classList.remove('clickable');
                }
            }
        });
    });
}
