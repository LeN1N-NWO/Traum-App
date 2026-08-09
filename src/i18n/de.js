/* Deutsche Übersetzung. Muss dieselbe Form wie en.js haben: dieselben
 * Schlüssel, dieselben Funktionssignaturen, dieselbe Array-Länge. Wer hier
 * etwas ändert, ändert es in JEDER Sprachdatei — die Struktur ist der
 * Vertrag, den src/i18n/index.js voraussetzt.
 *
 * Durchgehend „du“ — ein persönliches Traumtagebuch siezt niemanden.
 */
export default {
  tabs: {
    home: "Start",
    journal: "Journal",
    symbols: "Symbole",
    profile: "Profil",
    sleep: "Schlaf",
    newDream: "Neuen Traum aufnehmen",
  },

  splash: {
    loading: "Dream Rushes lädt",
  },

  home: {
    greeting: {
      night: "Noch wach",
      morning: "Guten Morgen",
      afternoon: "Guten Tag",
      evening: "Guten Abend",
    },
    title: "Was hast du geträumt?",
    lede: "Erzähl es, solange es noch warm ist — halb wach klappt am besten.",
    cta: "Aufnehmen",
    streak: (n) => `${n} Tag${n === 1 ? "" : "e"}`,
    lastHeading: "Letzte Nacht",
    menagerieHeading: "Deine Menagerie",
    menagerieEmpty: "Noch keine Wesen. Jeder aufgeschriebene Traum lässt eines zurück.",
    untitled: "Unbenannter Traum",
  },

  journal: {
    viewList: "Als Liste zeigen",
    viewDeck: "Als Karten zeigen",
    library: "Deine Besetzung",
    libraryLede: "Personen, Tiere und Orte, aus denen deine Träume schöpfen können.",
    libraryCount: (n) =>
      n === 0 ? "Noch niemand — füge die Gesichter hinzu, die deine Träume nutzen sollen"
              : `${n} ${n === 1 ? "Eintrag" : "Einträge"} · Personen, Tiere, Orte`,
    title: "Journal",
    count: (n) => (n === 1 ? "1 Traum" : `${n} Träume`),
    search: "Träume durchsuchen…",
    searchLabel: "Träume durchsuchen",
    empty: "Noch keine Träume aufgeschrieben.",
    emptySearch: "Nichts gefunden.",
    untitled: "Unbenannter Traum",
    close: "Schließen",
    referencesUsed: "Verwendete Referenzfotos:",
    delete: "Eintrag löschen",
    deleted: "Eintrag gelöscht",
    menu: "Weitere Aktionen",
    edit: "Text bearbeiten",
    editing: "Bearbeiten",
    save: "Speichern",
    cancelEdit: "Änderungen verwerfen",
    edited: "Änderungen gespeichert",
    correct: "Rechtschreibung & Grammatik korrigieren",
    rewrite: "Besser umschreiben",
    elaborate: "Erzählweise ausarbeiten",
    working: "Wird bearbeitet…",
    refineTitle: "Hier ist die überarbeitete Fassung",
    refineLede: "Dein aktueller Text bleibt erhalten, bis du das hier annimmst.",
    before: "Jetzt",
    after: "Überarbeitet",
    keep: "Meine Fassung behalten",
    accept: "Diese Fassung verwenden",
    share: "Teilen",
    sharing: "Wird vorbereitet…",
    shared: "Geteilt",
    shareUnsupported: "Teilen geht hier nicht — die Dateien wurden stattdessen heruntergeladen.",
    shareNothing: "Noch nichts zu teilen — dieser Traum hat keine Bilder.",
    noCredits: "Nicht genug Credits. Aufladen kommt bald.",
    original: "Ursprünglich geschrieben",
    showOriginal: "Zeigen, was ich zuerst geschrieben habe",
    hideOriginal: "Original ausblenden",
    months: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    actRewrite: "Umschreiben",
    actEdit: "Bearbeiten",
    actShare: "Teilen",
    refinePickTitle: "Wie soll ich ihn umschreiben?",
    refinePickLede: "Deine Fassung bleibt so oder so erhalten — nichts wird ersetzt, bevor du zustimmst.",
    correctHint: "Nur Rechtschreibung und Grammatik. Kein Wort deiner Stimme ändert sich.",
    rewriteHint: "Derselbe Traum, besser erzählt. Nichts hinzugefügt, nichts weggelassen.",
    elaborateHint: "Mehr Details und ein klarerer Bogen — ohne etwas zu erfinden.",
    filmRendering: "Dein Film wird noch gerendert — er landet hier, sobald er fertig ist.",
    filmArrived: "✦ Dein Film ist fertig",
    makeLede: "Noch keine Bilder. Welche machen?",
    makeImages: "Bilder machen",
    makeFilmLede: "Jetzt zum Leben erwecken.",
    makeFilm: "Kurzfilm machen",
    calendar: "Traumkalender",
    calLabel: "Tage mit aufgezeichnetem Traum — antippen zum Öffnen",
    calPrev: "Vorheriger Monat",
    calNext: "Nächster Monat",
    calMonths: ["Januar", "Februar", "März", "April", "Mai", "Juni",
                "Juli", "August", "September", "Oktober", "November", "Dezember"],
    calWeekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    calDreamt: (day, n) =>
      n === 1 ? `Tag ${day}: diesen Traum öffnen` : `Tag ${day}: ${n} Träume`,
    calSeveral: (n) => `${n} Träume in dieser Nacht`,
  },

  symbols: {
    title: "Symbole",
    subtitle: "Motive, die immer wiederkehren",
    empty: "Noch keine Symbole. Schreib ein paar Träume auf, dann tauchen sie hier auf.",
    close: "Schließen",
    disclaimer: "Eine verbreitete Deutung, zum Nachdenken — keine Diagnose.",
    occurrences: (n) => (n === 1 ? "In 1 Traum" : `In ${n} Träumen`),
    untitled: "Unbenannter Traum",
  },

  profile: {
    title: "Profil",
    credits: "Credits",
    creditsSoon: "Aufladen kommt bald",
    you: "Du",
    meSet: "Antippen, um dein Foto zu ändern",
    meEmpty: "Füge ein Foto hinzu, damit Träume dich zeigen können",
    addPhoto: "Dein Foto hinzufügen",
    changePhoto: "Dein Foto ändern",
    statDreams: "Träume",
    statStreak: "Tage in Folge",
    people: "Personen",
    pets: "Tiere",
    places: "Orte",
    new: "Neu",
    deleteLabel: (tag) => `@${tag} löschen`,
    editLabel: (tag) => `@${tag} bearbeiten`,
    referenceFor: (tag) => `Referenzfoto für @${tag}`,
    removed: (tag) => `@${tag} entfernt`,
  },

  avatarDialog: {
    titleFor: { person: "Person hinzufügen", pet: "Tier hinzufügen", place: "Ort hinzufügen" },
    editTitleFor: { person: "Person bearbeiten", pet: "Tier bearbeiten", place: "Ort bearbeiten" },
    meTitle: "Das bist du",
    nameLabel: (tag) => `Name (wird zu @${tag})`,
    photoLabel: "Referenzfoto",
    photoAdd: "Foto hinzufügen",
    photoReplace: "Foto ersetzen",
    photoRemove: "Foto entfernen",
    descLabel: "Beschreibe sie",
    descLabelOptional: "Beschreibe sie (optional)",
    descPlaceholder: "groß, dunkle lockige Haare, immer im grünen Mantel",
    previewAlt: "Vorschau des ausgewählten Fotos",
    privacy: "Dieses Foto geht an fal.ai, wenn ein Traum gerendert wird.",
    cancel: "Abbrechen",
    save: "Speichern",
    saveChanges: "Änderungen speichern",
    needName: "⚠ Bitte nur Buchstaben oder Zahlen für den Namen verwenden.",
    needPhotoOrDesc: "⚠ Füge ein Foto hinzu oder beschreibe sie — der Renderer braucht eines von beidem.",
    needPhotoOrDescHint: "Füge ein Foto oder eine Beschreibung hinzu. Ohne beides gibt es nichts, wonach gezeichnet werden kann.",
    exists: (tag) => `⚠ @${tag} gibt es schon.`,
    created: (tag) => `@${tag} hinzugefügt`,
    saved: (tag) => `@${tag} aktualisiert`,
    readFailed: "⚠ Das Foto konnte nicht gelesen werden.",
  },

  tagCard: {
    label: (tag) => `Über @${tag}`,
    categories: { person: "Person", pet: "Tier", place: "Ort" },
    photoOnly: "Keine Beschreibung — das Foto steht für sich.",
    close: "Schließen",
  },

  guide: [
    {
      title: "Realitätschecks",
      text: "Frag dich mehrmals täglich, ob du gerade träumst — und prüfe es wirklich: " +
            "zähl deine Finger, schau auf eine Uhr, schau weg, schau zurück. " +
            "Im Traum ändert sich die Antwort.",
    },
    {
      title: "MILD",
      text: "Wiederhole beim Einschlafen: „Heute Nacht merke ich, dass ich träume.“ " +
            "Stell dir einen Traum vor, den du schon hattest, und stell dir vor, dich darin zu erwischen.",
    },
    {
      title: "WBTB",
      text: "Nach etwa fünf Stunden kurz aufwachen, 20–30 Minuten wach bleiben, dann " +
            "mit MILD wieder einschlafen. Die zuverlässigste Methode — und die, die Schlaf kostet.",
    },
    {
      title: "Aufschreiben",
      text: "Notiere deine Träume gleich nach dem Aufwachen, bevor du aufstehst. Wer regelmäßig " +
            "schreibt, erinnert sich an mehr — und erkennt irgendwann die eigenen Muster.",
    },
  ],

  dream: {
    title: "Deinen Traum aufnehmen",
    cancel: "Abbrechen",
    label: "Letzte Nacht habe ich geträumt…",
    placeholder: "…ich fiel rückwärts durch eine Stadt, die sich in Wasser verwandelte, " +
                 "und die Straßenlaternen wurden zu Quallen…",
    textLabel: "Traumtext",
    modeLegend: "Wie soll es entstehen?",
    modeImages: "Bildgeschichte",
    modeImagesHint: "Eine Abfolge von Standbildern",
    modeFilm: "Film",
    modeFilmHint: "Ein kurzer bewegter Clip",
    privacy: "Dein Traumtext geht an fal.ai (und DeepSeek, für den Prompt). " +
             "Referenzfotos und Sprachaufnahmen gehen nur an fal.ai. Dein Journal bleibt auf diesem Gerät.",
    submit: "✦ Den Traum heraufbeschwören",
    submitting: "Wird heraufbeschworen…",
    tooShort: "⚠ Schreib erst noch etwas mehr.",
    caught: (name) => `✦ ${name} ist deiner Menagerie beigetreten`,
    interview: "Laut erzählen",
    interviewHint: "Ich frage, du erzählst — Augen zu, wenn du magst",
    reading: "Dein Traum wird gelesen…",
    readingHint: "Benennt ihn und findet heraus, wer dabei war.",
    or: "oder schreib ihn",
    loading: [
      "Deine Aufnahmen werden entwickelt…",
      "Der Nebel wird geschnitten…",
      "Dein Unterbewusstsein wird koloriert…",
      "Was du gesehen hast, wird heraufbeschworen…",
      "Fast luzide…",
    ],
  },

  wizard: {
    back: "Zurück",
    cancel: "Abbrechen",
    next: "Weiter",
    free: "Gratis",
    from: "ab",
    credit: "Credit",
    credits: "Credits",
    tooShort: "⚠ Schreib erst noch etwas mehr.",
    noCredits: "Nicht genug Credits. Aufladen kommt bald.",
    progress: (n, total) => `Schritt ${n} von ${total}`,

    step1: {
      title: "Was hast du geträumt?",
      improve: "Mit KI verbessern",
      reading: "Dein Traum wird gelesen…",
      why: "Die KI erzählt deinen Traum in deiner eigenen Sprache neu und findet heraus, wer und " +
           "wo darin vorkommt. Alles danach — die Figuren, die Orte, die Bilder — baut darauf auf.",
      previewTitle: "Hier ist er, aufgeräumt",
      previewLede: "Deine eigenen Worte bleiben so oder so erhalten.",
      yours: "Wie du es geschrieben hast",
      improved: "Verbessert",
      keepMine: "Meine Worte behalten",
      useImproved: "Diese Fassung verwenden",
    },

    step2: {
      title: "Was soll daraus werden?",
      saveOnly: "Nur speichern",
      saveOnlyHint: "Ins Journal, nichts wird erzeugt",
      images: "Eine Bildgeschichte",
      imagesHint: "Standbilder deines Traums, der Reihe nach",
      film: "Ein Film",
      filmHint: "Rendert erst ein Standbild, erweckt es dann zum Leben",
      saved: "Traum gespeichert",
    },

    step3: {
      title: "Wer kommt vor?",
      lede: "Alle, die schon in deiner Bibliothek stehen, werden automatisch erkannt. Für den " +
            "Rest sag uns, wer sie sind — oder lass die KI sie erfinden.",
      empty: "In diesem Traum wurde niemand gefunden. Kein Problem — weiter geht's.",
    },

    step4: {
      title: "Wo spielt es?",
      lede: "Ein Traum, der von einem Ort zum nächsten wandert, braucht beide. Dieselbe " +
            "Auswahl wie eben.",
      empty: "In diesem Traum wurde kein Ort gefunden. Die KI stellt sich einen vor.",
    },

    cast: {
      choose: "Aus der Bibliothek",
      change: "Ändern",
      createNew: "Neu anlegen",
      letAi: "KI entscheiden lassen",
      freeSet: "KI erfindet sie",
      undecided: "Noch nicht entschieden",
      note: "Alles, was offen bleibt, erfindet die KI.",
      removeLabel: (name) => `${name} entfernen`,
      pickTitle: (name) => `Wer ist „${name}“?`,
      libraryEmpty: "Deine Bibliothek ist noch leer.",
    },

    step5: {
      title: "Wie soll es aussehen?",
      countLabel: "Wie viele Bilder",
      countNames: { 3: "Anfang, Mitte, Ende", 5: "Der ganze Bogen", 10: "Jede Wendung" },
      styleLabel: "Stil",
      formatLabel: "Format",
      portrait: "Handy, Stories",
      landscape: "Breitbild",
      keyframeLabel: "Welches Bild wird lebendig?",
      keyframeHint: "Der Film beginnt bei diesem Bild — sein Look zieht sich durch.",
      filmModelLabel: "Welcher Renderer",
      filmModels: {
        standard: { name: "Standard", hint: "bis 15s · 1 Credit pro Sekunde" },
        premium:  { name: "Premium",  hint: "bis 30s in einer Einstellung · 6 pro Sekunde" },
      },
      lengthLabel: "Wie lang",
      posterLabel: "Das Poster",
      posterTitleLabel: "Filmtitel",
      posterTitlePlaceholder: "Titel auf dem Poster",
      posterTaglineLabel: "Tagline",
      posterTaglinePlaceholder: "Eine Zeile, die den Traum verkauft (optional)",
      posterHint: "Dein Traum eröffnet wie ein Film: das erste Bild ist sein Poster, " +
                  "mit diesem Titel darauf. Titel leeren, wenn du lieber nur Szenenbilder willst.",
      generate: "Erstellen",
      progress: (done, total) => `${done} von ${total} fertig`,
      summaryImages: (n) => `${n} Bilder in einer durchgehenden Abfolge.`,
      summaryFilm: "Ein Standbild, zum Leben erweckt.",
      summaryFilmLength: (s) => `${s} Sekunden Film. Das Rendern dauert ein paar Minuten — du kannst zwischendurch weg.`,
      summaryRefs: (n) =>
        n === 0 ? "Keine Referenzfotos — alles wird erfunden."
                : n === 1 ? "1 Referenzfoto wird verwendet."
                          : `${n} Referenzfotos werden verwendet.`,
    },

    step6: {
      title: "Dein Traum",
      save: "Ins Journal speichern",
      added: "Zu deinem Traum hinzugefügt",
      saveWhileRendering: "Speichern — ich hole ihn später ab",
      rendering: "Dein Film entsteht gerade…",
      renderingHint: "Das dauert ein paar Minuten. Du kannst weg — er wartet dann " +
                     "fertig in deinem Journal.",
      renderFailed: "Der Film kam nicht durch. Deine Credits wurden für den Versuch " +
                    "verwendet — sag uns Bescheid, wir schauen es uns an.",
      nothing: "Nichts kam zurück. Versuch es noch mal ab dem letzten Schritt.",
    },
  },

  sleep: {
    title: "Schlaf",
    subtitle: "Alles rund um den Traum — komplett gratis.",
    free: "Träume kosten Credits. Schlaf nie.",
    tiles: {
      checklist: {
        emoji: "🌜",
        title: "Runterkommen",
        text: "Die heutige Checkliste zum schnelleren Einschlafen",
      },
      sounds: {
        emoji: "🌊",
        title: "Einschlafgeräusche",
        text: "Rauschfarben mischen und laufen lassen",
      },
      guide: {
        emoji: "🧠",
        title: "Luzides Träumen",
        text: "Realitätschecks, MILD, WBTB, Traumtagebuch",
      },
      symbols: {
        emoji: "✧",
        title: "Traumsymbole",
        text: "Was in deinen Träumen immer wiederkehrt",
      },
    },
    checklist: {
      lede: "Das heutige Ritual — die Haken setzen sich jeden Tag von selbst zurück.",
      progressLabel: "Heute erledigte Schritte",
      remaining: (n) => (n === 0 ? "Alles erledigt — schlaf gut." : `Noch ${n}`),
      hint: "Nach ~20 Minuten immer noch wach? Steh auf, mach etwas Ruhiges bei " +
            "gedämpftem Licht, und komm zurück, wenn du müde bist — wach liegen " +
            "bringt dem Bett bei, „wach“ zu bedeuten.",
      items: [
        { id: "light",    title: "Alles dimmen",
          text: "Wenig Licht für die letzte Stunde — oder gar keins: verdunkeltes Zimmer oder Schlafmaske." },
        { id: "shower",   title: "Warme Dusche oder Bad",
          text: "Etwa 90 Minuten vor dem Schlafen. Das Abkühlen danach ist das eigene Schlafsignal des Körpers." },
        { id: "cool",     title: "Schlafzimmer kühlen",
          text: "Etwa 16–19 °C. Ein kühles Zimmer unter einer warmen Decke schlägt ein warmes Zimmer." },
        { id: "caffeine", title: "Kein Koffein nach dem frühen Nachmittag",
          text: "Es blockiert den Schlafdruck sechs Stunden und länger — Abendkaffee ist Morgenmüdigkeit." },
        { id: "screens",  title: "Bildschirme weg",
          text: "Die letzte halbe Stunde gehört Papier, Klang oder nichts. Das Journal ist für morgens." },
        { id: "relax",    title: "Jeden Muskel loslassen",
          text: "Von den Zehen bis zum Kiefer: jede Gruppe fünf Sekunden anspannen, loslassen, weiter. Der am besten erprobte Trick auf dieser Liste." },
        { id: "breathe",  title: "Atem verlangsamen",
          text: "4 Sekunden ein, 7 halten, 8 aus — ein paar Runden. Langes Ausatmen schaltet den Körper auf Ruhe." },
      ],
    },
    sounds: {
      lede: "Drei Rauschfarben, mischbar zu deiner eigenen Mischung. Sie laufen in Schleife, " +
            "bis du sie stoppst — und weiter, während du den Rest der App nutzt.",
      names: { white: "Weißes Rauschen", pink: "Rosa Rauschen", brown: "Braunes Rauschen" },
      descs: { white: "helles Rauschen, überdeckt alles", pink: "wie stetiger Regen", brown: "wie ein fernes Meer" },
      autoStart: "Meine Mischung beim App-Start starten",
      autoStartHint: "Browser wollen erst eine Berührung — deine Mischung startet mit dem ersten Antippen.",
      background: "Die Mischung läuft weiter, egal wohin du in der App gehst. Der Lautsprecher-" +
                  "Knopf oben in der Ecke stummt sie jederzeit.",
    },
    soundsMute: "Einschlafgeräusche stumm",
    soundsUnmute: "Einschlafgeräusche an",
  },

  onboarding: {
    tagline: "Deine Träume, entwickelt.",
    swipe: "wischen",
    slides: [
      { title: "Jeden Traum festhalten",
        text: "Erzähl ihn halb schlafend, laut — der Assistent stellt die richtigen " +
              "Fragen und schreibt die Nacht für dich auf." },
      { title: "Deinen Traum sichtbar machen",
        text: "Er wird zu einer Abfolge filmischer Bilder — mit den echten " +
              "Gesichtern der Personen, Tiere und Orte darin. Wähl dein " +
              "liebstes und erweck es als Kurzfilm zum Leben." },
      { title: "Und da ist noch mehr, gratis",
        text: "Eine Anleitung zum luziden Träumen, und was deine wiederkehrenden " +
              "Symbole bedeuten könnten — wann immer du willst." },
    ],
    start: "Los geht's",
    gateTitle: "Mach es zu deinem",
    gateText: "Ein zweiminütiges Gespräch mit dem Assistenten macht dein " +
              "Profil persönlich — wie du träumst, was immer wiederkehrt, wie " +
              "du genannt werden willst. Jede Frage darf übersprungen werden.",
    gateReward: "✦ 3 Credits gratis, wenn du fertig bist",
    gateStart: "Los geht's",
    gateLater: "Vielleicht später",
    surveyTitle: "wir lernen uns kennen",
    selfieTitle: "Eine letzte Sache",
    selfieText: "Füg ein Foto von dir hinzu, und deine Träume können DICH zeigen — " +
                "die Bilder verwenden dein echtes Gesicht. Das geht auch jederzeit später.",
    selfieAdd: "Mein Foto hinzufügen",
    selfieSkip: "Jetzt nicht",
    granted: "✦ Willkommen — 3 Credits hinzugefügt",
    thanks: "✦ Danke — dein Profil steht",
    profileCard: "Profil mit einem 2-Minuten-Gespräch vervollständigen",
    profileCardHint: "✦ 3 Credits gratis, wenn du es tust",
    startMenuTitle: "Bevor es losgeht",
    startMenuText: "Onboarding ansehen, oder direkt zur App springen?",
    startMenuOnboarding: "Onboarding zeigen",
    startMenuSkip: "Zur App springen",
  },

  voice: {
    title: "Traum erzählen",
    cancel: "Schließen",
    connecting: "Wacht auf…",
    yourTurn: "Erzähl einfach — ich höre zu",
    listening: "…",
    type: "tippen",
    finish: "fertig",
    send: "Senden",
    typePlaceholder: "Oder schreib es stattdessen…",
    errors: {
      NO_GEMINI_KEY: "⚠ Kein Sprachschlüssel auf dem Server. GEMINI_KEY setzen und neu starten.",
      MIC_DENIED: "⚠ Mikrofonzugriff wurde blockiert. In den Browsereinstellungen erlauben.",
      UPSTREAM: "⚠ Der Sprachdienst ist ausgefallen. Noch mal versuchen.",
      SOCKET: "⚠ Der Sprachdienst war nicht erreichbar.",
      CLOSED: "⚠ Die Verbindung wurde beendet. Noch mal versuchen.",
    },
  },

  paywall: {
    title: "Dream Rushes Plus",
    close: "Schließen",
    headline: "Deine Träume, als Filme.",
    lede: "Schreiben, Sprache und alles im Schlaf-Tab bleiben gratis. Credits gibt es nur für das, was ein Renderer zeichnen muss.",
    tabSub: "Abonnieren",
    tabPack: "Credits kaufen",
    periodName: { month: "Monatlich", year: "Jährlich" },
    packName: (n) => `${n} Credits`,
    per: { month: "pro Monat", year: "pro Jahr" },
    oneTime: "einmalig",
    save: (pct) => `${pct} sparen`,
    creditsPerMonth: (n) => `${n} Credits jeden Monat`,
    creditsOnce: (n) => `${n} Credits, verfallen nie`,
    yield: (credits, five, three) =>
      `${credits} Credits — etwa ${five} Träume mit 5 Bildern, oder ${three} mit 3. Ein Film kostet so viel wie 5 Bilder.`,
    included: "Immer inklusive, gratis",
    chips: [
      "Unbegrenztes Journal", "Sprachaufnahme", "KI-Umschreiben",
      "Einschlafgeräusche", "Runterkommen-Checkliste", "Luzid-Anleitung", "Traumsymbole",
    ],
    freeNote: "Nur Bild- und Filmerzeugung kosten Credits — das ist der Teil, für den wir einen Renderer bezahlen.",
    cta: "Weiter",
    notYet: "⚠ Zahlung ist noch nicht angebunden — das ist eine Vorschau der Pakete.",
    balance: (n) => `Du hast aktuell ${n} Credits.`,
  },

  errors: {
    storageFull: "⚠ Speicher voll — alte Einträge oder Referenzfotos löschen.",
    unexpected: "Unerwartete Antwort vom Server.",
    serverStatus: (s) => `Server antwortete mit ${s}.`,
  },
};
