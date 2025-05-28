/* ───────── translator‑en.js ─────────────────────────────────────────
 * Подключайте перед </body> на любой странице:
 *    <script src="translator-en.js"></script>
 * При первой загрузке страница остаётся польской.
 * Нажали кнопку EN — мгновенный перевод; повторное нажатие — возврат PL.
 * ------------------------------------------------------------------- */
(() => {
    /* ---------- словарь ------------------------------------------------ */
    const translations = {
      /* ═══ навигация (общая) ════════════════════════════════════════════ */
      "STRONA GŁÓWNA": "HOME",
      "PRAWO JAZDY":   "DRIVING LICENCE",
      "PREMIUM":       "PREMIUM",
      "CENNIK":        "PRICING",
      "PLANOWANIE JAZD":"SCHEDULE LESSONS",
      "PROFIL":        "PROFILE",
  
      /* ═══ блок «Категория?» и герой‑текст (PrawoJazdy) ════════════════ */
      "Jaka kategoria Cię interesuje?":
            "Which category are you interested in?",
      "W LeoDrive skupiamy się na szczegółach. Nauczymy Cię bezpiecznej i bezstresowej jazdy w każdych warunkach.":
            "At LeoDrive we focus on the details. We will teach you safe and stress‑free driving in all conditions.",
  
      /* ═══ карточки категорий (обе страницы) ═══════════════════════════ */
      "Kursy na pojazdy osobowe": "Passenger‑car courses",
      "Kursy motocyklowe":        "Motorcycle courses",
      "Kursy autobusowe":         "Bus courses",
      "Instruktor nauki jazdy":   "Driving instructor",
      "Premium":                  "Premium",
      "B | BE":                   "B | BE",
      "A | A2 | A1 | AM":         "A | A2 | A1 | AM",
      "D | DE":                   "D | DE",
      "B":                        "B",
      "A | B | D":                "A | B | D",
  
      /* ═══ «Sprawdź pełną ofertę kursów» блок ══════════════════════════ */
      "Sprawdź pełną ofertę kursów": 
            "See the full list of courses",
      "Trzymamy się ściśle wypracowanych standardów. Dostosowujemy naszą ofertę do Twoich potrzeb!":
            "We strictly follow established standards and adapt our offer to your needs!",
  
      /* ═══ списки курсов (PrawoJazdy) ══════════════════════════════════ */
      /* kat. B / BE */
      "Kurs kat. B - bez teorii":      "Category B course – no theory",
      "Kurs kat. B - stacjonarny":     "Category B course – classroom",
      "Kurs kat. B - learningowy":     "Category B course – e‑learning",
      "Kurs kat. B - indywidualny":    "Category B course – individual",
      "Kurs kat. B - dofinansowanie":  "Category B course – subsidised",
      "Kurs kat. BE - standardowy":    "Category BE course – standard",
      "Kurs kat. BE - indywidualny":   "Category BE course – individual",
      "Kurs kat. BE - dofinansowanie": "Category BE course – subsidised",
  
      /* kat. A / A2 */
      "Kurs kat. A - bez teorii":      "Category A course – no theory",
      "Kurs kat. A - learningowy":     "Category A course – e‑learning",
      "Kurs kat. A - indywidualny":    "Category A course – individual",
      "Kurs kat. A - dofinansowanie":  "Category A course – subsidised",
      "Kurs kat. A po A2":             "Category A course – after A2",
  
      "Kurs kat. A2 - bez teorii":     "Category A2 course – no theory",
      "Kurs kat. A2 - learningowy":    "Category A2 course – e‑learning",
      "Kurs kat. A2 - indywidualny":   "Category A2 course – individual",
      "Kurs kat. A2 po A1":            "Category A2 course – after A1",
  
      /* kat. D */
      "Kurs kat. D po B - bez teorii":     "Category D after B course – no theory",
      "Kurs kat. D po B - standardowy":    "Category D after B course – standard",
      "Kurs kat. D po B - indywidualny":   "Category D after B course – individual",
      "Kurs kat. D po B - dofinansowanie": "Category D after B course – subsidised",
      "Kurs łączony D":                    "Combined category D course",
  
      /* другие мелкие подписи */
      "Kategorie: B | BE":  "Categories: B | BE",
      "Kategorie: A | A2 | A1 | AM": "Categories: A | A2 | A1 | AM",
      "Kategorie: D | DE":  "Categories: D | DE",
      "Kategorie: B":       "Category: B",
      "Kategorie: A | B | D": "Categories: A | B | D",

      /* ——— футер ——— */
      "LeoDrive Nauka Jazdy": "LeoDrive Driving Lessons",
      "Adres| 00-000 Szczecin":                "Adress| 00-000 Szczecin",
  "Informacja czynna w godzinach 11:00 - 16:00":
                          "Information available 11:00 – 16:00",
  "Kontakt: +48 000 000 000":              "Contact: +48 000 000 000",
  "napisz do nas": "contact us",

  // колонка “Links”
  "Linki": "Links",
  "Napisz komentarz do instruktora": "Write a comment to the instructor",
  "Wypełnij formularz":   "Fill out the form",

  // колонка “Menu” (добавляем, если ещё не было)
  "Strona Glowna": "Home Page",
  "Prawo Jazdy":           "Driving Licence",
  "Planowanie jazd":       "Schedule lessons",
  "Cennik":                "Pricing",
  "Kontakt":              "Contact",

  // колонка “Offer”
  "Oferta":           "Offer",
  "Szkolenia na samochód":"Car training",
  "Szkolenia na motocykl":"Motorcycle training",
  "Szkolenia na autobus": "Bus training",
  "Instruktorzy":         "Instructors",

  // колонка “Information”
  "Informacje":           "Information",
  "Pobierz certyfikat":"Download the certificate",
  "Regulamin":            "Terms & Conditions",
  "Polityka prywatności": "Privacy policy",

  // колонка “Certificates”
  "Certyfikaty":           "Certificates",
  "*Certyfikat*":           "*Certificate*",
  "Deweloperzy:":           "Developers:"
    };
  
    /* ---------- функция перевода --------------------------------------- */
    function translateNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const raw = node.textContent;
        const trimmed = raw.trim();
        if (!trimmed) return;
  
        // точное совпадение
        if (translations[trimmed]) {
          node.textContent = raw.replace(trimmed, translations[trimmed]);
          return;
        }
  
        // пробуем убрать завершающие ':' или '|'
        const core = trimmed.replace(/[|:]+$/, "");
        const suffix = trimmed.slice(core.length);
        if (translations[core]) {
          node.textContent = raw.replace(core + suffix, translations[core] + suffix);
        }
      } else {
        node.childNodes.forEach(translateNode);
      }
    }
  
    /* ---------- переключатель языков ----------------------------------- */
    let lang = "pl";
    function toggleLang() {
      lang = lang === "pl" ? "en" : "pl";
      if (lang === "en") {
        translateNode(document.body);
        document.documentElement.lang = "en";
        btn.textContent = "PL";
      } else {
        location.reload();
      }
    }
  
    /* ---------- создаём кнопку ----------------------------------------- */
    const btn = document.createElement("button");
    btn.id = "langSwitch";
    btn.textContent = "EN";
    btn.onclick = toggleLang;
    Object.assign(btn.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      padding: "10px 14px",
      font: "700 14px/1 Onest, sans-serif",
      background: "#ff7c16",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      zIndex: 9999
    });
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(btn));
  })();
  