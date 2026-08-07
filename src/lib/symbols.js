/* Traumsymbole — portiert aus legacy/app.js, inhaltlich unveraendert.
 *
 * Die Stichwortlisten, die Wortgrenzen-Regex und die Ortszeit-Tagesgrenzen
 * sind hart erarbeitete Korrekturen und werden hier NICHT angefasst. Nur die
 * Kategorie-Beschriftungen sind eingedeutscht.
 *
 * Die keywords bleiben ENGLISCH — bewusste Entscheidung, siehe docs/STAND.md.
 * Deutsche Begriffe zu ergaenzen ist ein eigener Vorgang.
 */

/* ---------- Traumsymbole ----------
 *
 * Die Symbole kommen aus dem TRAUMTEXT, nicht aus den erzeugten Bildern: was
 * der Mensch geschrieben hat, enthält die Symbole bereits — das Bild ist nur
 * eine Darstellung davon. Bildanalyse bräuchte ein weiteres Modell, einen
 * weiteren Schlüssel und ein Backend.
 *
 * Vorkommen werden NICHT gespeichert, sondern bei jedem Rendern aus
 * `state.journal` neu berechnet. Das heißt: keine Migration, keine doppelten
 * Daten — und ein später ergänztes Symbol reichert rückwirkend auch alte
 * Träume an.
 *
 * `meaning` ist eine gängige Lesart zur Selbstbeobachtung, keine Diagnose.
 * Die Seite sagt das auch so.
 */
export const SYMBOL_CATEGORIES = {
  place:    { label: "Orte",     emoji: "🏞" },
  scenario: { label: "Szenen",   emoji: "🎬" },
  creature: { label: "Wesen",    emoji: "🐾" },
  person:   { label: "Menschen", emoji: "🧑" },
  emotion:  { label: "Gefühle",  emoji: "💗" },
};

export const SYMBOLS = [
  // — Orte —
  { id:'water', label:'Water', emoji:'🌊', category:'place',
    keywords:['water','ocean','sea','beach','shore','wave','waves','tide','river','lake','swim','swimming','drown','drowning','flood','flooding','rain','raining'],
    meaning:'Water is usually read as feeling — its depth, its calm, its force. Rising water often shows up when something emotional feels bigger than expected.' },
  { id:'home', label:'House & home', emoji:'🏠', category:'place',
    keywords:['house','home','kitchen','bedroom','apartment','flat','living room','childhood home','attic','basement','cellar'],
    meaning:'Houses tend to stand for the self, and rooms for parts of it. Rooms you did not know were there are a common motif in times of change.' },
  { id:'city', label:'City & streets', emoji:'🏙', category:'place',
    keywords:['city','street','streets','building','buildings','alley','traffic','crowd','downtown','subway','station'],
    meaning:'Cities often carry the feeling of being among others — anonymous, carried along, or lost in the pattern.' },
  { id:'forest', label:'Forest & wilderness', emoji:'🌲', category:'place',
    keywords:['forest','woods','tree','trees','jungle','wilderness','mountain','desert','field','meadow'],
    meaning:'Wild places often appear when something is unmapped: a decision without a clear path, or a part of life without instructions.' },
  { id:'sky', label:'Sky & space', emoji:'🌌', category:'place',
    keywords:['sky','stars','moon','space','cloud','clouds','sun','planet','galaxy','night sky'],
    meaning:'Vast space tends to show up alongside perspective — the sense of being small, or of seeing something from far enough away to understand it.' },

  // — Szenarien —
  { id:'falling', label:'Falling', emoji:'🪂', category:'scenario',
    keywords:['fall','falling','fell','drop','dropping','plummet','tumbling','cliff','edge'],
    meaning:'One of the most common dreams there is. Often connected to control — or the moment of noticing you have less of it than you thought.' },
  { id:'flying', label:'Flying', emoji:'🕊',  category:'scenario',
    keywords:['fly','flying','flew','float','floating','soar','hover','weightless','levitate'],
    meaning:'Flying is frequently reported during stretches of freedom or relief, and sometimes as the wish for distance from something on the ground.' },
  { id:'chase', label:'Being chased', emoji:'🏃', category:'scenario',
    keywords:['chase','chased','chasing','run','running','escape','fleeing','pursued','hunted','hiding'],
    meaning:'Chase dreams are widely linked to avoidance — something that wants attention and is not getting it yet. What follows you matters less than that it follows.' },
  { id:'missing', label:'Missing something', emoji:'🎫', category:'scenario',
    keywords:['miss','missed','missing','late','too late','train','flight','plane','bus','departure','deadline','delayed'],
    meaning:'Missing a train or a flight is a classic during transitions — a new job, a move, a decision. It often pairs with the fear of a window closing.' },
  { id:'lost', label:'Being lost', emoji:'🧭', category:'scenario',
    keywords:['lost','lose','losing','can\'t find','cannot find','maze','labyrinth','wrong way','no way out','wandering'],
    meaning:'Getting lost tends to surface when a direction in waking life is genuinely unclear, rather than merely difficult.' },
  { id:'exposed', label:'Exposed', emoji:'👁', category:'scenario',
    keywords:['naked','nude','undressed','exposed','embarrassed','ashamed','stage','audience','watched','exam','test','unprepared'],
    meaning:'Being seen unprepared is one of the most reported dreams. It usually says more about the fear of judgement than about any real lack.' },
  { id:'teeth', label:'Teeth falling out', emoji:'🦷', category:'scenario',
    keywords:['teeth','tooth','molar','crumbling teeth','losing teeth'],
    meaning:'Strikingly common across cultures. Often connected to how one is perceived, to speech, or to a stretch of feeling less capable than usual.' },

  // — Wesen —
  { id:'animal', label:'Animals', emoji:'🐺', category:'creature',
    keywords:['animal','dog','cat','wolf','bird','horse','snake','spider','bear','fox','fish','insect'],
    meaning:'Animals often carry the instinctive, unreasoned part of a situation — what you feel about it before you have argued yourself into a position.' },
  { id:'monster', label:'Monsters & shadows', emoji:'👹', category:'creature',
    keywords:['monster','creature','shadow','demon','beast','thing','figure','dark shape','something behind'],
    meaning:'Shapes that cannot be looked at directly are frequently read as something known but not yet named.' },

  // — Menschen —
  { id:'family', label:'Family', emoji:'👨‍👩‍👧', category:'person',
    keywords:['mother','mom','father','dad','parent','parents','sister','brother','grandmother','grandma','grandfather','grandpa','family','aunt','uncle'],
    meaning:'Family members in dreams often stand less for the actual person than for what they represent to you — a rule, a comfort, an expectation.' },
  { id:'stranger', label:'Strangers', emoji:'🚶', category:'person',
    keywords:['stranger','strangers','someone','unknown person','faceless','nobody','crowd of people'],
    meaning:'Unknown figures are commonly read as parts of oneself that have not been introduced yet.' },
  { id:'partner', label:'Love & partners', emoji:'💞', category:'person',
    keywords:['lover','partner','boyfriend','girlfriend','husband','wife','ex','kiss','kissing','wedding','date'],
    meaning:'Romantic figures tend to appear around closeness and distance generally, not only around romance.' },

  // — Gefühle —
  { id:'fear', label:'Fear', emoji:'😨', category:'emotion',
    keywords:['afraid','scared','fear','terrified','panic','dread','frightened','nightmare','horror'],
    meaning:'Fear in a dream is worth noting on its own — the same scene with and without it means different things.' },
  { id:'joy', label:'Joy & warmth', emoji:'✨', category:'emotion',
    keywords:['happy','joy','warm','laughing','laughter','light','peaceful','calm','safe','beautiful','free'],
    meaning:'Good feelings are as informative as bad ones, and are far more easily forgotten by morning.' },
  { id:'grief', label:'Grief & loss', emoji:'🌧', category:'emotion',
    keywords:['sad','sadness','crying','cry','tears','grief','mourning','death','died','dead','funeral','goodbye','gone'],
    meaning:'Death in dreams is rarely about dying. It much more often marks an ending of some other kind — a role, a phase, a version of oneself.' },
];

