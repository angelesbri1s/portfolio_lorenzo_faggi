# Portfolio — guida rapida

## Struttura del progetto

```
portfolio-site/
├── index.html      → Homepage ("Recent"), mostra il lavoro più recente
├── works.html       → Archivio di tutti i lavori (griglia), letto dal foglio
├── work.html         → Modello di pagina per UN lavoro (work.html?slug=...)
├── about.html         → Bio + contatti
├── css/
│   └── style.css     → TUTTO lo stile del sito (colori, font, layout)
└── js/
    └── script.js      → Legge il Google Sheet e costruisce le pagine
```

## Collegare il Google Sheet

1. Crea un foglio su sheets.google.com. Nella prima riga scrivi ESATTAMENTE
   queste intestazioni (in quest'ordine, minuscole):

   `pubblica | ordine | slug | titolo | anno | categoria | copertina | tipo_media | media | descrizione`

2. Una riga = un lavoro. Significato delle colonne:
   - **pubblica**: `TRUE` per mostrarlo sul sito, `FALSE` per nasconderlo
   - **ordine**: numero, `1` = il più recente (va in cima/in homepage)
   - **slug**: nome-breve-senza-spazi usato nel link, es. `opera-blu`
   - **titolo**, **anno**, **categoria**: testo libero
   - **copertina**: percorso dell'immagine per la griglia, es. `img/opera-blu.jpg`
   - **tipo_media**: `foto` oppure `video`
   - **media**: per una foto, il percorso dell'immagine grande; per un
     video, il link YouTube completo o solo l'ID (es. `dQw4w9WgXcQ`)
   - **descrizione**: il testo nella pagina di dettaglio

3. Menu **File → Condividi → Pubblica sul web** → scegli il foglio →
   formato **CSV** → Pubblica. Copia il link ottenuto.

4. Apri `js/script.js`, riga 15 circa: incolla il link dentro
   `const SHEET_CSV_URL = "";` tra le virgolette.

5. Ricarica `index.html`: da ora la griglia, la home e i dettagli si
   aggiornano da soli leggendo il foglio. Per aggiungere un lavoro
   basta aggiungere una riga — nessun codice da toccare.

**Finché non incolli il link**, il sito mostra due lavori di esempio
per farti vedere che il meccanismo funziona.

## Le immagini/video

Le foto vere andranno in una cartella `img/` dentro il sito (le
carichi tu su GitHub insieme al resto del codice); nel foglio Google
scriverai solo il percorso, es. `img/opera-blu.jpg`. I video restano
su YouTube/Vimeo — nel foglio metti solo il link o l'ID.

## Cosa sostituire prima di pubblicarlo

- "Nome Cognome" in tutte le pagine (header/footer/title)
- I dati di esempio in `about.html`
- Le colonne del foglio con i lavori reali

## Prossimo passo

Mettere il sito online con **GitHub Pages** — repository GitHub +
pubblicazione gratuita con link pubblico.
