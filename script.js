document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const dropzone = document.getElementById("dropzone");
  const browseBtn = document.getElementById("browseBtn");
  const previewFrame = document.getElementById("previewFrame");
  const emptyState = document.getElementById("emptyState");
  const openInNewTab = document.getElementById("openInNewTab");

  const fileNameEl = document.getElementById("fileName");
  const fileSizeEl = document.getElementById("fileSize");
  const fileTypeEl = document.getElementById("fileType");

  browseBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFile(file);
    }
  });

  ["dragenter", "dragover"].forEach((type) => {
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((type) => {
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  });

  function formatBytes(bytes) {
    if (!bytes) return "0 KB";

    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }

    return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  function inferTypeFromName(name) {
    const lower = name.toLowerCase();
    if (lower.endsWith(".zip")) return "ZIP";
    if (lower.endsWith(".html") || lower.endsWith(".htm")) return "HTML";
    if (lower.endsWith(".pdf")) return "PDF";
    if (lower.endsWith(".txt")) return "Text";
    if (lower.endsWith(".md")) return "Markdown";
    return "Datei";
  }

  function updateMeta(file) {
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatBytes(file.size);
    fileTypeEl.textContent = file.type || inferTypeFromName(file.name);
  }

  function showPreviewFrame() {
    emptyState.style.display = "none";
    previewFrame.style.display = "block";
  }

  function renderHtmlPreview(htmlString) {
    showPreviewFrame();
    previewFrame.srcdoc = htmlString;

    openInNewTab.onclick = () => {
      const newTab = window.open("");
      newTab.document.write(htmlString);
      newTab.document.close();
    };
  }

  function renderTextPreview(text) {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const html = `
      <!DOCTYPE html>
      <html lang="de">
        <body style="font-family:sans-serif; background:#f8fafc; color:#111827; padding:32px; line-height:1.7;">
          <pre style="white-space:pre-wrap; word-break:break-word; margin:0;">${escaped}</pre>
        </body>
      </html>
    `;

    renderHtmlPreview(html);
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload fehlgeschlagen");
    }

    return data.url;
  }

  async function handleFile(file) {
    updateMeta(file);

    try {
      const name = file.name.toLowerCase();

      if (name.endsWith(".html") || name.endsWith(".htm")) {
        const uploadedUrl = await uploadFile(file);
        showPreviewFrame();
        previewFrame.src = uploadedUrl;
        openInNewTab.onclick = () => window.open(uploadedUrl, "_blank");
        return;
      }

      if (name.endsWith(".pdf")) {
        const uploadedUrl = await uploadFile(file);
        showPreviewFrame();
        previewFrame.src = uploadedUrl;
        openInNewTab.onclick = () => window.open(uploadedUrl, "_blank");
        return;
      }

      if (name.endsWith(".txt") || name.endsWith(".md")) {
        const uploadedUrl = await uploadFile(file);
        const text = await fetch(uploadedUrl).then((response) => response.text());
        renderTextPreview(text);
        return;
      }

      if (name.endsWith(".zip")) {
        const uploadedUrl = await uploadFile(file);
        const arrayBuffer = await fetch(uploadedUrl).then((response) => response.arrayBuffer());
        const zip = await JSZip.loadAsync(arrayBuffer);

        const htmlEntry = Object.keys(zip.files)
          .filter((key) => !zip.files[key].dir)
          .find((key) => /(\.html?|\.xhtml)$/i.test(key));

        if (htmlEntry) {
          const html = await zip.file(htmlEntry).async("string");
          renderHtmlPreview(html);
          return;
        }

        renderTextPreview("ZIP-Datei hochgeladen, aber keine HTML-Datei gefunden. Stelle sicher, dass im Archiv eine index.html oder ähnliche HTML-Datei vorhanden ist.");
        return;
      }

      renderTextPreview("Datei erfolgreich hochgeladen, aber das Format ist nicht für die Vorschau geeignet. Nutze HTML, PDF, TXT, MD oder ZIP.");
    } catch (error) {
      console.error(error);
      renderTextPreview("Beim Hochladen oder Anzeigen der Datei ist ein Fehler aufgetreten.");
    }
  }
});
