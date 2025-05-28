document.getElementById("profileButton").addEventListener("click", function () {
  const isLoggedIn = Boolean(localStorage.getItem("token")); // Проверяем, есть ли пользователь

  if (isLoggedIn) {
    window.location.href = "../konto/kontos.html"; // Если залогинен – кидаем в профиль
  } else {
    window.location.href = "../konto_login/log.html"; // Если нет – на страницу логина
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const response = await fetch("http://localhost:5000/api/courses/", {
    method: "GET",
  });
  const courses = await response.json();
  const services = document.querySelectorAll(".service");

  services.forEach((service, index) => {
    const toggleButton = service.querySelector(".toggle-button");

    const detailsContainer = document.createElement("div");
    detailsContainer.classList.add("service-details");
    detailsContainer.style.display = "none";
    detailsContainer.style.opacity = "0";
    detailsContainer.style.transition =
      "opacity 0.3s ease, max-height 0.3s ease";
    detailsContainer.style.maxHeight = "0";
    detailsContainer.style.overflow = "hidden";

    // Общая функция генерации HTML
    const generateList = (start, end) => {
  const items = courses.slice(start, end).map((x, i, arr) => {
    const border = i < arr.length - 1
      ? `<hr style="border: none; border-top: 1px solid #ccc; margin: 10px 0;">`
      : "";
    return `
      <li id="${x._id}" style="margin-left: -20px;">
        ${x.description}&nbsp;: <span style="color: orange; cursor: pointer;">${x.price}</span>
        ${border}
      </li>
    `;
  }).join("");

  return `
    <div style="border: 3px solid orange; border-radius: 21px; margin-top: 10px; padding: 20px; background: #fff; width: 100%; max-width: 1371px; margin-bottom: 15px;">
      <ul style="list-style-type: none; padding-left: 0; font-size: 18px; font-weight: bold; color: #FF8000;">
        ${items}
      </ul>
    </div>
  `;
};


    // Выбор диапазона курсов по категории
    if (index === 0) {
      // Категория B | BE
      detailsContainer.innerHTML = generateList(0, 5);
    } else if (index === 1) {
      // Категория A | A2 | A1 | AM
      detailsContainer.innerHTML = generateList(5, 14);
    } else if (index === 2) {
      // Категория D | DE
      detailsContainer.innerHTML = generateList(14, 18);
    } else if (index === 3) {
      // Premium
      detailsContainer.innerHTML = `
        <div style="border: 3px solid orange; border-radius: 21px; margin-top: 10px; padding: 20px; background: #fff; width: 100%; max-width: 1371px; margin-bottom: 15px;">
            <p style="font-size: 18px; font-weight: normal; padding-left: 5px; ">
                Kup Premium-versje: <span id="premiumItem" style="color: orange; cursor: pointer;">2000</span>
            </p>
        </div>`;
    } else if (index === 4) {
      // Инструктор
      detailsContainer.innerHTML = generateList(18, courses.length); // все оставшиеся
    }

    service.after(detailsContainer);

    toggleButton.addEventListener("click", () => {
      const isVisible = detailsContainer.style.display === "block";

      if (isVisible) {
        detailsContainer.style.opacity = "0";
        detailsContainer.style.maxHeight = "0";
        setTimeout(() => {
          detailsContainer.style.display = "none";
        }, 300);
      } else {
        detailsContainer.style.display = "block";
        setTimeout(() => {
          detailsContainer.style.opacity = "1";
          detailsContainer.style.maxHeight =
            detailsContainer.scrollHeight + "px";
        }, 10);
      }

      // Изменение иконки стрелки
      const svgPath = toggleButton.querySelector("path");
      svgPath.setAttribute("d", isVisible ? "M9 18l6-6-6-6" : "M6 9l6 6 6-6");
    });
  });

  // Обработка кликов по пунктам курсов
  const section = document.querySelector("#section");
  section.querySelectorAll("li").forEach((item) => {
    const priceSpan = item.querySelector("span[style*='cursor: pointer']");
    if (!priceSpan) return;

    priceSpan.addEventListener("click", async (e) => {
      e.stopPropagation(); // чтобы не срабатывали другие клики

      const idCourse = item.id;
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Wymagana autoryzacja!");
        return;
      }

      const parentServiceIndex = [
        ...document.querySelectorAll(".service"),
      ].findIndex((service) => service.nextElementSibling?.contains(item));

      const isPremiumItem = parentServiceIndex === 3;

      try {
        if (isPremiumItem) {
          const res = await fetch("http://localhost:5000/api/premium/buy", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const data = await res.json();

          if (res.ok) {
            alert("Premium zostało aktywowane!");
            location.href = "../konto/kontos.html";
          } else {
            alert(`Błąd: ${data.message}`);
          }

          return;
        }

        // Обычные курсы
        const response = await fetch("http://localhost:5000/api/courses/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ courseId: idCourse }),
        });

        const data = await response.json();

        if (response.ok) {
          alert(`Zapisano na kurs: ${data.message}`);
          location.href = "../konto/kontos.html";
        } else {
          alert(`Błąd: ${data.message}`);
        }
      } catch (error) {
        console.error("Błąd:", error.message);
        alert("Wystąpił błąd. Spróbuj ponownie.");
      }
    });
  });

  const premiumItem = document.getElementById("premiumItem");
  if (premiumItem) {
    premiumItem.addEventListener("click", async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Wymagana autoryzacja!");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/premium/buy", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (res.ok) {
          alert("Premium zostało wybrane!");
          location.href = "../konto/kontos.html";
        } else {
          alert(`Błąd: ${data.message}`);
        }
      } catch (error) {
        console.error("Błąd:", error.message);
        alert("Wystąpił błąd. Spróbuj ponownie.");
      }
    });
  }
});
