/* ============================================================
   SCRIPT.JS
   Motore del sito: legge i dati dei lavori dal Google Sheet
   (pubblicato come CSV) e costruisce automaticamente:
   - il lavoro in evidenza in index.html
   - la griglia in works.html
   - il dettaglio in work.html

   COSA DEVI FARE TU: incolla qui sotto il link del foglio
   pubblicato come CSV (vedi LEGGIMI.md per i passaggi).
   ============================================================ */

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQcCeE1IhaO7_Am6l5KO5TZL7S9ixISAgLK9sajgxXrp4Qu3LUb-uY7iTFodt_qQSSLFiowJcHk77D/pub?gid=0&single=true&output=csv"; // <-- incolla qui il link "Pubblica sul web" (formato CSV)

/* ---------- Funzioni di supporto ---------- */

// Scarica e legge il CSV, restituisce un array di oggetti
// (uno per riga, con le intestazioni di colonna come chiavi)
async function scaricaLavori() {
  if (!SHEET_CSV_URL) {
    console.warn("SHEET_CSV_URL non impostato: mostro dati di esempio.");
    return null;
  }
  // Aggiungiamo un parametro "cache-busting" (l'orario attuale) così il
  // browser non mostra mai una versione vecchia salvata in cache del CSV.
  const urlSenzaCache = SHEET_CSV_URL + (SHEET_CSV_URL.includes("?") ? "&" : "?") + "t=" + Date.now();
  const risposta = await fetch(urlSenzaCache, { cache: "no-store" });
  if (!risposta.ok) throw new Error("Impossibile leggere il foglio Google.");
  const testoCSV = await risposta.text();

  const risultato = Papa.parse(testoCSV, { header: true, skipEmptyLines: true });
  return risultato.data
    .filter(riga => String(riga.pubblica).trim().toUpperCase() === "TRUE")
    .sort((a, b) => Number(a.ordine || 0) - Number(b.ordine || 0));
}

// Costruisce l'URL/embed corretto a seconda che il media sia
// una foto o un video (YouTube). "media" può essere un percorso
// immagine, oppure un ID o link YouTube.
/*function estraiIdYouTube(valore) {
  if (!valore) return "";
  const match = valore.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : valore.trim(); // se non è un link, assume sia già l'ID
}*/

// Funzione per estrarre l'ID di Vimeo e generare l'URL di embed corretto
function estraiEmbedVimeo(valore) {
  if (!valore) return "";
  
  // Estrae l'ID numerico sia da un link completo (es. https://vimeo.com/123456789) che da un ID semplice
  const match = valore.match(/(?:vimeo\.com\/)(\d+)/);
  const vimeoId = match ? match[1] : valore.trim();
  
  return `https://player.vimeo.com/video/${vimeoId}?color=f97373&title=0&byline=0&portrait=0`;
}

async function ottieniLavori() {
  try {
    const dati = await scaricaLavori();
    return dati && dati.length ? dati : DATI_DEMO;
  } catch (err) {
    console.error(err);
    return DATI_DEMO;
  }
}

/* ---------- Costruzione HTML dei "frame" (usata da index e works) ---------- */
function html_frame(lavoro) {
  return `
    <a href="work.html?slug=${encodeURIComponent(lavoro.slug)}" class="frame">
      <img src="${lavoro.copertina}" alt="${lavoro.titolo}">
      <span class="frame-label">
        <span class="t">${lavoro.titolo}</span>
        <span class="y">${lavoro.anno}</span>
      </span>
    </a>`;
}

/* ---------- Pagina index.html: mostra il lavoro con ordine=1 ---------- */
async function inizializzaHome() {
  const contenitore = document.getElementById("hero-container");
  if (!contenitore) return;
  const lavori = await ottieniLavori();
  const recente = lavori[0];
  if (!recente) { contenitore.innerHTML = "<p>Nessun lavoro pubblicato.</p>"; return; }

  // Gestisce gli a capo nel titolo
  const titoloFormatted = (recente.titolo || "").replace(/\r?\n/g, "<br>");

  contenitore.innerHTML = `
    <a href="work.html?slug=${encodeURIComponent(recente.slug)}" class="hero-link">
      <div class="hero-frame">
        <img src="${recente.copertina}" alt="${recente.titolo}">
      </div>
      <div class="hero-caption">
        <h1 class="hero-title">${titoloFormatted}</h1>
      </div>
    </a>`;
}

/* ---------- Pagina works.html: organizzata in colonne per "tipo" ---------- */
async function inizializzaGriglia() {
  const container = document.getElementById("works-index");
  if (!container) return;

  const lavori = await ottieniLavori();

  if (!lavori || lavori.length === 0) {
    container.innerHTML = "<p>Nessun lavoro trovato.</p>";
    return;
  }

  const gruppi = {};

  lavori.forEach(lavoro => {
    const tipo = lavoro.tipo || lavoro.categoria || "Altro";

    if (!gruppi[tipo]) {
      gruppi[tipo] = [];
    }
    gruppi[tipo].push(lavoro);
  });

  container.innerHTML = Object.entries(gruppi)
    .map(([tipo, items]) => `
      <div class="category">
        <h2>${tipo}</h2>
        <ul>
          ${items.map(item => {
            // Converts newlines or markdown in titles into clean HTML
            const titleHtml = typeof marked !== 'undefined' 
              ? marked.parseInline(item.titolo || "") 
              : (item.titolo || "").replace(/\n/g, "<br>");

            return `
              <li>
                <a href="work.html?slug=${encodeURIComponent(item.slug)}">
                  <span class="work-title">${titleHtml}</span>
                </a>
              </li>
            `;
          }).join("")}
        </ul>
      </div>
    `).join("");
}

