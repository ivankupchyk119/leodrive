/* ───── 1. подгружаем Roboto один раз ───── */
let robotoOK = false;
async function loadRoboto() {
  if (robotoOK) return true;
  try {
    const url =
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.72/fonts/Roboto-Regular.ttf";
    const buf = await (await fetch(url)).arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    const api = window.jspdf.jsPDF.API;
    api.addFileToVFS("Roboto-Regular.ttf", b64);
    api.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    robotoOK = true;
    return true;
  } catch {
    console.warn("Roboto unavailable – falling back to Helvetica");
    return false;
  }
}

/* ───── 2. строим сертификат ───── */
document.getElementById("downloadCert").addEventListener("click", async () => {
  const gotFont = await loadRoboto();
  const jsPDF = window.jspdf?.jsPDF;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  pdf.setFont(gotFont ? "Roboto" : "Helvetica", "normal");

  /* рамка */
  pdf.setDrawColor(0).setLineWidth(0.4).rect(15, 15, 267, 167, "S");

  /* ========= заголовок ========= */
  const title = "CERTIFICATE OF COMPLETION";
  let fSize = 28; // начальный размер
  const maxW = 240; // макс. ширина текста в мм
  pdf.setFont(undefined, "bold");
  while (fSize > 14 && pdf.getTextWidth(title) > maxW) {
    fSize--;
    pdf.setFontSize(fSize);
  }
  pdf.text(title, 148, 40, { align: "center" });

  /* ========= основной текст ========= */
  pdf.setFontSize(15).setFont(undefined, "normal");
  pdf.text("This is to certify that", 148, 68, { align: "center" });

  const nameInput = prompt("Student full name:", "John Doe");
  if (nameInput === null) {
    return; // пользователь нажал "Отмена", выходим из обработчика
  }
  const name = nameInput.trim() || "________________________";

  pdf
    .setFontSize(22)
    .setFont(undefined, "bold")
    .text(name, 148, 84, { align: "center" });

  pdf.setFontSize(15).setFont(undefined, "normal");
  pdf.text("has successfully completed the", 148, 104, {
    align: "center",
  });
  pdf.text("DRIVING COURSE at our LEODRIVE", 148, 114, {
    align: "center",
  });

  /* ========= подпись и дата ========= */
  pdf.setFontSize(13);
  pdf.text("____________________________", 55, 160, {
    align: "center",
  });
  pdf.text("Instructor's Signature", 55, 168, { align: "center" });

  const today = new Date().toLocaleDateString("en-GB");
  pdf.setFontSize(12).text(`Issued on: ${today}`, 262, 180, { align: "right" });

  pdf.save("certificate.pdf");
});
