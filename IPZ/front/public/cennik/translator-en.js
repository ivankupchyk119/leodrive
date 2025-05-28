(() => {
  const translations = {
    /* ——— навигация и прочее ——— */
    "STRONA GŁÓWNA": "HOME",
    "PRAWO JAZDY": "DRIVING LICENCE",
    "PREMIUM": "PREMIUM",
    "CENNIK": "PRICING",
    "PLANOWANIE JAZD": "SCHEDULE LESSONS",
    "PROFIL": "PROFILE",
    "Zapoznaj się z cennikiem naszych usług": "Check out the prices of our services",
    "Kursy, szkolenia, warsztaty, premium": "Courses, training, workshops, premium",
    "Kursy na pojazdy osobowe": "Passenger‑car courses",
    "Kursy motocyklowe": "Motorcycle courses",
    "Kursy autobusowe": "Bus courses",
    "Instruktor nauki jazdy": "Driving instructor",
    "Premium": "Premium",
    "Kategorie: B | BE": "Categories: B | BE",
    "Kategorie: A | A2 | A1 | AM": "Categories: A | A2 | A1 | AM",
    "Kategorie: D | DE": "Categories: D | DE",
    "Kategorie: B": "Category: B",
    "Kategorie: A | B | D": "Categories: A | B | D",
    "LeoDrive Nauka Jazdy": "LeoDrive Driving Lessons",
    "Adres| 00-000 Szczecin": "Address| 00-000 Szczecin",
    "Informacja czynna w godzinach 11:00 - 16:00": "Information available 11:00 – 16:00",
    "Kontakt: +48 000 000 000": "Contact: +48 000 000 000",
    "napisz do nas": "contact us",
    "Linki": "Links",
    "Napisz komentarz do instruktora": "Write a comment to the instructor",
    "Wypełnij formularz": "Fill out the form",
    "Strona Glowna": "Home Page",
    "Prawo Jazdy": "Driving Licence",
    "Planowanie jazd": "Schedule lessons",
    "Cennik": "Pricing",
    "Kontakt": "Contact",
    "Oferta": "Offer",
    "Szkolenia na samochód": "Car training",
    "Szkolenia na motocykl": "Motorcycle training",
    "Szkolenia na autobus": "Bus training",
    "Instruktorzy": "Instructors",
    "Informacje": "Information",
    "Pobierz certyfikat": "Download the certificate",
    "Regulamin": "Terms & Conditions",
    "Polityka prywatności": "Privacy policy",
    "Certyfikaty": "Certificates",
    "*Certyfikat*": "*Certificate*",
    "Deweloperzy:": "Developers:",

    // ——— переводы курсов ———
    "Kurs kategorii B w formie stacjonarnej, zawiera pełne szkolenie teoretyczne i praktyczne.": "Stationary category B course, includes full theoretical and practical training.",
    "Indywidualny kurs kategorii B z pełnym wsparciem instruktora w każdej lekcji.": "Individual category B course with full instructor support in each lesson.",
    "Kurs kategorii B bez teorii, idealny dla osób, które już mają podstawową wiedzę teoretyczną.": "Category B course without theory, ideal for those who already have basic theoretical knowledge.",
    "Standardowy kurs kategorii BE, umożliwiający prowadzenie pojazdów z przyczepą.": "Standard BE category course enabling towing vehicle operation.",
    "Indywidualny kurs kategorii BE z większym naciskiem na praktyczne umiejętności.": "Individual BE category course with stronger focus on practical skills.",
    "Indywidualny kurs kategorii A, oferujący pełne wsparcie instruktora podczas zajęć praktycznych.": "Individual category A course with full instructor support during practical lessons.",
    "Indywidualny kurs kategorii A2 z dostosowanymi lekcjami praktycznymi.": "Individual category A2 course with tailored practical lessons.",
    "Kurs kategorii A2 przeznaczony dla osób posiadających kategorię A1.": "A2 course intended for individuals with A1 license.",
    "Kurs kategorii A1 bez teorii, dla osób z podstawową wiedzą teoretyczną.": "Category A1 course without theory, for those with basic theoretical knowledge.",
    "Kurs kategorii AM bez teorii, idealny dla młodych kierowców.": "AM category course without theory, ideal for young drivers.",
    "Kurs kategorii A bez teorii, przeznaczony dla osób z podstawową wiedzą teoretyczną.": "Category A course without theory, for those with basic theoretical knowledge.",
    "Indywidualny kurs kategorii A1 z pełnym wsparciem instruktora.": "Individual category A1 course with full instructor support.",
    "Kurs kategorii A2 bez teorii, idealny dla osób z wcześniejszym doświadczeniem.": "A2 course without theory, ideal for those with prior experience.",
    "Indywidualny kurs kategorii AM z dostosowaną opieką instruktora.": "Individual AM course with tailored instructor support.",
    "Standardowy kurs kategorii D przeznaczony dla posiadaczy kategorii B.": "Standard D category course for B license holders.",
    "Łączony kurs kategorii D, obejmujący kompleksowe szkolenie teoretyczne i praktyczne.": "Combined D course with comprehensive theory and practice.",
    "Kurs kategorii D dla osób posiadających prawo jazdy kategorii B, bez części teoretycznej.": "D course for B license holders, without theoretical part.",
    "Indywidualny kurs kategorii D dla osób z prawem jazdy kategorii B, z pełnym wsparciem instruktora.": "Individual D course for B license holders, with full instructor support.",
    "Kup Premium-versje:": "Buy Premium-version:",
    "Kurs stacjonarny dla przyszłych instruktorów kategorii B.": "Stationary course for future category B instructors.",
    "Kurs stacjonarny dla przyszłych instruktorów kategorii D.": "Stationary course for future category D instructors.",
    "Kurs online dla przyszłych instruktorów kategorii A.": "Online course for future category A instructors.",
    "Kurs online dla przyszłych instruktorów kategorii B.": "Online course for future category B instructors.",
    "Kurs online dla przyszłych instruktorów kategorii D.": "Online course for future category D instructors.",
    "Kurs stacjonarny dla przyszłych instruktorów kategorii A.": "Stationary course for future category A instructors.",
  };

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      let original = node.textContent;
      for (const [pl, en] of Object.entries(translations)) {
        const cleanOriginal = original.normalize("NFKC");
        const cleanKey = pl.normalize("NFKC");
        if (cleanOriginal.includes(cleanKey)) {
          original = original.replace(pl, en);
        }
      }
      node.textContent = original;
    } else node.childNodes.forEach(translateNode);
  }
  

  function translateElement(element) {
    translateNode(element);
  }

  function translatePage() {
    translateElement(document.body);
  }

  let lang = "pl";
  function toggle() {
    lang = lang === "pl" ? "en" : "pl";
    if (lang === "en") {
      translatePage();
      document.documentElement.lang = "en";
      btn.textContent = "PL";
    } else location.reload();
  }

  const btn = Object.assign(document.createElement("button"), {
    id: "langSwitch",
    textContent: "EN",
    onclick: toggle,
  });
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
    zIndex: 9999,
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(btn);
  });

  // Перевод новых элементов при их появлении
  const observer = new MutationObserver(mutations => {
    if (lang !== "en") return; // ⛔ НЕ переводить, если язык ещё польский
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          translateElement(node);
        }
      });
    }
  });
  

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