// Wortgrenzen-Treffer, damit "sea" nicht in "season" und "cat" nicht in
// "catalogue" anschlägt. Mehrwortbegriffe ("too late") funktionieren ebenso.
//
// EIN Ausdruck pro Symbol, EINMAL beim Laden gebaut. Vorher wurde pro Aufruf
// je Stichwort ein neuer RegExp übersetzt — 211 Stück, und `renderEvents` rief
// die Erkennung zusätzlich pro verknüpftem Symbol erneut für jeden Traum auf.
const SYMBOL_RE = new Map(SYMBOLS.map(s => {
  const alts = s.keywords
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))
    .sort((a,b) => b.length - a.length)   // längere Varianten zuerst prüfen
    .join('|');
  return [s.id, new RegExp('(^|[^a-z])(?:' + alts + ')([^a-z]|$)','i')];
}));

/** Alle Symbol-IDs, die in einem Traumtext vorkommen. */
export function detectSymbols(text){
  // Typografische Apostrophe angleichen, sonst verfehlt "can't find" ein
  // "can’t find" aus der Zwischenablage.
  const t = String(text||'').toLowerCase().replace(/[‘’ʼ]/g, "'");
  if(!t) return [];
  const out = [];
  for(const s of SYMBOLS) if(SYMBOL_RE.get(s.id).test(t)) out.push(s.id);
  return out;
}

/** Map<symbolId, [{entryId, createdAt, title, text}]> — aus dem Tagebuch abgeleitet. */
export function symbolOccurrences(journal){
  const out = new Map();
  for(const entry of (journal||[])){
    for(const id of detectSymbols(entry.text)){
      if(!out.has(id)) out.set(id,[]);
      out.get(id).push({entryId:entry.id, createdAt:entry.createdAt, title:entry.title, text:entry.text});
    }
  }
  // neueste zuerst, damit Listen ohne weiteres Sortieren stimmen
  for(const list of out.values()) list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return out;
}

export function symbolById(id){ return SYMBOLS.find(s => s.id===id) || null; }

// Ereignisdaten sind reine Kalendertage ('2026-08-01'). `new Date()` liest die
// als UTC-Mitternacht — Traumzeitstempel sind dagegen echte Zeitpunkte. In
// Berlin (UTC+2) fiel damit ein um 00:30 Uhr notierter Traum aus dem Zeitraum
// seines eigenen Tages heraus. Ausgerechnet die Träume, die man direkt nach
// dem Aufwachen einträgt. Deshalb: Tagesgrenzen in ORTSZEIT bilden.
function localDayStart(ymd){
  const [y,m,d] = String(ymd).split('-').map(Number);
  return new Date(y, m-1, d, 0, 0, 0, 0).getTime();
}
function localDayEnd(ymd){
  const [y,m,d] = String(ymd).split('-').map(Number);
  return new Date(y, m-1, d, 23, 59, 59, 999).getTime();
}

/** Träume, die in den Zeitraum eines Lebensereignisses fallen. */
export function dreamsDuringEvent(journal, event){
  if(!event || !event.startsAt) return [];
  const from = localDayStart(event.startsAt);
  const to = event.endsAt ? localDayEnd(event.endsAt) : Date.now();
  return (journal||[]).filter(e=>{
    const t = new Date(e.createdAt).getTime();
    return t >= from && t <= to;
  }).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
}