// Genera la galleria o l'embed video in base al contenuto del foglio Google
function costruisciGalleria(lavoro) {
  const tipoMedia = (lavoro.tipo_media || "").toLowerCase().trim();
  const mediaVal = lavoro.media || "";

  // Caso 1: Video Vimeo
  if (tipoMedia === "video" || tipoMedia === "vimeo" || mediaVal.includes("vimeo")) {
    const embedSrc = estraiEmbedVimeo(mediaVal);
    return `
      <figure class="media-full" style="aspect-ratio: 16 / 9; width: 100%;">
        <iframe 
          src="${embedSrc}" 
          style="width: 100%; height: 100%; border: 0;" 
          allow="autoplay; fullscreen; picture-in-picture" 
          allowfullscreen 
          title="${lavoro.titolo}">
        </iframe>
      </figure>`;
  }

  // Caso 2: Gallerie con immagini multiple (separate da a capo nella colonna 'immagini')
  const immaginiGrezze = lavoro.immagini || "";
  const immagini = immaginiGrezze
    .split(/\r?\n/)
    .map(url => url.trim())
    .filter(Boolean);

  if (immagini.length > 0) {
    const classeFull = immagini.length === 1 ? ' class="media-full"' : '';
    return immagini
      .map(url => `<figure${classeFull}><img src="${url}" alt="${lavoro.titolo}"></figure>`)
      .join("");
  }

  // Caso 3: Fallback a una singola immagine di copertina
  if (lavoro.copertina) {
    return `<figure class="media-full"><img src="${lavoro.copertina}" alt="${lavoro.titolo}"></figure>`;
  }

  return "";
}

// Costruisce la galleria di immagini per la pagina di un lavoro.
// Legge la colonna "immagini" (una URL per riga, separate con Alt+Enter
// nel foglio). Se quella colonna è vuota, torna al comportamento
// precedente: mostra un video oppure la sola immagine di copertina.
/*function costruisciGalleria(lavoro) {
  const immaginiGrezze = lavoro.immagini || "";
  const immagini = immaginiGrezze
    .split(/\r?\n/)
    .map(url => url.trim())
    .filter(Boolean); // toglie righe vuote
 
  if (immagini.length > 0) {
    // Una sola immagine: occupa tutta la larghezza (niente griglia a 2 colonne).
    // Due o più immagini: ciascuna resta in una cella della griglia a 2 colonne.
    const classeFull = immagini.length === 1 ? ' class="media-full"' : '';
    return immagini
      .map(url => `<figure${classeFull}><img src="${url}" alt="${lavoro.titolo}"></figure>`)
      .join("");
  }

  // --- fallback: nessuna colonna "immagini" compilata ---
  if (lavoro.tipo_media === "video") {
    return `<figure class="media-full" style="aspect-ratio:16/9;">
       <iframe style="width:100%;height:100%;border:0;"
         src="https://www.youtube.com/embed/${estraiIdYouTube(lavoro.media)}"
         title="${lavoro.titolo}" allowfullscreen></iframe>
     </figure>`;
  }
  return `<figure class="media-full"><img src="${lavoro.copertina}" alt="${lavoro.titolo}"></figure>`;
}*/

/* ---------- Pagina work.html: dettaglio letto da ?slug=... ---------- */
async function inizializzaDettaglio() {
  const contenitore = document.getElementById("work-container");
  if (!contenitore) return;

  const parametri = new URLSearchParams(window.location.search);
  const slug = parametri.get("slug");
  const lavori = await ottieniLavori();
  const lavoro = lavori.find(l => l.slug === slug) || lavori[0];

  if (!lavoro) { contenitore.innerHTML = "<p>Lavoro non trovato.</p>"; return; }

  // Format the title explicitly with <br> tags for newlines
  const titoloConACapo = (lavoro.titolo || "").replace(/\r?\n/g, "<br>");

  // Set page document title (without HTML tags)
  document.title = `${lavoro.titolo.replace(/\r?\n/g, " ")} — Lorenzo Faggi`;

  if (typeof marked !== 'undefined') {
    const renderer = new marked.Renderer();
    renderer.link = ({ href, title, text }) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    };
    marked.setOptions({ renderer });
  }

  // Parse description with Marked
  const descrizioneHTML = typeof marked !== 'undefined' 
    ? marked.parse(lavoro.descrizione || "") 
    : `<p>${lavoro.descrizione || ""}</p>`;

  const mediaHTML = costruisciGalleria(lavoro);

contenitore.innerHTML = `
  <section class="work-header">
    <h1>${titoloConACapo}</h1>
  </section>
  <section class="work-media">${mediaHTML}</section>
  <section class="work-body">${descrizioneHTML}</section>`;
}

/* ---------- Interazioni comuni a tutte le pagine ---------- */
function attivaMenuMobile() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const aperto = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", aperto ? "true" : "false");
  });
}

function attivaTocco() {
  document.querySelectorAll(".frame").forEach(frame => {
    frame.addEventListener("click", e => {
      if (window.matchMedia("(hover: none)").matches && !frame.classList.contains("is-active")) {
        e.preventDefault();
        document.querySelectorAll(".frame").forEach(f => f.classList.remove("is-active"));
        frame.classList.add("is-active");
      }
    });
  });
}

/* ---------- Avvio ---------- */
document.addEventListener("DOMContentLoaded", () => {
  attivaMenuMobile();
  inizializzaHome();
  inizializzaGriglia();
  inizializzaDettaglio();
});