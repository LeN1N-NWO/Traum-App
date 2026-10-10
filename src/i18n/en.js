/* All user-facing copy lives here.
 *
 * English is the app's language. German is planned as a second language, not
 * a replacement — when it lands, this file gets a sibling (de.js) and
 * src/i18n/index.js picks between them. Keeping every string here is what
 * makes that a small change instead of a hunt through every component.
 *
 * Rule: no user-visible text anywhere else in src/.
 */
export default {
  tabs: {
    home: "Home",
    journal: "Journal",
    symbols: "Symbols",
    profile: "Profile",
    sleep: "Sleep",
    dream: "Dream",
    newDream: "Record a new dream",
  },

  splash: {
    loading: "Dream Rushes is loading",
  },

  /* When the app logic doesn't answer (13.09.2026, Anton: "endless loading"
     on the avatar) — texts shown WITHOUT the bridge. */
  offline: {
    title: "This isn't loading",
    hint: "The app isn't getting an answer. Check your connection and try again.",
    devHint: "Development build: are Metro (bun run mobile) and the server (bun run api) running?",
    retry: "Try again",
    close: "Close",
  },

  home: {
    quickRecord: "Record a dream",   // Schnellaktion am App-Symbol (13.09.2026)
    greeting: {
      night: "Still awake",
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Almost dream time",
    },
    title: "What did you dream?",
    lede: "Tell it while it's still warm — half-asleep works best.",
    cta: "Record your dream",
    streak: (n) => `${n} ${n === 1 ? "dream" : "dreams"}`,   // seit 03.10.: die Zahl der Träume, keine Serie
    streakPerk: (n, max) => `Night ${n} of ${max} — the creatures are coming rarer.`,
    streakRisk: "You wrote last night. Tonight keeps the run going — no rush, it holds until you sleep.",
    lastHeading: "Last night",
    menagerieHeading: "Your menagerie",
    menagerieEmpty: "No creatures yet. Every dream you write down leaves one behind.",
    untitled: "Untitled dream",
    renderingLine: "Your dream is being made — take a look",
    soundsShortcut: "Start the sleep sounds",
    /* „Nichts hängengeblieben" — der Knopf sagt, was WAR, nie was fehlt.
       „No dream today" wäre ein Mangel; „nothing stayed" ist eine Nacht wie
       jede andere, nur ohne Fund. */
    blankCta: "Nothing stayed with me",
    blankHint: "Keeps your streak — no dream invented",
    blankDone: "🌙 Noted. The night counts.",
    /* Die Startseite „Deine Nächte" (27.09.). */
    /* Die Startseite „Der Mond von heute Nacht" (27.09.). */
    moonLabel: (phase) => `Last night · ${phase}`,
    articleHeading: "From the research",
    articleMore: "Read",
    streakZero: "Your first dream",
    intentionHeading: "Last night you wanted to dream about",
  },
  /* Der Traum-Vorsatz im Schlaf-Tab (27.09.). */
  /* Dein Sternbild auf der Startseite (28.09.). */
  /* Der Mondring auf der Startseite (03.10.). */
  /* Der Ring auf der Startseite (03.10.): Nächte von Vollmond zu Vollmond,
     in der Mitte der Frosch, oben die Belohnung für den vollen Ring. */
  cycle: {
    chip: "Full ring: your month as a film",
    count: (n) => n === 0 ? "No dreams in this ring yet" : `${n} ${n === 1 ? "dream" : "dreams"} in this ring`,
    left: (n) => `${n} more ${n === 1 ? "night" : "nights"} — then your month becomes a film.`,
    fullTonight: "Last night of the ring — tomorrow your month becomes a film.",
    thread: (label, n) => `Strongest thread: ${label} (${n}×)`,
    milestoneSay: (left, gift) => `${left <= 1 ? "One more dream" : `${left} more dreams`} until ${gift}`,
    /* Der Traum-Ring (03.10. spätabends, dreamRing.js): Plätze wie eine Uhr. */
    /* Die Einführung im leeren Traumfänger (Antons Wunsch 04.10.). */
    intro: [
      "Every filmed dream fills one leaf of your dreamcatcher.",
      "At 3, 6 and 9 a gift waits for you.",
      "When all 12 leaves are full, your dreams become one film.",
    ],
    introCta: "Got it",
    ringCount: (n, ring) => `${n} ${n === 1 ? "dream" : "dreams"} · ring ${ring}`,
    stones: { place: "Aquamarine", scenario: "Amber", creature: "Emerald", person: "Rose quartz", emotion: "Amethyst", none: "Moonstone" },
    nextSlot: (num) => `Your next dream fills spot ${num}`,
    ringFilmTitle: (ring, from, to, motif) => `Ring ${ring} · dreams ${from}–${to}${motif ? ` · ${motif}` : ""}`,
    ringReadyTitle: "Your ring is full — here's your film",
    ringReadyBody: (n) => `Your ${n} dreams as one film.`,
    /* Das große Geschenk oben im Ring (Antons Befund 03.10.: „da kommt
       nichts, wobei das doch das stärkste Geschenk ist"). */
    month: {
      title: "Your month as a film",
      sub: "At full moon, every dream picture in this ring becomes one film — free.",
      when: (n) => (n <= 0 ? "Full moon tonight" : n === 1 ? "Full moon tomorrow" : `Full moon in ${n} days`),
      have: (n, min) => (n >= min ? `${n} dreams inside` : `${n} of ${min} dreams — from ${min} it becomes a film`),
    },
    asleep: "Zzz … tell me a dream and I'll wake up.",
    filmTitle: (month, motif) => motif ? `Your ${month} in dreams · ${motif}` : `Your ${month} in dreams`,
    readyTitle: "Your month as a film is here",
    readyBody: (n) => `${n} dreams from the last ring, as one film.`,
    /* Moonweave (Antons Übergabe 10.10., mobile/src/components/moonweave.tsx):
       ein Blatt je Traum, Geschenke bei 3, 6, 9, der Film bei 12. */
    weave: {
      title: (n) => `Dreamcatcher with ${n} of 12 dreams`,
      collected: "/ 12 dreams collected",
      ring: (r) => `Ring ${r}`,
      firstGift: "Your first gift",
      nextGift: "Your next gift",
      film: "Your collection film",
      distance: (left) => `${left <= 1 ? "One more dream" : `${left} more dreams`} to unlock it.`,
      full: "Twelve dreams. One film, on us.",
      filmMaking: "Your film is being made …",
      filmReady: "Your film is ready.",
      watch: "Watch your film",
      milestone: (n) => `${n} dreams`,
      states: { locked: "Locked", ready: "Ready to open", collected: "Collected", film: "Film unlocked" },
      sealGift: (k) => `Gift ${k} unlocked`,
      sealFilm: "Film unlocked",
      sealRing: "Ring gift unlocked",
      open: (k) => `Open gift ${k}`,
      openRing: "Open your ring gift",
      pending: "You have a gift ready to open.",
      node: (n, state, kind) => `Dream ${n}, ${state}${kind}`,
      nodeStates: { collected: "collected", next: "next dream", empty: "not collected" },
      nodeKinds: { gift: ", gift milestone", film: ", collection film" },
      hint: "Each numbered point holds one dream. Tap to explore.",
      hintEmpty: "Your first filmed dream will fill leaf 1.",
      hintFull: "All twelve dreams collected. Your film is unlocked.",
      tapNext: (leaf) => `Leaf ${leaf} is next. Turn your next dream into a film or Glimpse to fill it.`,
      tapEmpty: (leaf, num) => `Leaf ${leaf} is waiting for dream ${num}.`,
      rewards: "Rewards along your dream collection",
    },
  },
  intention: {
    title: "What would you like to dream about?",
    lede: "Hold one picture in mind as you fall asleep. In the morning we'll ask whether it showed up.",
    placeholder: "the sea house, flying, grandma's kitchen …",
    save: "Keep it for tonight",
    saved: "Tonight's intention",
    clear: "Change",
  },

  /* Der Morgen-Check-in (Mehrwert P2a): eine Frage, drei grobe Stufen —
     beantwortbar, bevor man wach ist. */
  checkin: {
    question: "How did you sleep today?",
    levels: { 1: "rough", 2: "okay", 3: "well" },
    emoji: { 1: "🌑", 2: "🌗", 3: "🌕" },
    thanks: "Noted — sleep and dreams meet in your atlas.",
  },


  /* Die Meilenstein-Leiter hinter der Streak-Pille. Ehrlich: nur, was
     existiert — die Wesen-Rarität steigt wirklich mit der Serie. */
  /* Freunde einladen (03.10.2026, src/lib/invites.js). Platzhalter in {…}
     füllt die native Seite — Funktionen gehen nicht über die Brücke. */
  invite: {
    title: "Invite friends",
    cardTitle: "Invite friends",
    cardHint: "When a friend buys, a dream is on us.",
    hero: "Share your dreams. Dream for free.",
    lede: "When someone you invited buys credits or a subscription for the first time, we give you dreams. One dream is a whole film.",
    codeLabel: "Your code",
    share: "Share invitation",
    shareMessage: "I keep my dreams as films with Dream Rushes. Come along: {link}",
    rewardsTitle: "What you get",
    friendBuys: "Your friend buys",
    films: { one: "1 dream", many: "{n} dreams" },
    products: { "pack-s": "Pack S", monthly: "Monthly", "pack-m": "Pack M", "pack-l": "Pack L", "pack-xl": "Pack XL", yearly: "Yearly" },
    friendsTitle: "Your invitations",
    empty: "No one yet. Share your code with someone who dreams too.",
    status: { joined: "joined", bought: "bought — your gift arrives on {date}", rewarded: "✦ {films} for you", rejected: "doesn't count (refunded)" },
    cap: "{n} of {cap} gifts this month",
    rules: [
      "Only your friend's first real purchase counts — no free codes.",
      "Your gift arrives 14 days after the purchase, if it wasn't refunded.",
      "At most 5 gifts a month. Gifted credits are valid for 30 days.",
      "Your friend gets nothing extra from the code — it only connects your accounts.",
    ],
    haveCode: "Got an invitation code?",
    codePlaceholder: "Paste code or link",
    connect: "Connect",
    connected: "Connected — glad you're here.",
    errors: {
      invalid: "That isn't a valid code.",
      unknown: "This code doesn't exist.",
      own: "That's your own code.",
      // Wer dich eingeladen hat, kannst du nicht zurück einladen (03.10.2026).
      mutual: "You invited this friend — they can't invite you back.",
      already: "You're already connected to an invitation.",
      device: "An invitation was already connected on this device.",
      signin: "Sign in to connect the code.",
      offline: "Can't reach us right now. Try again in a moment.",
    },
    signin: "Sign in to get your code.",
    preview: "Preview — real codes arrive with the account server.",
  },

  streakBoard: {
    title: "Your dreams",
    /* Die Mini-Geschenke (Antons Ja 22.08.). Der Ton ist bewusst nüchtern:
       ein Credit ist ein Bild, keine Konfetti-Kanone. */
    /* Seit 03.10. (Antons Ansage „ein Credit klingt nach gar nichts"):
       Geschenke heißen nach dem, was man damit macht. */
    gift: (n, label) => `✦ Dream no. ${n} — your gift: ${label}`,
    giftBadge: (credits) => `+${credits} ${credits === 1 ? "credit" : "credits"}`,
    giftKinds: {
      glimpse: () => "A free Glimpse",
      film: () => "Your first dream film",
      credits: (n) => `${n} credits`,
      month: (n) => `${n} credits — a whole month`,
      ring: () => "A film of your 12 dreams",
      /* Die großen Geschenke auf den vollen Ringen (10.10.) — nur nach einem Kauf; sonst bei 48 zehn Glimpses. */
      ringFilm: () => "A dream film, on us",
      ringFilms: () => "Two dream films, on us",
      bloom: (n) => `${n} credits — your full bloom`,
      bloomGlimpses: (n) => `${n} free Glimpses`,
    },
    ringPlus: (film, bonus) => `${film} + ${bonus}`,
    giftShort: { glimpse: "Glimpse", film: "Film", credits: (n) => `+${n}`, month: (n) => `+${n}`, ringFilm: "Film", ringFilms: "2 films", bloom: (n) => `+${n}`, bloomGlimpses: (n) => `${n} Glimpses` },
    giftWorth: (n) => `worth ${n} ${n === 1 ? "credit" : "credits"}`,
    /* Kurz und auf einen Blick (Antons Befund 03.10.: „ein bisschen
       kompliziert … muss kompakter und schneller verständlich sein"):
       Titel, ein Satz, Fortschritt — mehr nicht. */
    giftSheet: {
      left: (n) => (n <= 1 ? "With your next dream" : `${n} more dreams`),
      progress: (have, need) => `${have} / ${need}`,
      subs: {
        glimpse: "Your next dream as a Glimpse — free.",
        film: "One dream as a whole film — on us.",
        credits: "For Glimpses or films, your choice.",
        month: "As much as a whole month of subscription.",
        ring: "When the ring is full, its 12 dreams become one film — free.",
        ringFilm: "Credits for one 15-second film — any dream you like.",
        ringFilms: "Credits for two 15-second films — any dreams you like.",
        bloom: "Four rings, 48 dreams. For Glimpses or films, your choice.",
        bloomGlimpses: "Ten Glimpses that stay until you use them.",
      },
      rule: "Every dream with a Glimpse or film counts.",
      valid: "Valid 30 days.",
      keeps: "Yours until you use it.",
      tapToOpen: "Tap to open",
      openTitle: (n) => `Dream no. ${n}!`,
      expires: (date) => `Valid until ${date}.`,
      redeem: { glimpse: "Make a Glimpse", film: "Make your film", credits: "Use it now", month: "Use it now", ringFilm: "Make a film", ringFilms: "Make a film", bloom: "Use it now", bloomGlimpses: "Make a Glimpse" },
      later: "Later",
      close: "Close",
    },
    /* Die Schlummernacht — der Ton ist bewusst entlastend, nicht mahnend:
       Sie ist eingesprungen, es ist nichts passiert, weiter geht's. */
    snoozeUsed: (n) => (n === 1
      ? "🌙 A snooze night stepped in — your streak is safe."
      : `🌙 ${n} snooze nights stepped in — your streak is safe.`),
    snoozeTitle: (n) => (n === 1 ? "1 snooze night" : `${n} snooze nights`),
    snoozeNext: (n) => (n === 1
      ? "One more night earns another one."
      : `${n} more nights earn another one.`),
    snoozeFull: "Your shelf is full — a missed night costs you nothing.",
    nights: (n) => (n === 1 ? "dream" : "dreams"),
    next: (n) => (n === 1 ? "1 more dream to your next gift." : `${n} more dreams to your next gift.`),
    done: "Every milestone reached. You are the calendar now.",
    rung: (n) => `${n} dreams`,
    rewards: {
      warm: "Rarer creatures begin to stir in your menagerie.",
      epic: "Epic creatures come within reach.",
      steady: "Peak odds — from here every creature rolls with your full bonus.",
      legendary: "Legendary territory: thirty dreams, told.",
      keeper: "Keeper of dreams — few ever get here.",
      hundred: "One hundred dreams. Your journal is a book now.",
    },
    note: "Every dream with a Glimpse or a film counts — whatever the day. A dream in words only doesn't.",
  },

  /* Die Mondphasen (moon.js). Ortsunabhängig — die Phase ist überall

     dieselbe; nur Auf- und Untergang wären ortsgebunden. */

  moon: {

    title: "Moon",

    tonight: "Tonight",

    phases: {

      new: "New moon", waxingCrescent: "Waxing crescent", firstQuarter: "First quarter",

      waxingGibbous: "Waxing gibbous", full: "Full moon", waningGibbous: "Waning gibbous",

      lastQuarter: "Last quarter", waningCrescent: "Waning crescent",

    },

    lit: (p) => `${p}% lit`,

    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],

  },

  journal: {
    viewList: "Show as a list",
    viewDeck: "Show as cards",
    atlas: "Dream atlas",
    atlasLede: "Recurring symbols, moods, your month",
    atlasShort: "Symbols & moods",
    atlasSoon: "From your 2nd dream",
    menagerieLede: "One creature for every dream you wrote down.",
    menagerieCount: (n) => (n === 1 ? "1 creature" : `${n} creatures`),
    atlasEmpty: "Your patterns appear once a few dreams are in.",
    atlasMonth: "This month",
    atlasDreamsN: (n) => (n === 1 ? "dream" : "dreams"),
    atlasSymbols: "Recurring symbols",
    atlasMoods: "Moods",
    /* Die Schlaf-Kachel. atlasSleepAvg bekommt das WORT aus checkin.levels,
       nicht die Zahl — dieselbe Sprache wie die Morgenfrage, sonst antwortet
       man in Worten und liest eine Note ab. */
    atlasSleep: "Sleep",
    calBlank: "Nothing stayed that night",
    atlasSleepAvg: (word) => `Mostly ${word}`,
    atlasSleepNote: (nights, avg) =>
      `${nights} ${nights === 1 ? "night" : "nights"} noted · ${avg.toFixed(1)} of 3`,
    atlasSleepEmpty: "Answer the morning question on your home screen — sleep and dreams meet here.",
    /* Der Wiederkehr-Befund im Traum-Detail. Kurz und klein gesetzt wie die
       anderen Etiketten; die Zahl steht auf der Marke selbst.

       ⚠ „other", nicht „earlier": recurrenceFor zählt ALLE anderen Träume.
       Beim frisch geschriebenen Traum sind das die früheren — beim Öffnen
       eines alten Eintrags aber auch spätere, und „2 frühere Träume" wäre
       dann schlicht gelogen. */
    recurrenceTitle: "Turns up again",
    recurrenceIn: (n, what) => `${what} — in ${n} other ${n === 1 ? "dream" : "dreams"}`,
    reflectTitle: "Reflection",
    reflectCta: "What might this dream be saying?",
    reflectHint: "One possible reading, drawn from your own journal — free",
    reflectNote: "A mirror, not an oracle: one way of reading it, offered gently.",
    library: "Your cast",
    libraryLede: "Who turns up in your dreams, most often first.",
    /* The cast at the core (Anton, 13.09.2026): top of the profile. */
    libraryWhy: "People, animals, places and things from your life. The more you add, the more your dreams look like yours.",
    /* Die Besetzungsliste. Die Zahl steht getrennt vom Wort, weil sie
       in Serife gesetzt wird — deshalb liefert castDreamsN NUR das
       Wort, so wie creditsN und yieldFilms es auch tun. */
    castDreamsN: (n) => (n === 1 ? "dream" : "dreams"),
    castNever: "not in a dream yet",
    castNew: "Add a figure",
    /* Besetzung im Abspann-Stil mit Casting-Vorschlägen (Antons Wahl 10.10.). */
    castStarring: "Starring",
    castInAll: (n) => (n === 0 ? "in every dream to come" : n === 1 ? "in your first dream" : `in all ${n} dreams`),
    castSuggestTitle: "Showed up in your dreams",
    castSuggestHint: "No face yet — add one and they'll look like themselves.",
    castSuggestAdd: "Add",
    /* Neue Figur: erst das Foto, dann der Dialog mit dem Foto darin (Antons Wunsch 10.10.: „weniger Schritte"). */
    castPhoto: { take: "Take a photo", library: "Choose from library", none: "Without a photo", cancel: "Cancel" },
    castSuggestIn: (n) => `in ${n} ${n === 1 ? "dream" : "dreams"}`,
    castEmptyCard: { person: "Someone from last night?", pet: "A pet of yours?", place: "A place you dream of", object: "A thing that keeps coming back" },
    libraryCount: (n) =>
      n === 0 ? "Nobody yet — add the faces your dreams should use"
              : `${n} ${n === 1 ? "entry" : "entries"} · people, pets, places`,
    title: "Journal",
    count: (n) => (n === 1 ? "1 dream" : `${n} dreams`),
    search: "Search your dreams…",
    searchLabel: "Search your dreams",
    empty: "No dreams written down yet.",
    emptySearch: "Nothing found.",
    untitled: "Untitled dream",
    close: "Close",
    referencesUsed: "Reference photos used:",
    delete: "Delete entry",
    deleted: "Entry deleted",
    menu: "More actions",
    edit: "Edit text",
    editing: "Editing",
    save: "Save",
    cancelEdit: "Discard changes",
    edited: "Changes saved",
    correct: "Fix spelling & grammar",
    rewrite: "Rewrite it better",
    elaborate: "Work out the storytelling",
    working: "Working on it…",
    refineTitle: "Here is the reworked version",
    refineLede: "Your current text is kept until you accept this.",
    before: "Now",
    after: "Reworked",
    keep: "Keep what I have",
    accept: "Use this version",
    share: "Share",
    sharing: "Preparing…",
    shared: "Shared",
    shareUnsupported: "Sharing is not available here — the files were downloaded instead.",
    shareNothing: "Nothing to share yet — this dream has no images.",
    noCredits: "Not enough credits. Top-up is coming soon.",
    original: "Originally written",
    showOriginal: "Show what I first wrote",
    hideOriginal: "Hide the original",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    actRewrite: "Rewrite",
    actEdit: "Edit",
    actShare: "Share",
    /* Your own recording on the dream (Anton, 13.09.: "Your recording" was too little). */
    recordingTitle: "How you told it",
    recordingHint: "Your voice, right after waking",
    /* The share card (13.09.2026). */
    shareCard: "Share as a card",
    shareCardCta: "Share card",
    shareCardFooter: "Dreamt with Dream Rushes",
    // The three refine modes, as offered in RefineSheet. Each hint says
    // what the mode will NOT do — that is the part people cannot guess,
    // and picking the wrong one costs a rewritten dream to find out.
    refinePickTitle: "How should I rewrite it?",
    refinePickLede: "Your version is kept either way — nothing is replaced until you accept it.",
    correctHint: "Spelling and grammar only. Not a word of your voice changes.",
    rewriteHint: "The same dream, told better. Nothing added, nothing left out.",
    elaborateHint: "Richer detail and a clearer arc — without inventing anything new.",
    filmRendering: "Your film is still rendering — it lands here when it's done.",
    filmArrived: "✦ Your film is ready",
    /* Hintergrund-Rendern (21.08.): die Kachel eines Traums, dessen
       Bilder noch unterwegs sind, und der Toast, wenn sie ankommen. */
    /* Der Ausweg, wenn das Hauptmodell einen Traum ablehnt. Bewusst
       „another model" und nicht „the one that allows it": Nano Banana ist
       bei geschuetzten Figuren anders streng, nicht weniger — hier wird
       nichts versprochen. Der Preis steht im Knopf, weil er hoeher ist. */
    /* Der Knopf, der die URSACHE anfasst — und deshalb der erste ist.
       Gratis, weil Textarbeit in dieser App immer gratis ist: Fuer einen
       Fehler Geld zu nehmen, den unser eigenes Modell verursacht hat, waere
       die falsche Reihenfolge. */
    fixNames: "Let AI replace the name — free",
    fixNamesTitle: "Same dream, without the name",
    fixNamesLede: "The figure is described instead of named. Nothing else was changed — "
      + "check it, then create the images.",
    acceptAndMake: "Use this and create the images",
    /* Der stille Nebenknopf. „Anyway", weil unveraendert noch einmal senden
       garantiert dieselbe Ablehnung bringt — das soll man ihm ansehen. */
    tryAgainAnyway: "Send it again unchanged",
    tryOtherModel: (n) => `Try another model — ${n} credits`,
    renderingTile: "Your dream is being made — you'll get a note when it's ready.",
    dreamReady: (title) => (title ? `✦ “${title}” is ready` : "✦ Your dream is ready"),
    sceneReady: (n) => `✦ Scene ${n} is in`,
    imagesRefunded: (n) => (n === 1
      ? "1 image didn't come through — the credit is back in your balance."
      : `${n} images didn't come through — the credits are back in your balance.`),
    makeLede: "No pictures yet. Want some?",
    makeImages: "Make the images",
    makeFilmAgain: "Another take",
    takesLabel: "Takes of this dream",
    takeUnknown: "Take",
    /* Unter dem Titel: was es ist und in welchem Stil (10.10.) — „Film · Claymation". */
    madeFilm: "Film",
    makeFilmLede: "Now bring it to life.",
    filmPending: "Making your video — hang tight",
    imagesPending: "Making your images — hang tight",
    makeFilm: "Bring it to life",
    calendar: "Dream calendar",
    calLabel: "Days with a recorded dream — tap one to open it",
    calPrev: "Previous month",
    calNext: "Next month",
    calMonths: ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"],
    calWeekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    calDreamt: (day, n) =>
      n === 1 ? `Day ${day}: open this dream` : `Day ${day}: ${n} dreams`,
    calSeveral: (n) => `${n} dreams that night`,
  },

  symbols: {
    categories: { place: "Places", scenario: "Scenarios", creature: "Creatures", person: "People", emotion: "Feelings" },
    byId: {
      water: { label: "Water",
        meaning: "Water is usually read as feeling — its depth, its calm, its force. Rising water often shows up when something emotional feels bigger than expected." },
      home: { label: "House & home",
        meaning: "Houses tend to stand for the self, and rooms for parts of it. Rooms you did not know were there are a common motif in times of change." },
      city: { label: "City & streets",
        meaning: "Cities often carry the feeling of being among others — anonymous, carried along, or lost in the pattern." },
      forest: { label: "Forest & wilderness",
        meaning: "Wild places often appear when something is unmapped: a decision without a clear path, or a part of life without instructions." },
      sky: { label: "Sky & space",
        meaning: "Vast space tends to show up alongside perspective — the sense of being small, or of seeing something from far enough away to understand it." },
      falling: { label: "Falling",
        meaning: "One of the most common dreams there is. Often connected to control — or the moment of noticing you have less of it than you thought." },
      flying: { label: "Flying",
        meaning: "Flying is frequently reported during stretches of freedom or relief, and sometimes as the wish for distance from something on the ground." },
      chase: { label: "Being chased",
        meaning: "Chase dreams are widely linked to avoidance — something that wants attention and is not getting it yet. What follows you matters less than that it follows." },
      missing: { label: "Missing something",
        meaning: "Missing a train or a flight is a classic during transitions — a new job, a move, a decision. It often pairs with the fear of a window closing." },
      lost: { label: "Being lost",
        meaning: "Getting lost tends to surface when a direction in waking life is genuinely unclear, rather than merely difficult." },
      exposed: { label: "Exposed",
        meaning: "Being seen unprepared is one of the most reported dreams. It usually says more about the fear of judgement than about any real lack." },
      teeth: { label: "Teeth falling out",
        meaning: "Strikingly common across cultures. Often connected to how one is perceived, to speech, or to a stretch of feeling less capable than usual." },
      animal: { label: "Animals",
        meaning: "Animals often carry the instinctive, unreasoned part of a situation — what you feel about it before you have argued yourself into a position." },
      monster: { label: "Monsters & shadows",
        meaning: "Shapes that cannot be looked at directly are frequently read as something known but not yet named." },
      family: { label: "Family",
        meaning: "Family members in dreams often stand less for the actual person than for what they represent to you — a rule, a comfort, an expectation." },
      stranger: { label: "Strangers",
        meaning: "Unknown figures are commonly read as parts of oneself that have not been introduced yet." },
      partner: { label: "Love & partners",
        meaning: "Romantic figures tend to appear around closeness and distance generally, not only around romance." },
      fear: { label: "Fear",
        meaning: "Fear in a dream is worth noting on its own — the same scene with and without it means different things." },
      joy: { label: "Joy & warmth",
        meaning: "Good feelings are as informative as bad ones, and are far more easily forgotten by morning." },
      grief: { label: "Grief & loss",
        meaning: "Death in dreams is rarely about dying. It much more often marks an ending of some other kind — a role, a phase, a version of oneself." },
    },
    title: "Symbols",
    subtitle: "Motifs that keep coming back",
    empty: "No symbols yet. Write down a few dreams and they'll show up here.",
    close: "Close",
    disclaimer: "A common reading, offered for reflection — not a diagnosis.",
    occurrences: (n) => (n === 1 ? "In 1 dream" : `In ${n} dreams`),
    untitled: "Untitled dream",
  },

  /* Namen und Beschreibungen der Bildstile — gleiche Bauart wie
   * symbols.byId: styles.js behält die englischen Render-Prompts (die
   * sieht nie ein Mensch), die Sprachdateien tragen, was auf der Kachel
   * und hinter dem ⓘ steht. Vorher standen die Stilnamen englisch fest
   * verdrahtet im UI — derselbe Fehlertyp wie beim Traumatlas (21.08.). */
  styles: {
    byId: {
      ultrareal: { label: "Ultra Real",
        info: "Like a still from a quiet, expensive film: one honest light source, deep natural shadows, nothing ornamental. Pick it when the dream should look like it actually happened." },
      noir: { label: "Film Noir",
        info: "Hard black-and-white, venetian-blind shadows, wet streets, drifting smoke — the 1940s detective look. Pick it for dreams with secrets, pursuit or rain in them." },
      dreamlike: { label: "Dreamlike",
        info: "Soft haze, violet-blue moonlight, edges that dissolve where the light fades. The house style — made for dreams that felt gentle, floating or half-remembered." },
      romantic: { label: "Romantic",
        info: "Golden-hour backlight, warm amber and rose, tender close framing. Pick it for dreams about people you love — or wanted near." },
      dark: { label: "Dark",
        info: "Cold, crushed shadows and looming spaces, a single pale light in the dark. Pick it for nightmares and dreams that felt like a thriller." },
      surreal: { label: "Surreal",
        info: "Impossible scale, saturated colour, everything unnervingly sharp — calm and wrong at once, like a Magritte painting. Pick it when the dream broke the rules of physics." },
      nostalgic: { label: "Nostalgic",
        info: "Faded 35mm film, warm washed-out colour, the light of an old summer photograph. Pick it for dreams about childhood, old places, people from before." },
      adventurous: { label: "Adventure",
        info: "Wide epic vistas, dramatic sunlight, dust in the air — the big-screen expedition look. Pick it for dreams where you travelled, climbed or ran toward something." },
      // The craft styles — the dream is made of a material, not photographed.
      ink: { label: "Ink",
        info: "Sumi-e ink wash on rice paper: bold black brushstrokes, grey washes, mist left as bare paper, one red or gold accent. Pick it for dreams that were quiet, vast or violent in a single stroke." },
      clay: { label: "Claymation",
        info: "Hand-sculpted modelling clay with fingerprints still in it, wool hair, miniature sets built from wood and felt — stop-motion photographed one frame at a time. Pick it for dreams with warmth and a bit of absurdity." },
      goldenage: { label: "Old Animation",
        info: "A late-1930s hand-painted animated feature: inked cels over gouache backgrounds, a faded early-Technicolor palette, film grain from real celluloid. Pick it for dreams that felt like a storybook." },
      fantasyanime: { label: "Fantasy Anime",
        info: "Hand-painted forests, ruined temples and moonlit plains, flowing hair and capes, luminous hand-drawn magic — the fantasy OVA look of the nineties. Pick it for dreams with quests, swords or spells in them." },
      oilpaint: { label: "Oil Painting",
        info: "Every surface wears thick painted texture — brushstrokes in the skin, painted highlights in the eyes — under theatrical single-source light. Pick it for heavy, serious dreams that deserve a canvas." },
      marker: { label: "Marker Doodle",
        info: "Felt-tip marker on ordinary paper: bleeding ink, colour outside the lines, paper fibres showing. Pick it for dreams that were silly, childlike or drawn in a hurry." },
      actionfigure: { label: "Action Figure",
        info: "Small articulated plastic toys come alive inside a completely real house — visible joints, painted eyes, table edges like cliffs. Pick it for dreams where you were tiny, or the world was enormous." },
      marionette: { label: "Puppet Theatre",
        info: "Carved wooden marionettes on a gilded miniature stage, strings visible, painted canvas backdrops, warm footlights from below. Pick it for dreams that felt staged, or watched from the audience." },
      papercut: { label: "Paper Cut-Out",
        info: "Layers of real torn and cut paper, each on its own plane with a small shadow between them — a storybook diorama in ochre, rust and navy. Pick it for dreams with landscapes, journeys and simple shapes." },
      papiermache: { label: "Papier-mâché",
        info: "Newspaper pulp, cardboard, tissue and glue under matte paint — lumpy, asymmetric, handmade fantasy where even the magic is cut from paper. Pick it for dreams that were crooked and charming." },
      screenprint: { label: "Vintage Poster",
        info: "A mid-century screen print in five inks: bold silhouettes, halftone dots, colours slightly out of register on heavy paper. Pick it for dreams that were one striking image rather than a story." },
    },
  },

  dreamer: {
    title: "What you told me",
    retake: "Tell me again",
    recall: "Dream recall",
    lucid: "Lucid dreaming",
    goal: "What brings you here",
    themes: "Keeps coming back",
    signs: {
      aries: "Aries",
      taurus: "Taurus",
      gemini: "Gemini",
      cancer: "Cancer",
      leo: "Leo",
      virgo: "Virgo",
      libra: "Libra",
      scorpio: "Scorpio",
      sagittarius: "Sagittarius",
      capricorn: "Capricorn",
      aquarius: "Aquarius",
      pisces: "Pisces",
    },
    recallValues: {
      nightly: "Almost every night",
      weekly: "A few times a week",
      rarely: "Rarely",
      "almost-never": "Almost never",
    },
    lucidValues: {
      "never-heard": "New to it",
      curious: "Curious",
      tried: "Tried it",
      practicing: "Practising",
    },
    goalValues: {
      remember: "Remembering more",
      understand: "Understanding them",
      create: "Turning them into films",
      "sleep-better": "Sleeping better",
      nightmares: "Getting out from under bad dreams",
    },
    sleep: "Usually sleeps",
    sleepValues: {
      "under-6": "Under 6 hours",
      "6-7": "6 to 7 hours",
      "7-8": "7 to 8 hours",
      "8-9": "8 to 9 hours",
      "over-9": "Over 9 hours",
    },
    time: "Time for it",
    timeValues: {
      5: "5 minutes a day",
      10: "10 minutes a day",
      20: "20 minutes a day",
      30: "30 minutes a day",
      "60plus": "An hour or more",
    },
  },
  profile: {
    title: "Profile",
    settings: "Settings",
    voiceSetting: "Assistant voice",
    voiceSettingHint: "Which voice talks to you",
    /* Face-ID-Schutz und Sprachwahl in den Einstellungen (Antons Ansage
       22.09.2026). Der Sperr-Bildschirm selbst trägt englische Rückfälle
       im Code (privacy-gate.tsx), weil er VOR der Brücke steht. */
    privacyLock: "Require Face ID",
    privacyLockHint: "Lock the app. Opening it needs Face ID or your passcode.",
    privacyLockNoBio: "Set up Face ID or a passcode in the iOS settings first.",
    privacyUnlock: "Unlock",
    privacyLocked: "Your dreams are locked.",
    /* Konto-Löschung in der App (Apple 5.1.1(v), Antons Ansage 23.09.2026). */
    deleteAccount: "Delete account",
    deleteAccountHint: "Removes your account, its profile, your backed-up dreams and your images, films and recordings from our server. Dreams on this device stay.",
    deleteAccountConfirmTitle: "Delete your account?",
    deleteAccountConfirmText: "This cannot be undone. Your account, its profile, the dreams backed up with it and your images, films and recordings are removed from our server. Dreams saved on this device stay yours. A running subscription is billed by Apple — cancel it under Manage subscription.",
    deleteAccountGo: "Delete",
    deleteAccountDone: "Your account is deleted.",
    deleteAccountFailed: "That didn't work. Check your connection and try again.",
    deleteAccountAppleTitle: "One more step with Apple",
    deleteAccountAppleText: "You signed in with Apple, so Apple asks you to confirm once more. That lets us disconnect Dream Rushes from your Apple ID before your account is deleted.",
    deleteAccountAppleGo: "Continue",
    languageSetting: "Language",
    languageSettingHint: "The language of the app",
    withdrawConsent: "Withdraw consent",
    withdrawConsentHint: "Nothing leaves your device until you agree again",
    manageSubs: "Manage subscription",
    manageSubsHint: "Change or cancel it in your Apple account",
    account: "Account",
    accountNone: "Not signed in",
    accountSignedIn: "Signed in as",
    accountSignedInNoEmail: "Signed in",
    signIn: "Sign in",
    signOut: "Sign out",
    // Rückfrage vor dem Abmelden — ein versehentlicher Tipp passiert zu leicht (03.10.2026).
    signOutConfirmTitle: "Sign out?",
    signOutConfirmText: "Your dreams stay safe on this phone and come back when you sign in again. Until then, nobody else using this phone can see them.",
    done: "Done",
    credits: "credits",
    creditsSoon: "Top-up coming soon",
    you: "You",
    meSet: "Tap to change your photo or name",
    meEmpty: "Add a photo so dreams can put you in them",
    addPhoto: "Add your photo",
    changePhoto: "Change your photo",
    statDreams: "dreams",
    statStreak: "filmed",
    people: "People",
    pets: "Pets",
    places: "Places",
    objects: "Things",
    new: "New",
    deleteLabel: (tag) => `Delete @${tag}`,
    editLabel: (tag) => `Edit @${tag}`,
    referenceFor: (tag) => `Reference photo for @${tag}`,
    removed: (tag) => `@${tag} removed`,
  },

  avatarDialog: {
    titleFor: { person: "Add a person", pet: "Add a pet", place: "Add a place", object: "Add a thing" },
    kindLabel: "What is this?",
    kindFor: { person: "Person", pet: "Animal", place: "Place", object: "Thing" },
    delete: "Delete",
    drawFromDesc: "Draw them from your description",
    drawingNow: "Drawing…",
    drawHint: "One reference image, so they look the same in every picture",
    editTitleFor: { person: "Edit person", pet: "Edit pet", place: "Edit place", object: "Edit thing" },
    meTitle: "This is you",
    nameLabel: (tag) => `Name (becomes @${tag})`,
    photoHint: "Two photos give the best likeness: one close-up of the face, one full body. The face photo is required, the body photo is optional.",
    photoLabelClose: "Face photo",
    photoLabelBody: "Full-body photo (optional)",
    photoBodyAdd: "Add a full-body photo",
    photoBodyWhy: "It is what tells the renderer your height and build.",

    photoLabel: "Reference photo",
    photoAdd: "Add a photo",
    photoTake: "Take a photo",
    photoReplace: "Replace the photo",
    photoRemove: "Remove photo",
    descLabel: "Describe them",
    descLabelOptional: "Describe them (optional)",
    descLabelMe: "Describe yourself",
    descLabelMeOptional: "Describe yourself (optional)",
    descPlaceholder: "tall, dark curly hair, always in a green coat",
    descPlaceholderFor: { person: "tall, dark curly hair, always in a green coat", pet: "small black dog, one white ear", place: "blue wooden house by a lake, red door", object: "old red car with a dented bonnet" },
    previewAlt: "Preview of the selected photo",
    privacy: "This photo is sent to fal.ai when a dream is rendered.",
    cancel: "Cancel",
    save: "Save",
    saveChanges: "Save changes",
    needName: "⚠ Please use letters or numbers for the name.",
    needPhotoOrDesc: "⚠ Add a photo or describe them — the AI needs one of the two.",
    needPhotoOrDescHint: "Add a photo or a description. Without either there is nothing to draw from.",
    /* Confirmation PER PHOTO (Anton, 13.09.2026): responsibility sits with
       the person uploading — as on Higgsfield or Runway — and the app has
       them say so for every photo. */
    consentFor: {
      me: "This is me in the photo.",
      person: "I may use this photo: the person in it has agreed.",
      pet: "The photo is mine, or I'm allowed to use it.",
      place: "The photo is mine, or I'm allowed to use it.",
      object: "The photo is mine, or I'm allowed to use it.",
    },
    consentSmall: "No celebrities, no children without their parents' permission, nobody who hasn't agreed. You are responsible for what you upload — that's in the Terms of Use.",
    needConsent: "⚠ First confirm that you may use this photo.",
    /* Photo check (13.09.2026): right after the tick, in the background. */
    checking: "Checking the photo …",
    checkOk: "Photo checked — it works.",
    checkUnavailable: "Can't check right now. You can save; it will be checked when you create a film.",
    checkBlockedSave: "This photo won't work — pick another one or remove it.",
    checkReasons: {
      celebrity: "This looks like a well-known person. We can't use photos like that.",
      minor: "There seems to be a child in this photo. We can't put children into dreams.",
      explicit: "This photo breaks the film service's content rules.",
      noface: "No face can be seen in this photo. Use a close-up.",
      manyfaces: "There are several people in this photo. Use one that shows only this person.",
      realface: "The film service won't accept this face without the person's own approval.",
      provider: "The film service rejects this photo.",
    },
    exists: (tag) => `⚠ @${tag} already exists.`,
    created: (tag) => `@${tag} added`,
    saved: (tag) => `@${tag} updated`,
    readFailed: "⚠ Could not read that photo.",
  },

  tagCard: {
    label: (tag) => `About @${tag}`,
    categories: { person: "Person", pet: "Pet", place: "Place", object: "Thing" },
    photoOnly: "No description — the photo is used on its own.",
    close: "Close",
  },

  /* Reminders, native (13.09.2026). Logic in src/lib/reminders.js,
     scheduling in mobile/src/lib/notifications.ts. */
  /* Knowledge (13.09.2026) — Anton's mission: "We spend so much time asleep
     and barely study it." Cards with source, limits and one line for your
     own morning. The website uses the same cards. */
  knowledge: {
    mission: "We sleep for a third of our lives. Research is only beginning to understand what happens inside us while we do.",
    lede: "This is where we collect what the evidence shows — with the source, and honest about how certain it is.",
    all: "All",
    why: "What it means for you",
    source: "Source",
    open: "Open the study",
    disclaimer: "Knowledge, not a diagnosis and not medical advice. If nightmares or sleep problems weigh on you, talk to a doctor.",
    categories: { klartraum: "Lucid dreams", gedaechtnis: "Memory", gehirn: "Brain", albtraum: "Nightmares", kreativitaet: "Creativity", schlaf: "Sleep", gesellschaft: "Society" },
    confidence: { solide: "solid", "vorläufig": "preliminary" },
    /* 18 Karten, jede an der Primärquelle geprüft (Recherche 13./14.09.2026,
       docs/plans/2026-09-14-recherche-wissen-karten.md). Neue Karten nur mit
       geprüfter DOI, Grenzen und Sicherheit. */
    cards: [
      { id: "raetsel-im-remtraum", category: "kreativitaet", year: 2026, journal: "Neuroscience of Consciousness", confidence: "vorläufig",
        title: "People who dreamed of a puzzle solved it more often",
        text: "20 people with lucid dreaming experience tried tricky puzzles before sleep, each with its own soundtrack; during REM sleep the team played the sounds of half of the unsolved puzzles. 75% reported dreams containing puzzle fragments, and puzzles that showed up in dreams were solved more often the next morning (42% versus 17%). Limits: a small lab study with practised dreamers, and curiosity about a particular puzzle could drive both the dreaming and the solving.",
        why: "If a problem is on your mind, note whether it turns up in your dreams at night. Over time your journal shows which open questions your nights pick up.",
        cite: "Konkoly, K. R. et al., 2026", url: "https://doi.org/10.1093/nc/niaf067" },
      { id: "traeumen-in-allen-phasen", category: "schlaf", year: 2025, journal: "Nature Communications", confidence: "solide",
        title: "We don't only dream in REM sleep",
        text: "An international research consortium pooled 20 datasets with 505 participants and 2,643 night-time awakenings into the largest open collection of sleep EEG and dream reports so far. Among awakenings with a known sleep stage, people reported dreaming after REM sleep in 81% of cases, after light N2 sleep in 56%, and even after deep sleep in 48%. Limits: the data come from very different lab studies, and EEG features have so far predicted only moderately well whether someone had been dreaming.",
        why: "Nights without a clear memory are often not dreamless. Record fragments or even just a feeling.",
        cite: "Wong, W. et al., 2025", url: "https://doi.org/10.1038/s41467-025-61945-1" },
      { id: "traumerinnerung-faktoren", category: "schlaf", year: 2025, journal: "Communications Psychology", confidence: "vorläufig",
        title: "What goes with remembering dreams in the morning",
        text: "217 adults aged 18 to 70 spoke into a voice recorder every morning for 15 days about what had gone through their minds before waking; sleep data, questionnaires and memory tests were collected too. People reported dreams more often if they had a positive attitude towards dreams, a stronger tendency to mind-wander and more light sleep; older people more often only knew that they had dreamed but not what, and recall was lower in winter than in spring. Limits: recall rates were higher than in earlier studies because of the method, and the results show associations, not causes.",
        why: "Speaking into a microphone right after waking, as in this study, is a simple way to capture dreams before new impressions get in the way.",
        cite: "Elce, V. et al., 2025", url: "https://doi.org/10.1038/s44271-025-00191-z" },
      { id: "traumthema-einschlafen", category: "kreativitaet", year: 2023, journal: "Scientific Reports", confidence: "vorläufig",
        title: "A dream theme at sleep onset went with more creativity",
        text: "49 adults took an afternoon nap in the lab or stayed awake; a hand-worn sensor (“Dormio”) detected sleep onset and asked some of them, by audio, to think of a tree. The group that slept with the prompt did best on creativity tasks afterwards, and the more often the tree appeared in their sleep-onset dreams, the more creative their answers. Limits: groups of only 12 to 13 people, a single theme and no EEG confirmation of the sleep stage.",
        why: "If you deliberately take a theme to bed with you, you can check in your journal the next morning whether and how it shows up in your dreams.",
        cite: "Horowitz, A. H. et al., 2023", url: "https://doi.org/10.1038/s41598-023-31361-w" },
      { id: "albtraum-therapie-klang", category: "albtraum", year: 2022, journal: "Current Biology", confidence: "vorläufig",
        title: "Sound during REM sleep boosted a nightmare therapy",
        text: "36 people with nightmare disorder rewrote a nightmare into a positive version and rehearsed it every evening for two weeks (Imagery Rehearsal Therapy); for half of them this version was paired with a piano chord that a headband played to everyone during REM sleep. Nightmares became rarer in both groups, but much more so in the paired group, from an average of 2.9 to 0.2 a week (comparison group: 2.6 to 1.0), and the difference lasted three months. Limits: a small sample, no group without any therapy, and according to the University of Geneva the finding still has to be replicated.",
        why: "Writing a nightmare down can help you look at it from a distance. With frequent, distressing nightmares, a therapy like this belongs in expert hands.",
        cite: "Schwartz, S., Clerget, A. & Perogamvros, L, 2022", url: "https://doi.org/10.1016/j.cub.2022.09.032" },
      { id: "kreativer-halbschlaf", category: "kreativitaet", year: 2021, journal: "Science Advances", confidence: "vorläufig",
        title: "The flash of insight came more often when half asleep",
        text: "103 adults worked on number tasks with a hidden shortcut, then rested for 20 minutes half-reclined holding a light cup, based on a method Thomas Edison is said to have used. Those who spent at least 15 seconds in the sleep-onset stage N1 later discovered the shortcut 83% of the time, compared with only 30% of those who stayed awake; those who fell into deeper sleep lost the advantage. Limits: a single lab study with a specific arithmetic task, so it is open whether this carries over to other kinds of creativity.",
        why: "Ideas from half-sleep fade fast. A quick voice memo as soon as you're awake again keeps them.",
        cite: "Lacaux, C. et al., 2021", url: "https://doi.org/10.1126/sciadv.abj5866" },
      { id: "pandemie-traeume", category: "gesellschaft", year: 2021, journal: "Nature and Science of Sleep", confidence: "solide",
        title: "Pandemic: more people often remembered their dreams",
        text: "In an online survey across 14 countries (May to July 2020), 19,355 adults reported how often they remembered dreams before and during the pandemic: the share with frequent dream recall (at least three nights a week) rose from 27% to 36%. Frequent recall went hand in hand above all with nightmares, trouble staying asleep and symptoms of post-traumatic stress; a Finnish study also found that 55% of distressing dream patterns revolved directly around the pandemic, such as infection or ignored distancing. Limits: self-reports, the before value was estimated in hindsight, and the samples are not representative.",
        why: "When big events weigh on many people, it shows at night too. Your journal makes visible how world events turn up in your own dreams.",
        cite: "Fränkl, E. et al., 2021", url: "https://doi.org/10.2147/NSS.S324142" },
      { id: "dialog-im-klartraum", category: "klartraum", year: 2021, journal: "Current Biology", confidence: "vorläufig",
        title: "Lucid dreamers answered questions from inside REM sleep",
        text: "Four labs in the USA, France, Germany and the Netherlands put questions and maths problems to 36 people aiming for a lucid dream, during REM sleep confirmed by polysomnography: spoken, as tones, as light signals or as touch. Answers came back through agreed eye movements or facial muscle signals: of 158 attempts during signal-verified lucid dreams, 29 were answered correctly, 5 incorrectly, 28 were unclear and 96 got no answer. Limits: correct answers came from only 6 of the 36 people, and after waking some remembered the task differently from how it had been posed.",
        why: "Lucid dreams can be verified objectively in the lab. If you have them, write down as precisely as you can what you knew and could do in the dream.",
        cite: "Konkoly, K. R. et al., 2021", url: "https://doi.org/10.1016/j.cub.2021.01.026" },
      { id: "klartraum-stimulation", category: "klartraum", year: 2020, journal: "Consciousness and Cognition", confidence: "vorläufig",
        title: "Lucid dreams by brain stimulation: finding not confirmed",
        text: "In 2014 a team led by Ursula Voss reported in Nature Neuroscience that weak alternating current stimulation of the forehead region at around 25 and 40 hertz during REM sleep increased self-awareness in dreams, measured, however, by the dreamers' own ratings. In 2020 a Montreal lab tested 40-hertz stimulation during naps and recorded lucid dreams objectively through agreed eye signals: they occurred about as often with real as with sham stimulation. Limits: the replication was small as well, so the question is not settled, but solid evidence for lucid dreaming devices using electrical stimulation is still missing.",
        why: "If you want to practise lucid dreaming, free techniques like MILD have more evidence behind them than stimulation devices. Your journal shows what works for you.",
        cite: "Blanchette-Carrière, C. et al., 2020", url: "https://doi.org/10.1016/j.concog.2020.102957" },
      { id: "traeume-und-alltag", category: "gesellschaft", year: 2020, journal: "Royal Society Open Science", confidence: "solide",
        title: "24,000 dream reports: dreams mirror daily life, but not one to one",
        text: "A research team had software analyse around 24,000 dream reports from the online collection DreamBank using a classic coding system: characters, encounters, emotions. The patterns matched the dreamers' lives: a war veteran's reports contained strikingly much aggression, and a young woman who recorded her dreams from age 12 to 25 had more negative emotions during her teenage years. Limits: DreamBank comes mostly from well-educated people in the USA, and older diary studies already showed that focused activities like reading or writing appear in dreams less often than daily life would suggest.",
        why: "Dreams are measurably connected to waking life. Over months your journal can show which people, places and moods keep coming back for you.",
        cite: "Fogli, A., Aiello, L. M. & Quercia, D, 2020", url: "https://doi.org/10.1098/rsos.192080" },
      { id: "klartraum-mild", category: "klartraum", year: 2020, journal: "Frontiers in Psychology", confidence: "solide",
        title: "Lucid dream training: MILD does best in studies",
        text: "In the international ILDIS study, 355 volunteers practised lucid dreaming techniques for a week: briefly waking after a few hours of sleep (Wake Back to Bed) and, while falling asleep again, firmly intending to recognise the next dream as a dream (MILD). With MILD they reported a lucid dream on 16.5% of mornings on average, clearly more often than in the week before, especially if they fell asleep again within ten minutes. Limits: motivated volunteers, many dropouts and self-report only; a 2023 systematic review, however, also names MILD the most effective of the techniques studied.",
        why: "In the study, good general dream recall predicted lucid dreaming success. Regularly recording your dreams is a natural foundation before you try MILD.",
        cite: "Aspy, D. J, 2020", url: "https://doi.org/10.3389/fpsyg.2020.01746" },
      { id: "gedaechtnis-reaktivierung", category: "gedaechtnis", year: 2020, journal: "Psychological Bulletin", confidence: "solide",
        title: "Cues during sleep can strengthen what you learned",
        text: "In “targeted memory reactivation”, something learned is paired with a cue such as a sound, which is played again during sleep. A meta-analysis of 91 experiments with 2,004 participants found a small but robust memory benefit when the cues came during light or deep sleep (NREM); during REM sleep and while awake there was no effect on the memory measures tested. Limits: the effects are small on average and come from lab tasks such as word learning or motor skills.",
        why: "Sounds during sleep can influence what the brain processes. Note it when noises from your surroundings turn up in a dream.",
        cite: "Hu, X., Cheng, L. Y., Chiu, M. H. & Paller, K. A, 2020", url: "https://doi.org/10.1037/bul0000223" },
      { id: "angst-im-traum", category: "albtraum", year: 2020, journal: "Human Brain Mapping", confidence: "vorläufig",
        title: "Fear in dreams went with calmer reactions during the day",
        text: "In a first study, 18 people wearing high-density EEG were woken again and again: fear in dreams went with activity in the insula and the midcingulate cortex, regions that are also active with fear while awake. In a second study, 89 people kept a dream diary for a week; those who experienced fear in dreams more often later reacted less strongly to threatening images in the MRI scanner and showed more activity in the medial frontal cortex, which is linked to emotion regulation. Limits: the findings are correlational; they fit theories that dreams “rehearse” threats or regulate emotions, but do not prove them.",
        why: "A frightening dream is not automatically a bad sign. If you note emotions in your dreams, you can see whether fear dreams stay occasional or weigh on you often.",
        cite: "Sterpenich, V., Perogamvros, L., Tononi, G. & Schwartz, S, 2020", url: "https://doi.org/10.1002/hbm.24843" },
      { id: "labyrinth-traum", category: "gedaechtnis", year: 2019, journal: "Journal of Sleep Research", confidence: "vorläufig",
        title: "People who dreamed of the maze reached the goal faster in the morning",
        text: "Students trained in a virtual maze in the evening; 17 of them were woken several times the following night to describe their dreams. The 8 people whose dreams directly featured the maze improved much more by morning (172 seconds faster on average) than the others (2 seconds), similar to an earlier nap study by the same group. Limits: a small, correlational study; whether dreaming causes the improvement or only indicates it is open, and not all follow-up studies found the link.",
        why: "When you're learning something new, note whether it turns up in your dreams: an interesting self-experiment with no guarantee of results.",
        cite: "Wamsley, E. J. & Stickgold, R, 2019", url: "https://doi.org/10.1111/jsr.12749" },
      { id: "albtraeume-umschreiben", category: "albtraum", year: 2018, journal: "Journal of Clinical Sleep Medicine", confidence: "solide",
        title: "Rewriting nightmares: recommended by professional societies",
        text: "In Imagery Rehearsal Therapy (IRT), you rewrite a nightmare while awake into a new, less distressing version and imagine it regularly. After reviewing the studies from 2009 to 2017, the American Academy of Sleep Medicine rated IRT as the only treatment for nightmare disorder at the level “recommended”; in 2025 the World Sleep Society endorsed this position. Limits: the recommendation applies to diagnosed nightmare disorder, which affects about 4% of adults, and does not replace professional support; other approaches such as lucid dreaming therapy are rated only “may be used”.",
        why: "The journal can help put a distressing dream into words. If nightmares trouble you often, approach IRT with a doctor or psychotherapist: the app is not a treatment.",
        cite: "Morgenthaler, T. I. et al., 2018", url: "https://doi.org/10.5664/jcsm.7178" },
      { id: "hot-zone", category: "gehirn", year: 2017, journal: "Nature Neuroscience", confidence: "vorläufig",
        title: "Activity at the back of the brain showed whether someone was dreaming",
        text: "Researchers repeatedly woke sleepers wearing high-density EEG in three experiments, including 32 people with 240 awakenings, and asked whether they had just experienced anything. Dreaming, in REM and non-REM sleep alike, went with less slow brain activity in a posterior “hot zone”; with this, the team correctly predicted in 87% of awakenings in seven further people whether they would report a dream. Limits: small samples, and one critic objects that the method captures whether a dream is remembered rather than dreaming itself.",
        why: "Research needs exactly what you do in the morning: noting straight away whether you experienced something. Even “there was something, but I don't remember what” is valuable.",
        cite: "Siclari, F. et al., 2017", url: "https://doi.org/10.1038/nn.4545" },
      { id: "traumtagebuch-erinnerung", category: "schlaf", year: 2016, journal: "Consciousness and Cognition", confidence: "vorläufig",
        title: "Dream journal: people who write it down seem to remember more",
        text: "Asked in hindsight how often they dream, people name far fewer dreams than they later record in a dream logbook, a gap shown by a review of several studies. A follow-up study with different questionnaires and logbook formats concluded that both are true: questionnaires underestimate dream recall, and keeping a logbook increases it; the gap was largest in those whose recall improved while keeping the logbook. Limits: a single study with self-reports, so it can't say precisely how strong the effect is for whom.",
        why: "Regularly recording dreams, even fragments, may strengthen dream recall itself: a good reason to record something briefly even on “empty” mornings.",
        cite: "Aspy, D. J, 2016", url: "https://doi.org/10.1016/j.concog.2016.03.015" },
      { id: "traumbilder-dekodieren", category: "gehirn", year: 2013, journal: "Science", confidence: "vorläufig",
        title: "Dream images could be partly read from brain scans",
        text: "Three people fell asleep in an MRI scanner and were woken at least 200 times each at sleep onset to describe what they had seen, such as people, objects or places. An algorithm previously trained on brain activity while viewing real photos identified from the scans just before waking, better than chance, which of two image contents appeared (60% hits versus 50% chance). Limits: only three participants and only sleep-onset images instead of extended dreams, so the technique is far from “reading” dreams.",
        why: "This brain research also relies on what people say right after waking. Precise descriptions of people, places and images make your journal more meaningful too.",
        cite: "Horikawa, T., Tamaki, M., Miyawaki, Y. & Kamitani, Y, 2013", url: "https://doi.org/10.1126/science.1234330" },
    ],
  },

  breathe: {
    ready: "Ready?", in: "Breathe in", hold: "Hold", out: "Breathe out", done: "Well done",
    start: "Start", stop: "Stop", again: "One more minute", guided: "Breathe with guidance",
    round: "Round {n} of {m}",
    how: "Breathe in for 4 seconds, hold for 7, out for 8. Four rounds. Close your eyes if you like — the phone taps you at every change.",
  },

  reminders: {
    title: "Reminders",
    lede: "A dream fades within minutes. A nudge at the right moment makes all the difference.",
    settingsHint: "Morning, evening, reality checks",
    morning: "Morning reminder",
    morningHint: "“What did you dream?” — tap the notification and the recorder is running.",
    evening: "Evening reminder",
    eveningHint: "Time to wind down — sounds on, phone away.",
    reality: "Reality checks during the day",
    realityHint: "For lucid dreaming: short questions between 10am and 8pm, at different times each day.",
    perDay: (n) => `${n}× a day`,
    autoRecord: "Record straight away in the morning",
    autoRecordHint: "Open the app between 3 and 11am without an entry for today, and the recorder starts at once.",
    denied: "Notifications for Dream Rushes are switched off in your iPhone settings.",
    openSettings: "Open Settings",
    homeAskTitle: "Want a nudge in the morning?",
    homeAskText: "At 7:30. Tap the notification and the recorder is running — before the dream is gone.",
    homeAskYes: "Yes, remind me",
    homeAskNo: "No thanks",
    morningTitle: "What did you dream?",
    morningBody: "Tell it before it fades. One tap and I'm listening.",
    eveningTitle: "Time to wind down",
    eveningBody: "Sounds on, phone away. A dream is waiting tonight.",
    realityTitle: "Are you dreaming right now?",
    realityBodies: [
      "Look at your hands. Count your fingers.",
      "Read a sentence, look away, read it again. Did it stay the same?",
      "Pinch your nose shut and try to breathe.",
      "How did you actually get here?",
      "Check a clock, then check it again. Is the time right?",
    ],
  },

  lucid: {
    /* The guide as a tutorial track (Anton's reference 13.09.: Moonly's
       welcome guide): trailer on top, then steps along a timeline.
       ⚠ The per-card videos are PLACEHOLDERS — Anton renders them later. */
    tutorialKicker: "Tutorial",
    tutorialStep: (n) => `Step ${n}`,
    mediaSoon: "Video · coming soon",
    methodsLede: "They all build on that one moment: the brief wake-up after about five hours. Tap a method to see its steps.",
    sourceTitle: "Where the numbers come from",
    lede: "Lucid dreaming means noticing you're dreaming while it happens — and sometimes steering what comes next. It can be learned: in the largest comparison study to date, one week of practice was enough for many people. Here is what the evidence actually supports, including the part that contradicts most advice you'll find online.",
    leversTitle: "What actually moves the needle",
    levers: [
      /* ⚠ Begründung in de.js: Eine Prozentzahl ohne Bezugsgröße ist keine
         Aussage. Oben die Wirkung in Worten, unten die Zahl mit Einheit. */
      { title: "Get back to sleep fast",
        text: "The biggest single difference in the whole study wasn't which technique people used — it was falling asleep again within ten minutes of doing it. That turned 18 attempts in 100 lucid, against 11 without. Lie down straight away. No phone." },
      { title: "Wake after about five hours",
        text: "A short wake-up in the middle of the night lifts the yield from 6 to 18 nights in 100. Nearly every method below is built on this one moment." },
      { title: "Keep writing dreams down",
        text: "People who remembered more dreams had more lucid ones — before learning any technique at all. You're already doing this. That's the point of this app." },
    ],
    methodsTitle: "The methods",
    methods: [
      {
        id: "wbtb", name: "WBTB — Wake back to bed", rate: "the multiplier",
        summary: "Not a technique on its own: the window the others work in.",
        steps: [
          "Go to bed early enough that five hours still leaves you a few more.",
          "Put the alarm somewhere you have to stand up to reach.",
          "Stay up five to ten minutes. Bathroom, a few steps, dim light — no screens.",
          "Back to bed, and run MILD or SSILD as you settle.",
        ],
        note: "This is the one that costs you something: interrupted sleep. Two or three nights a week is plenty — every night is how people quit.",
      },
      {
        id: "ssild", name: "SSILD — Senses initiated", rate: "17 nights in 100",
        summary: "Cycle through sight, sound and touch until you drift off. As good as MILD — for noticeably less effort.",
        steps: [
          "After the five-hour wake-up, lie down comfortably.",
          "Four quick rounds: eyes (whatever you see behind closed lids), ears (whatever you can hear), body (the weight of the blanket). Two or three seconds each — don't linger.",
          "Then four to six slow rounds: about twenty seconds per sense.",
          "Stop, roll into your normal sleeping position, and let yourself fall asleep.",
        ],
        note: "Trying hard is the classic mistake. The rounds are meant to leave you drowsy, not alert — if you're still concentrating, you've overdone it. Falling asleep during the slow rounds is a success, not a failure.",
      },
      {
        id: "mild", name: "MILD — Intention before sleep", rate: "17 nights in 100",
        summary: "Fall asleep holding one sentence, and a picture of catching yourself.",
        steps: [
          "After the five-hour wake-up, recall a dream from tonight or a recent one, as vividly as you can.",
          "Repeat, and mean it: “Next time I'm dreaming, I'll remember that I'm dreaming.”",
          "Picture yourself back inside that dream — and this time noticing the thing that should have given it away.",
          "Keep the picture, not the words, as you fall asleep.",
        ],
        note: "It works through intention, not repetition. Saying the sentence twenty times while thinking about something else does nothing; saying it once and meaning it is the whole technique.",
      },
      {
        id: "rc", name: "Reality checks", rate: "no measured benefit",
        summary: "The most recommended technique on the internet — and the one the data was least kind to.",
        steps: [
          "Several times a day, ask whether you're dreaming — and actually check, rather than assuming.",
          "Try to breathe in through a closed mouth with your nose pinched. In a dream, the air comes anyway.",
          "Or push the fingers of one hand against your opposite palm. In a dream, they go through.",
          "Do it especially when something feels slightly off — that instinct is what you want to arrive at night.",
        ],
        note: "The honest finding: groups that added reality checks to MILD scored lower than MILD alone (10.8 % and 13.4 % against 16.5 %). They may still build the habit of questioning what you're seeing — but they are not the lever they're sold as, and they cost daytime attention you could spend elsewhere.",
      },
    ],
    sourceNote: "Figures from the International Lucid Dream Induction Study (Aspy et al., 2020): 355 participants, one week of practice. Reassuringly, sleep quality was not worse on nights when it worked — participants slept slightly longer and woke less tired than in their baseline week.",
    reminderAsk: "Remind me during the day",
    reminderActive: (n) => `Reminders on: ${n}× a day`,
    reminderPerDay: "How often a day",
    reminderWhy: "The check only works once it is a habit — and a habit needs a nudge during the day, not good intentions at night.",
    reminderSoon: "On. The times change every day so the check never turns into routine.",
    reminderOn: "Noted — reminders arrive with the iPhone build",
  },

  dream: {
    title: "Record your dream",
    cancel: "Cancel",
    label: "Last night, I dreamt…",
    placeholder: "…I was falling backward through a city that turned into water, " +
                 "and the streetlights became jellyfish…",
    textLabel: "Dream text",
    modeLegend: "How should it come out?",
    // Never name the underlying models in the UI. Which provider renders a
    // dream is implementation detail — it is noise to the reader, and it
    // would turn every provider swap into a copy change.
    modeImages: "Photo story",
    modeImagesHint: "A sequence of stills",
    modeFilm: "Film",
    modeFilmHint: "A short moving clip",
    // Names the processors on purpose — this is a data-protection disclosure,
    // not model marketing. Reference photos can be faces, which are biometric
    // data; people are entitled to know where those go. Model names are a
    // different matter and stay out of the UI.
    privacy: "Your dream text goes to fal.ai (and DeepSeek, to help write the prompt). " +
             "Reference photos and voice recordings go to fal.ai only. Your journal stays on this device.",
    submit: "✦ Summon the dream",
    submitting: "Summoning…",
    tooShort: "⚠ Write a little more first.",
    caught: (name) => `✦ ${name} joined your menagerie`,
    /* Der Rekorder (ADR-0007): einsprechen, fertig — keine Rückfragen. */
    record: "Tell it out loud", recordHint: "Tap the light and just talk. I'll write along.",
    recording: "Listening…", recordStop: "Done", recordDiscard: "Discard", recordTranscribing: "Writing it down…",
    recordTooShort: "That was too short — try again.", recordFailed: "Couldn't write that down. Try again.",
    // Gast hat gesprochen: Aufschreiben kostet, also erst anmelden — die Aufnahme bleibt.
    recordSignIn: "Sign in and I'll write it down — your recording is kept.",
    recordAgain: "Record again", yourRecording: "Your recording",
    /* Recorder first (Anton, 13.09.): record → listen back → write it down → add to it. */
    reviewTitle: "Listen back", reviewHint: "Sounds right? Then I'll write it down.",
    /* Die Sprechblase des Maskottchens nach der Aufnahme (26.09.) — wechselt alle paar Sekunden. */
    mascotReview: ["That was quite a night! Want to hear it again?", "Tap play — I'll listen along.", "Sounds right? Then I'll write it down for you."],
    recordListen: "Play", recordPause: "Pause", recordTranscribe: "Write it down", recordRetake: "Record again",
    typeInstead: "Type instead", textTitle: "Your dream", textLede: "From your recording. Read it through and add what's missing.",
    tellMore: "Keep telling", rewriteAll: "Start over", editText: "Edit the text",
    interview: "Tell it out loud",
    interviewHint: "I'll ask, you talk — eyes closed if you like",
    reading: "Working out your dream…",
    readingHint: "Naming it, and picking out who was there.",
    /* Der Ladebalken nach dem Einsprechen (10.10.): wechselt über die
       geschätzte Dauer, der erste nur, wenn gerade aufgeschrieben wird. */
    readingSteps: [
      "Writing down your words…",
      "Reading your dream…",
      "Finding the scenes…",
      "Spotting who was there…",
      "Feeling the mood…",
      "Giving it a title…",
      "Almost there…",
    ],
    or: "or write it",
    loading: [
      "Developing your rushes…",
      "Editing the fog…",
      "Colour-grading your subconscious…",
      "Summoning what you saw…",
      "Almost lucid…",
    ],
  },

  wizard: {
    back: "Back",
    cancel: "Cancel",
    next: "Continue",
    free: "Free",
    from: "from",
    credit: "credit",
    credits: "credits",
    creditsN: (n) => (n === 1 ? "credit" : "credits"),
    tooShort: "⚠ Write a little more first.",
    noCredits: "Not enough credits. Top-up is coming soon.",
    noCreditsCta: "See the prices",
    progress: (n, total) => `Step ${n} of ${total}`,

    step1: {
      title: "What did you dream?",
      /* ⚠ Begründung in de.js: Der Knopf ist der einzige Weg weiter, klang
         aber nach einem Extra — und „improve" ist das Kleinste, was hier
         geschieht. Er sagt jetzt, was er tut. */
      improve: "Read my dream",
      reading: "Working out your dream…",
      why: "The app reads your dream: who is in it, where it plays, which scenes " +
           "make it up — and retells it cleanly in your own language along the way. " +
           "Everything after this is built on that, which is why the path goes " +
           "through here. Your own words are kept either way.",
      previewTitle: "Here it is, tidied up",
      previewLede: "Your own words are always kept, whichever you choose.",
      yours: "As you wrote it",
      improved: "Improved",
      keepMine: "Keep my words",
      useImproved: "Use this version",
    },

    step2: {
      title: "What should become of it?",
      saveOnly: "Just save it",
      saveCta: "Save it",
      filmCta: "Make the film",
      saveOnlyHint: "Into your journal, nothing generated",
      images: "A photo story",
      imagesHint: "Stills of your dream, in order",
      film: "A film",
      filmHint: "Renders a still first, then brings it to life",
      saved: "Dream saved",
    },

    step3: {
      title: "Who is in it?",
      lede: "Anyone already in your library is matched automatically. For the " +
            "rest, tell us who they are — or let the AI invent them.",
      empty: "Nobody was found in this dream. That is fine — carry on.",
    },

    step4: {
      title: "Where does it happen?",
      lede: "A dream that moves from one place to another needs both. Same " +
            "choices as before.",
      empty: "No place was found in this dream. The AI will imagine one.",
    },

    cast: {
      choose: "From library",
      change: "Change",
      createNew: "Create new",
      letAi: "Let the AI decide",
      freeSet: "AI invents them",
      freeShort: "AI",
      newShort: "Photo",
      undecided: "Not decided yet",
      /* Things and marking in the text (13.09.2026, Hanni's idea from 07.08., native). */
      objectsTitle: "Which things matter?",
      objectsLede: "The letter, the red car, the TV tower — whatever must look the same in every shot.",
      objectsEmpty: "Nothing special. Tap a word in the text if there is.",
      textTitle: "Your dream",
      markHint: "Highlighted is who and what the AI recognised. Tap a highlight to decide who it is — or tap any other word to add it.",
      addTitle: "Add to the cast",
      addName: "Name",
      addAs: "This is …",
      add: "Add",
      removeFromCast: "Not part of the cast",
      whoIs: (name) => `Who is “${name}”?`,
      close: "Done",
      note: "Anything left undecided is invented by the AI.",
      removeLabel: (name) => `Remove ${name}`,
      pickTitle: (name) => `Who is “${name}”?`,
      libraryEmpty: "Your library is still empty.",
      /* Karte für Karte (26.09., Antons Wahl „C"): eine Figur je Bildschirm. */
      stepOf: "{i} of {n}",
      whoYou: "How do you appear?",
      nextName: "Next · {name}",
      missing: "Someone missing?",
      tilePhoto: "This photo",
      tileAi: "AI invents",
      tileNew: "New photo",
      fromLibrary: "From your library",
      libraryEmpty: "No faces in your library yet — “New photo” adds one.",
      placesTitle: "Places & things",
      placesHint: "The AI invents them — or tap one to give it a real photo, of the place or the thing.",
      noPeople: "Nobody in particular — the AI invents everyone.",
    },

    step5: {
      title: "How should it look?",
      countLabel: "How many images",
      countNames: { 3: "Beginning, middle, end", 5: "The whole arc", 10: "Every turn" },
      previewName: "Quick look",
      previewHint: "Three smaller images from a single render — enough to see where the dream is going, before you spend more on it.",
      styleLabel: "Style",
      formatLabel: "Format",
      portrait: "Phone, stories",
      landscape: "Widescreen",
      square: "Square, feed",
      keyframeLabel: "Which image comes to life?",
      keyframeHint: "The film starts from this picture — its look carries through.",
      filmModelLabel: "Which model",
      filmModels: {
        standard: {
          name: "Glow", hint: "your opening image starts to move, with sound · up to 15 seconds",
          badge: "Best price",
          model: "MiniMax H3 Max Turbo",
          info: "The quick tier: it brings your opening image convincingly to life, sound included, and carries up to four reference photos so the real faces stay themselves. Films top out at 15 seconds. Pick the quality below — the credits per second are shown on the switch.",
        },
        premium: {
          name: "Aurora", hint: "up to 30 seconds in one take, with sound",
          badge: "Best quality",
          model: "Seedance 2.5",
          info: "The longest story: one unbroken take of up to 30 seconds, with sound and second-precise timing — and your reference photos stay in the film the whole way. Pick the quality below; the sharp tier costs more than double here, the credits are on the switch.",
        },
        /* Die Traum-Skizze (24.09.2026): entsteht auf dem iPhone selbst,
           kostet keine Credits. Nur auf Geräten, die es können. */
        sketch: {
          name: "Glimpse", hint: "4 to 12 scenes with your faces, music and sound — the film is made on your iPhone",
          badge: "Cheapest",
          model: "GPT Image 2 + your iPhone",
          info: "The quick, cheap way into your dream: four, eight or twelve scenes are painted in your chosen look — with the faces from your cast — while music and ambient sound are made to match. Your iPhone then measures how deep every scene is and flies a camera through it; the sound effects are then made from the finished film. No real motion of people, but a moving memory in seconds. Five a month are free.",
        },
      },
      qualityLabel: "Quality",
      holdHint: "Press and hold a model to learn more",
      aboutModel: "About this model",
      aboutStyle: "About this style",
      moreStyles: (n) => `More styles (${n})`,
      useStyle: "Use this style",
      pickStyle: "Pick a style first.",
      presets: {
        dreamflow: "Dreamflow",
        dreamflowSub: "No cuts — every scene becomes the next",
        dreamflowInfo: "One unbroken take. Nothing is cut: the office turns into the lift, the lift into the cockpit, the sky into the ground. The whole dream in a single flow — dream logic as the form itself. Renders in the soft, glowing look, because a hard photoreal edge works against transitions.",
      },
      paceLabel: "Pace",
      paceNames: { calm: "With cuts", fast: "Fast", flow: "One-take" },
      paceHints: {
        calm: "Every scene, hard cuts — the length sets the pace",
        fast: "Two-second cuts, more scenes",
        flow: "No cuts — each scene turns into the next",
      },
      lengthLabel: "How long",
      ideal: "ideal",
      /* Was diese Länge vom Traum trägt — als Satz, nicht als Nadel
         (Skill regisseur-schnitt, Schritt 6). Die Zahl, die zählt, ist der
         KERN: die Summe über Höhepunkt, Wendungen und Auflösung. Die Summe
         über ALLE Szenen läge bei jedem erzählten Traum über 30 Sekunden
         und riete deshalb immer dasselbe. */
      cutOneShot: "Five seconds is one image, not a story — so this is the one moment your dream is about.",
      cutAll: (n) => `All ${n} scenes fit. Nothing has to go.`,
      /* Seit 12.09.: alle Szenen sind immer drin; die Zeile sagt, wie eng es wird. */
      cutAllIn: (n, sec, per) => `All ${n} scenes in ${sec} s — about ${per} s each.`,
      cutRecommend: (sec) => `Recommended for this dream: ${sec} s.`,
      cutSome: (k, n) => `${k} of ${n} scenes fit — the ones that carry the dream.`,
      cutMoreAt: (k, sec) => `At ${sec} seconds it would be ${k}.`,
      flowAll: (n) => `All ${n} scenes flow into one another — nothing is cut, nothing is left out.`,
      flowFast: (sec) => `That is a lot for this length: it will move fast. From ${sec} seconds it breathes.`,
      cutTwoParter: "Longer than this renderer can hold in one film.",
      posterLabel: "The poster",
      posterTitleLabel: "Film title",
      posterTitlePlaceholder: "Title on the poster",
      posterTaglineLabel: "Tagline",
      posterTaglinePlaceholder: "One line that sells the dream (optional)",
      posterHint: "Your dream opens like a film: the first image is its poster, " +
                  "with this title on it. Clear the title if you'd rather have " +
                  "scene images only.",
      generate: "Create it",
      progress: (done, total) => `${done} of ${total} done`,
      preparingRef: (tag) => `Preparing @${tag}…`,
      summaryImages: (n) => `${n} images in one continuous sequence.`,
      summaryPreview: (n) => `A quick look: ${n} smaller images from one render.`,
      summaryFilm: "One still, brought to life.",
      summaryFilmLength: (s) => `${s} seconds of film. Rendering takes a few minutes — you can leave and come back.`,
      summaryRefs: (n) =>
        n === 0 ? "No reference photos — everything is invented."
                : n === 1 ? "1 reference photo will be used."
                          : `${n} reference photos will be used.`,
      /* Der sichtbare Fehlerblock statt eines flüchtigen Toasts: sagt, dass
         nichts abgebucht wurde, und bietet den Weg zurück an — Antons
         Befund 21.08. („toter Loop", keine gestaltete Fehlermeldung). */
      failedTitle: "That didn't work",
      failedNote: "Nothing was charged — your credits are untouched.",
      failedHome: "Back to start",
    },

    /* Die Traum-Skizze — dream/sketch.tsx. Platzhalter {i} {n} {done} {total}
       werden nativ ersetzt (die Brücke reicht nur Zeichenketten). */
    sketch: {
      title: "Glimpse",
      lede: "Scenes from your dream in the look you picked — with the faces from your cast, music and sound. Your iPhone turns them into a film with depth.",
      queuedTitle: "Your Glimpse is on its way",
      queuedBody: "Feel free to look around the app. It will appear in your journal, and you'll get a notification as soon as it's ready.",
      toJournal: "Go to journal",
      readyTitle: "Your Glimpse is ready ✨",
      readyBody: "“{title}” — tap to watch it.",
      stripsTitle: "How many pictures?",
      stripOption: "{scenes} scenes\n{seconds} seconds",
      stripFits: "Fits your dream",
      soundNote: "With music and ambient sound, made for this dream",
      createCredits: "Create Glimpse · {n} credits",
      priceShort: "{n} cr",
      freeShort: "Free",
      needsModel: "One-time download",
      modelInfo: "The first time, your iPhone loads a small depth model (about 50 MB).",
      download: "Download · {mb} MB",
      downloading: "{done} of {total} MB",
      cancel: "Cancel",
      creating: "Painting your scenes…",
      rendering: "Moving the camera through your dream…",
      saving: "Putting it in your journal…",
      stayHint: "Keep the app open until it's done.",
      failed: "The Glimpse didn't work out.",
      retry: "Try again",
      unsupported: "Glimpse isn't available on this device.",
      create: "Create Glimpse · Free",
      createCredit: "Create Glimpse · {n} credit",
      freeLeft: "{n} free Glimpses left this month",
      noneLeft: "Your free Glimpses for this month are used up",
      giftLeft: "Gifted Glimpses left: {n}",
      takeLabel: "Glimpse",
      photoTitle: "With the faces from your cast",
      photoHint: "{name} — as the model for the characters, painted in your look.",
      preparing: "Reading your dream…",
      priceFree: "Free · {n} left this month",
      priceGift: "Gifted · {n} left",
      creditWord: "credit",
      working: [
        "Reading your dream…",
        "Finding the right light for your look…",
        "Placing everyone in the scene…",
        "Painting the moments of your night…",
        "Composing the music for your dream…",
        "Checking the faces…",
        "Almost there — the last brushstrokes…",
      ],
      filming: [
        "Measuring how deep every scene goes…",
        "Setting up the camera…",
        "Letting the dust drift…",
        "Rolling the film…",
      ],
    },

    step6: {
      title: "Your dream",
      /* The reward after ordering (Anton, 13.09.2026). */
      celebrateFirst: "Wow — your first dream film!",
      celebrateN: (n) => `Dream no. ${n} is on its way`,
      celebrateText: "Handing it in now — then it's off to your journal. You don't have to wait for it to finish.",
      celebrateHint: "We'll let you know as soon as it's there.",
      save: "Save to journal",
      added: "Added to your dream",
      saveWhileRendering: "Save — I'll come back for it",
      rendering: "Your film is being made…",
      renderingHint: "This takes a few minutes. You can leave — it will be " +
                     "waiting in your journal when it's done.",
      renderFailed: "The film did not come through. Your credits were spent on " +
                    "the attempt — tell us and we will look into it.",
      nothing: "Nothing came back. Try again from the last step.",
    },
  },

  // The free-content tab: nothing behind it costs a credit.
  // Checklist content follows the sleep-hygiene evidence (light exposure,
  // body-temperature timing, caffeine half-life, progressive muscle
  // relaxation, slow breathing) — not folklore.
  sleep: {
    title: "Sleep",
    subtitle: "Everything around the dream — all of it free.",
    free: "Dreams cost credits. Sleep never will.",
    tiles: {
      /* Breathing (13.09.2026): the 4-7-8 exercise as a guided minute. */
      breathe: {
        emoji: "🫧",
        title: "Breathe",
        text: "One minute of 4-7-8 — the quickest way to calm",
      },
      /* Knowledge (13.09.2026, Anton's mission). */
      knowledge: {
        emoji: "📚",
        title: "Knowledge",
        text: "What research is finding out about dreams",
      },
      checklist: {
        emoji: "🌜",
        title: "Wind down",
        text: "Tonight's checklist for falling asleep faster",
      },
      sounds: {
        emoji: "🌊",
        title: "Sleep sounds",
        text: "Mix noise colours and let them run",
      },
      guide: {
        emoji: "🧠",
        title: "Lucid dreaming",
        text: "What the evidence actually supports",
      },
      symbols: {
        emoji: "✧",
        title: "Dream symbols",
        text: "What keeps turning up in your dreams",
      },
    },
    checklist: {
      lede: "Tonight's ritual — the ticks reset themselves every day.",
      progressLabel: "Steps done tonight",
      remaining: (n) => (n === 0 ? "All done — sleep well." : `${n} to go`),
      hint: "Still awake after ~20 minutes? Get up, do something calm in dim " +
            "light, and come back when you're drowsy — lying there awake " +
            "teaches the bed to mean “awake”.",
      items: [
        { id: "light",    title: "Dim everything",
          text: "Low light for the last hour — or none: a blacked-out room or a sleep mask." },
        { id: "shower",   title: "Warm shower or bath",
          text: "About 90 minutes before bed. The cool-down afterwards is the body's own sleep signal." },
        { id: "cool",     title: "Cool the bedroom",
          text: "Around 16–19 °C. A cool room under a warm blanket beats a warm room." },
        { id: "caffeine", title: "No caffeine after mid-afternoon",
          text: "It blocks sleep pressure for six hours and more — evening coffee is morning tiredness." },
        { id: "screens",  title: "Screens away",
          text: "The last half hour belongs to paper, sound, or nothing. The journal is for the morning." },
        { id: "relax",    title: "Release every muscle",
          text: "Toes to jaw: tense each group for five seconds, let go, move on. The best-tested trick on this list." },
        { id: "breathe",  title: "Slow your breath",
          text: "In for 4, hold for 7, out for 8 — a few rounds. Long exhales switch the body to rest." },
      ],
    },
    sounds: {
      lede: "Three colours of noise, mixable into your own blend. They loop " +
            "until you stop them — and keep playing while you use the rest of the app.",
      names: { white: "White noise", pink: "Pink noise", brown: "Brown noise" },
      descs: { white: "bright static, masks everything", pink: "like steady rain", brown: "like a far-off ocean" },
      /* Kurz, für die Regler unter der Welle (09.10.). */
      short: { white: "White", pink: "Pink", brown: "Brown" },
      /* Der Einschlaf-Timer. „Fade out after" statt „Stop after": Er hört
         nicht auf, er wird leiser — und genau das ist der Unterschied
         zwischen Einschlafen und Aufwachen. */
      timer: "Fade out after",
      timerOff: "Off",
      timerMin: (m) => `${m} min`,
      autoStart: "Start my mix when the app opens",
      autoStartHint: "Browsers want one tap first — your mix starts with the first touch.",
      background: "The mix keeps playing wherever you go in the app. The speaker " +
                  "button in the top corner mutes it any time.",
    },
    soundsMute: "Mute sleep sounds",
    soundsUnmute: "Unmute sleep sounds",
  },

  consent: {
    title: "Before your first dream",
    intro: "Dream Rushes turns your words and photos into images and films with the help of outside AI services. That needs your okay — honestly, up front:",
    /* Das erste Häkchen ist ein Satz mit zwei Links darin — deshalb in
       fünf Teile zerlegt statt als ein String: jede Sprache kann ihre
       eigene Wortstellung bauen, und die zwei Link-Wörter bleiben
       einzeln ansteuerbar (ConsentGate.jsx setzt sie als Buttons). */
    termsPre: "I accept the ",
    termsLink: "Terms of Use",
    termsMid: " and have read the ",
    privacyLink: "Privacy Notice",
    termsPost: ".",
    /* Stand 04.10.2026 (CONSENT_VERSION 4): alle Dienste, die die App
       heute wirklich aufruft — neu OpenAI (GPT Image 2, Standard-Bildmodell)
       und die Ton-Modelle. */
    processing: "My dream texts, voice recordings and the photos I upload may be sent to the AI services named below (fal.ai with OpenAI, Google, MiniMax, ByteDance and the sound models; DeepSeek; Google Gemini) to create my images, films and transcripts.",
    adult: "I am 18 or older.",
    /* Klartext-Kacheln über den Häkchen (Antons Ansage 23.09.2026): auf
       einen Blick, was die App tut, ohne die langen Texte zu lesen. Die
       Symbole wählt das Tor (consent-gate.tsx) über die id — hier stehen
       nur Worte. Nichts behaupten, was die details nicht auch sagen. */
    facts: [
      { id: "ai", title: "AI-made", text: "Films and images come from AI, marked as such." },
      { id: "send", title: "Sent to create", text: "Dream text, voice and photos go to AI services only to render." },
      { id: "device", title: "Stays with you", text: "Your journal lives on this device — with an account, also in an encrypted backup only you can read." },
      { id: "adult", title: "18+", text: "For adults only." },
    ],
    more: "Where does my data go?",
    details: [
      "Your dream text goes to DeepSeek (analysis and image instructions) and, through fal.ai, to the model that renders it. Voice recordings are transcribed by Google (Gemini), or by Whisper through fal.ai as a fallback.",
      "Photos you upload go through fal.ai to the image model: OpenAI (GPT Image 2) by default, Google (Nano Banana) as a backup. Before that, an automated safety check at fal.ai looks at each photo.",
      "Films are rendered by MiniMax (Hailuo) or ByteDance (Seedance); sound comes from the MMAudio and ACE-Step models — all through fal.ai, each only for your render.",
      "Rendered images and films are stored on our server in Germany so the app can show them to you. With an account, your dreams (text, never photos) are also backed up — encrypted on your phone first, so only you can read them.",
      "Training: OpenAI's and Google's paid APIs do not train on your content. DeepSeek's paid API is not used for training by default. fal.ai may use anonymized usage data to improve its services.",
      "Only upload photos you are allowed to use — for photos of other people, ask them first.",
      "Everything you create is AI-generated and is marked as such when you share it.",
    ],
    cta: "Start dreaming",
  },

  /* Die lesbaren Rechtstexte hinter den zwei Links im Consent-Gate.
   * Verständlichkeit vor Juristendeutsch: kurze Abschnitte, ehrliche
   * Aussagen — redigiert vor dem Store-Launch ein Anwalt (der Hinweis
   * dazu steht sichtbar IM Text, nicht nur hier im Kommentar). Ändert
   * sich der Inhalt wesentlich, zählt CONSENT_VERSION hoch.
   * 04.10.2026: Anbieterliste nach dem Code (OpenAI, Ton, Gemini-Diktat,
   * Supabase, Resend, Hetzner), Einladungen, Geschenk-Credits, Kauf und
   * Erstattung über Apple, Konto löschen, Mitteilungen. */
  legal: {
    close: "Close",
    updated: "Last updated: 4 October 2026",
    draftNote: "Written in plain language on purpose. A lawyer will review these texts before the app reaches the app stores.",
    terms: {
      title: "Terms of Use",
      sections: [
        { h: "What Dream Rushes is",
          p: "Dream Rushes is a dream journal that can turn your dream descriptions, voice recordings and reference photos into AI-generated images and films. The journal itself works on your device; rendering happens through outside AI services." },
        { h: "Your content stays yours",
          p: "You keep all rights to your dream texts, photos and generated results. You grant us and the AI services we name in the Privacy Notice a limited permission to process your material for one purpose only: creating the images, films and transcripts you asked for. We never sell your content, and this permission ends when the processing is done." },
        { h: "What you promise us",
          p: "You only upload photos you are allowed to use — for photos of other people, you ask them first, and you confirm this in the app for every photo. No public figures, no minors without their parents' permission. You are responsible for what you upload and create; if someone brings a claim against us because you broke these promises, you answer for it. You do not use the app to create unlawful, deceptive or abusive material, and you do not present generated scenes of real people as real events." },
        { h: "Age",
          p: "Dream Rushes is for adults. By using the app you confirm that you are 18 or older." },
        { h: "Credits and purchases",
          p: "Creating images and films costs credits; writing, voice and everything in the Sleep tab is free, and a few Glimpses each month are free too. Prices are always shown before you pay. Credits have no cash value and cannot be paid out. Credits from the monthly subscription expire at the end of each month; the yearly subscription gives you 480 credits on day one and 131 more every month, unused credits stay until the end of the subscription year. Purchased packs never expire. A render that has started uses up its credits — we pay the AI services at that moment too. You only get them back if the rendering fails for technical reasons." },
        { h: "Buying through Apple, and refunds",
          p: "Subscriptions and credit packs are sold through Apple's App Store; Apple's terms of sale apply, including any statutory right of withdrawal. Credits are available immediately after purchase. Refunds are decided by Apple, not by us — we can only tell Apple how much of a purchase has already been used. If Apple refunds a purchase, the credits it gave are removed, including credits already spent; while your balance is below zero, new paid renders are paused. A refunded purchase never earns an invitation gift." },
        { h: "Gifts",
          p: "The app gives small gifts for the dreams you collect (for example a free Glimpse on every quarter of your dream ring). Gifted credits are valid for 30 days, are used before purchased credits, have no cash value and are given at most once per milestone. We may change or end gifts for the future; gifts already given stay valid until they expire." },
        { h: "Inviting friends",
          p: "You can share your personal invitation link or code. You share it yourself, through your own apps — we never contact anyone for you; only send it to people who would want it. If a friend you invited makes their first real purchase, you receive a gift in dreams (credits), 14 days after that purchase if it was not refunded, at most five gifts a month. Free codes and test purchases do not count, and your friend gets nothing extra from the code. If we see abuse (for example fake accounts or self-invitations), we may withhold or remove invitation gifts." },
        { h: "AI-generated content and sharing",
          p: "Everything the AI produces is synthetic. It can be wrong, strange or unlike what you imagined — that is the nature of the technology, not a defect. When you share a film or image, you decide who sees it and you are responsible for it. Shared films carry a label that says they are AI-made; please leave it in place, in some countries the law requires it." },
        { h: "Availability",
          p: "Rendering depends on outside services we do not control. We work to keep the app available but cannot promise uninterrupted service; if a paid render fails, your credits are returned." },
        { h: "Ending your account",
          p: "You can delete your account at any time in the app under Profile → Settings. Unused credits and gifts end with it; subscriptions must be cancelled in your Apple account settings." },
        { h: "Changes to these terms",
          p: "We may update these terms as the app evolves. If a change matters, the app will show you the new version and ask for your agreement again before you continue." },
        { h: "Liability",
          p: "We are liable without limit for intent, gross negligence, and harm to life, body or health. For ordinary negligence we are liable only for the breach of essential contractual duties, limited to the foreseeable, typical damage. Your statutory consumer rights remain untouched." },
        { h: "Applicable law",
          p: "German law applies, without prejudice to the mandatory consumer protections of the country you live in." },
      ],
    },
    privacy: {
      title: "Privacy Notice",
      sections: [
        { h: "Who is responsible",
          p: "Dream Rushes is the controller for the processing described here. You can withdraw your consent at any time directly in the app under Profile → Settings — after that, nothing leaves your device until you agree again." },
        { h: "What we process",
          p: "Your dream texts, your voice recordings when you dictate a dream, the photos you upload, and the images and films made from them. Your journal and settings stay on your device. The account is optional: if you create one, we store your e-mail address (or your Apple sign-in), your profile, your credit balance, your purchase records from Apple (product, date, refund status) and a backup of your dreams so they survive a new phone. The dream backup is encrypted on your phone before it leaves it (end-to-end, key in your iCloud Keychain) — we cannot read it. It never contains your photos." },
        { h: "Invitations",
          p: "If you invite friends or accept an invitation, we store which account invited which, when, and whether and what the invited friend bought — only to give invitation gifts and to prevent abuse. Your friend sees your display name; you see theirs." },
        { h: "Where your data goes",
          p: "Each service only receives what it needs for its job. DeepSeek analyses your dream text and helps write image instructions. Google (Gemini) transcribes your voice recordings. fal.ai (USA) runs the renders and passes your material to the model that makes them: OpenAI (GPT Image 2, default) or Google (Nano Banana, backup) for images; MiniMax (Hailuo) or ByteDance (Seedance) for films; MMAudio and ACE-Step for sound; Whisper as a fallback for transcription; and an automated safety check for uploaded photos. Our own server runs at Hetzner in Germany and stores rendered images and films. Accounts, the encrypted dream backup, credits and invitations live at Supabase (Frankfurt, EU). Sign-up and password e-mails are sent through Resend (EU). Sign in with Apple and purchases go through Apple." },
        { h: "Training",
          p: "OpenAI's and Google's paid APIs do not use your content to train models. DeepSeek's paid API is not used for training by default. fal.ai may use anonymized usage data to improve its services. We ourselves never use your material to train anything." },
        { h: "Notifications",
          p: "Reminders and the notice that your dream is ready are created on your phone. We do not store a push address for your device." },
        { h: "Links to studies",
          p: "Under Knowledge you can open the published study behind a card. It opens in Apple's browser inside the app, on the publisher's website, where that publisher's own privacy policy applies. We do not pass any of your data to it." },
        { h: "Storage and deletion",
          p: "Rendered images and films are stored on our server as a backup, so the app can show and share them and fetch them again. Deleting a dream in your journal removes it from your device. Deleting your account (Profile → Settings) removes your account, profile, dream backup, credits, invitation links and your rendered images, films and dream recordings." },
        { h: "Legal basis",
          p: "We process your material based on your consent (Art. 6(1)(a) GDPR), which you give at the gate before your first dream, and on the contract with you (Art. 6(1)(b) GDPR) for everything needed to deliver what you ordered, including credits, purchases and invitation gifts. Preventing abuse of gifts and invitations rests on our legitimate interest (Art. 6(1)(f) GDPR)." },
        { h: "Transfers outside the EU",
          p: "fal.ai, OpenAI and Google process data in the United States; film rendering by MiniMax or ByteDance and text processing by DeepSeek can involve transfers to other third countries, including China. These transfers rest on the providers' contractual safeguards (standard contractual clauses). Supabase, Resend and our Hetzner server process data in the EU. If you are not comfortable with transfers, do not upload photos — the journal works without them." },
        { h: "Your rights",
          p: "You can ask what we hold about you, have it corrected or deleted, take back your consent at any time, and complain to a data-protection authority. Withdrawing consent stops future processing; it does not undo renders already made." },
        { h: "Age",
          p: "The app is intended for adults (18+). We do not knowingly process the data of minors." },
        { h: "Changes to this notice",
          p: "If this notice changes in substance, the app will show it to you again and ask for fresh consent before your next dream." },
      ],
    },
  },
  /* Das native Onboarding (13.09.2026): eine Frage je Bildschirm, und die
     Berechtigungen GANZ AM ANFANG — Antons Regel: „Was nicht am Anfang
     passiert, passiert nie." Die Fragen selbst sind die des Formulars
     (lib/onboardingForm.js), nur einzeln gestellt. */
  onboard: {
    skip: "Skip",
    next: "Continue",
    back: "Back",
    step: (a, b) => `${a} of ${b}`,
    introKicker: "The dream journal",
    introText: "Every night you shoot a film. Start keeping them.",
    introCta: "Start",
    featuresTitle: "What this does",
    features: [
      { title: "Say it half asleep", text: "Three in the morning, eyes shut — just talk. It writes the night down for you." },
      { title: "Then watch it", text: "Your dream becomes a short film, with the real faces of your people and places." },
      { title: "The quiet part is free", text: "Lucid guide, dream symbols, sleep sounds. No credits, no catch." },
      { title: "It stays yours", text: "The journal lives on your phone. Nothing leaves it until you ask for a film." },
    ],
    /* Die Zwischenbilder nach jeder Frage (Antons Wunsch 13.09., Moonly-
       Vorbild): ein Film, ein Satz, weiter. Sie machen Lust, statt nur zu
       fragen. Die Clips sind erst mal die Vorschau-Filme der Stile. */
    showcase: [
      { title: "Nineteen looks for one dream", text: "Claymation, film noir, ultrareal — the same night, told the way you want to see it." },
      { title: "The people in it are yours", text: "Add a face once, and your friend is in the film. Same person, every scene." },
      { title: "It remembers the patterns", text: "Water, falling, being chased — the symbols that keep coming back, gathered in your atlas." },
      { title: "And it keeps the night", text: "Your own voice, the text, the film, the moon of that night. All in one page." },
    ],
    /* Die Maskottchen-Wahl (Anton 13.09.) — zwei von drei sind noch
       Platzhalter, das steht auch auf der Kachel. */
    /* The photo, right after the "the people in it are yours" showcase
       (Anton's placement, 13.09.): first see that you're in it, then give
       it your face. */
    meTitle: "Who are you?",
    meText: "A photo of you — then you play in your dreams with your real face. It only leaves your phone for a safety check and to make your films.",
    mePick: "Choose a photo",
    meCamera: "Take a selfie",
    meChange: "Another photo",
    meLater: "Continue without a photo",
    meConsent: "By choosing a photo you confirm: this is you.",
    meDone: "That’s you.",
    mascotTitle: "Pick your dream companion",
    mascotText: "Keeps watch over your nights, waits with you while your film comes to life, and cheers when it’s ready.",
    mascotSoon: "Coming",
    mascotNames: { frog: "The frog", sloth: "The sloth", owl: "The owl" },
    askTitle: "Two things up front",
    askText: "Both are asked once, and both are optional — but a dream journal you cannot speak to at 3am is half an app.",
    askMic: "Microphone",
    askMicWhy: "So you can tell your dream instead of typing it.",
    askPhotos: "Photos",
    askPhotosWhy: "So the people and places in your dreams can have their real faces.",
    askGranted: "Allowed",
    askDenied: "Not allowed — you can change this in Settings",
    askGo: "Ask me",
    /* The years ring (Anton's wish, 13.09.): life first, then sleep, then
       the dreams inside it — and the line says what the app is for. */
    sleepTitle: "This much night is in your life",
    sleepYears: (y) => `${y} years`,
    sleepAsleep: "asleep",
    sleepDream: (y) => `Around ${y} of those years you spend dreaming. Don’t let them slip past — take them back, watch them, make them part of you.`,
    sleepNote: "Based on your answer and an average lifespan of 80 years.",
    sleepLegend: { life: "80 years of life", sleep: "Sleep", dream: "Dreams" },
    /* Die Nachtskala (27.09.): der Mond als Regler, die Zahlen rechnen live. */
    sleepScale: { hours: "{n} h", decimal: ".", hint: "Slide the moon", short: "short nights", long: "long nights",
      perNight: "asleep each night", dreaming: "of it dreaming", yearsAsleep: "of your life asleep", yearsDreaming: "of it dreaming" },
    /* Die Ziele als große Worte (27.09.) — kurz, weil sie groß stehen. */
    goalWords: { remember: "Remembering more", understand: "Understanding them", create: "Films of my nights", "sleep-better": "Sleeping better", nightmares: "Fewer bad dreams" },
    goalHint: "Tap everything that's true.",
    /* Tiles carry only their label now (Moonly reference); the sentences
       become the subtitle. */
    featuresLede: "Tell your dream half-asleep, watch it as a film, keep every night.",
    /* ⚠ PLACEHOLDER, technical (Anton, 13.09.): replaced by real awards
       once there are any. */
    proof: [],
    doneTitle: "That's it",
    doneText: "Your nights have a place now.",
    doneCta: "Start tonight",
    /* Sign-in at the end of onboarding (Anton's placement, 13.09.2026):
       answer first, then keep it. New accounts come from "Sign in with
       Apple" or from e-mail sign-up (03.10.2026, confirmed by a mailed link). */
    accountTitle: "Keep your nights",
    accountText: "With an account, your dreams, films and profile survive a new phone.",
    accountEmail: "Email",
    accountPassword: "Password",
    accountCta: "Sign in",
    accountLater: "Later",
    accountSignedIn: "Signed in as",
    accountSignedInNoEmail: "Signed in",
    accountWrong: "Email or password doesn’t match.",
    accountBusy: "Too many attempts — wait a minute.",
    accountUnavailable: "Sign-in isn’t reachable right now. You can do it later in Settings.",
    accountOffline: "No connection to the server.",
    accountApple: "Sign in with Apple",
    accountCreateCta: "Create account",
    accountToSignup: "New here? Create an account",
    accountToSignin: "Already have an account? Sign in",
    accountCheckMail: "Check your inbox",
    accountCheckMailText: "We sent a link to this address. Tap it, then sign in here.",
    accountWeak: "That password is too weak — try a longer one.",
    accountInvalid: "That doesn’t look like an email address.",
    accountExists: "There’s already an account for this email — sign in instead.",
    accountForgot: "Forgot password?",
    accountBackToSignin: "Back to sign in",
    accountSendCode: "Send code",
    accountCodeSent: "We sent a code to this address. Enter it with a new password.",
    accountCode: "Code from the email",
    accountNewPassword: "New password",
    accountSetPassword: "Set new password",
    accountBadCode: "That code is wrong or has expired — request a new one.",
    accountUnconfirmed: "Confirm your email first — tap the link we sent you.",
  },
  onboarding: {
    tagline: "Every night you make films. Start keeping them.",
    kicker: "the dream journal",
    swipe: "swipe",
    slides: [
      { title: "Whisper it, half-asleep",
        text: "Three a.m., eyes still closed — just talk. The assistant asks the right questions, writes the night down, and lets you drift back under." },
      { title: "Then watch it back",
        text: "The dream becomes a run of cinematic stills — with the real faces of your people, your pets, your places. Your favourite moment turns into a short film." },
      { title: "The quiet part is free",
        text: "A guide to lucid dreaming, the patterns behind your recurring symbols, sounds to fall asleep to. No credits, no catch." },
    ],
    start: "Start tonight",
    gateTitle: "Tell me how you dream",
    gateText: "Two minutes with me, nothing to fill in: what to call you, how your nights run, what keeps coming back. Skip whatever you like.",
    gateReward: "Two minutes, and the app fits your nights",
    gateStart: "Let's talk",
    gateType: "I'd rather type",
    gateLater: "Maybe later",
    surveyTitle: "getting to know you",
    /* Der getippte Weg. Er existiert nicht als Notnagel, sondern als
       gleichwertige Tuer: Ohne GEMINI_KEY, ohne Mikrofon oder um drei Uhr
       nachts neben einem schlafenden Menschen gab es vorher GAR KEIN
       Profil — und damit auch die Willkommens-Credits nicht. */
    formTitle: "A few quick questions",
    formIntro: "Answer what you like, skip the rest. Nothing here is required.",
    formName: "What should I call you?",
    formNamePlaceholder: "First name or nickname",
    formGoal: "What brings you here?",
    formRecall: "How often do you remember your dreams?",
    formLucid: "Lucid dreaming — where are you with it?",
    formSleep: "How long do you usually sleep?",
    formTime: "How much time a day can you give it?",
    formThemes: "Anything that keeps coming back?",
    formThemesPlaceholder: "A place, a person, a feeling…",
    formThemesAdd: "Add",
    formThemesRemove: (name) => `Remove ${name}`,
    formBirthday: "Your birthday",
    formBirthdayHint: "Only for your star sign — leave it out if you'd rather.",
    formDone: "That's me",
    formVoiceInstead: "Talk to me instead",
    formClear: "Clear",
    selfieTitle: "One last thing",
    selfieText: "Add a photo and your dreams get their lead actor — your real face, in every frame. You can always do this later.",
    selfieAdd: "Add my photo",
    selfieSkip: "Not now",
    granted: "✦ Thanks — your profile is set",
    thanks: "✦ Thanks — your profile is set",
    profileCard: "Finish your profile with a 2-minute chat",
    profileCardHint: "Two minutes, nothing required",
    // Dev-only picker shown before the app decides anything — see
    // screens/Onboarding/StartMenu.jsx.
    startMenuTitle: "Before we go in",
    startMenuText: "See the onboarding flow, or skip straight to the app?",
    startMenuOnboarding: "Show onboarding",
    startMenuSkip: "Skip to app",
  },

  voice: {
    title: "telling a dream",
    cancel: "Close",
    connecting: "Waking up…",
    yourTurn: "Just talk — I'm listening",
    listening: "…",
    type: "type",
    finish: "done",
    send: "Send",
    typePlaceholder: "Or write it instead…",
    pickTitle: "Choose a voice",
    pickHint: "Tap a name to hear it",
    pickGo: "Sounds right",
    traits: { warm: "warm", soft: "soft", gentle: "gentle", young: "young", bright: "bright", deep: "deep" },
    errors: {
      NO_GEMINI_KEY: "⚠ No voice key on the server. Set GEMINI_KEY and restart.",
      MIC_DENIED: "⚠ Microphone access was blocked. Allow it in your browser settings.",
      UPSTREAM: "⚠ The voice service dropped out. Try again.",
      SOCKET: "⚠ Could not reach the voice service.",
      CLOSED: "⚠ The connection closed. Try again.",
      TIMEOUT: "⚠ The voice service didn't answer.",
    },
    /* Das gestaltete Fehler-Feld statt der toten Schleife: Überschrift,
       ein ruhiger Satz, zwei Wege raus. Antons Befund 21.08.: ohne
       Schlüssel hing der Schirm wortlos bei „Waking up…". */
    errorTitle: "That didn't work",
    errorHint: "Nothing is lost — you can try again, or type your dream instead.",
    retry: "Try again",
    back: "Back",
  },

  paywall: {
    title: "Dream Rushes Plus",
    close: "Close",
    headline: "Your dreams, as films.",
    lede: "Writing, voice and everything in the Sleep tab stay free. Credits are only for what the AI has to generate.",
    /* Die Ueberschrift richtet sich nach dem Anlass: wer selbst geoeffnet
       hat, bekommt das Angebot; wem das Blatt in den Weg gesprungen ist,
       bekommt zuerst den Grund. Siehe Paywall.jsx. */
    headlineFor: {
      browse: "Your dreams, as films.",
      spent: "Films need credits.",
      first: "That was your first one.",
    },
    ledeFor: {
      spent: "That's the one thing that costs money here. Writing, talking and everything in the Sleep tab stay free.",
      first: "It's in your journal now, and it's yours. The next one needs credits — here's what they cost.",
    },
    tabSub: "Subscribe",
    tabPack: "Buy credits",
    periodName: { week: "Weekly", month: "Monthly", year: "Yearly" },
    packName: (n) => `${n} credits`,
    packExtra: (pct) => `+${pct}%`,
    packExtraLine: (base, extra) => `${base} + ${extra} bonus credits`,
    per: { week: "per week", month: "per month", year: "per year" },
    oneTime: "one-time",
    save: (pct) => `Save ${pct}`,
    creditsPer: (n, period) => `${n} credits every ${period}`,
    /* Jahresabo zaehlt in MONATEN, nicht in Jahren: das Guthaben
       kommt monatlich, der Preis wird jaehrlich abgebucht. */
    periodUnit: {
      week: "week",
      month: "month",
      year: "year",
    },
    yieldImages: (n) => (n === 1 ? "image" : "images"),
    yieldFilms: (n) => (n === 1 ? "15-second film" : "15-second films"),
    upTo: "up to",
    yieldOr: "or",
    packNote: "Never expire — a little dearer per credit for it.",
    packYield: (i, f) => (f ? `${i} images, or up to ${f} ${f === 1 ? "film" : "films"}` : `${i} images`),
    /* Unter den Ertrags-Kacheln, nur beim Jahresabo: die Kacheln zeigen
       die Jahressumme (Antons Wunsch: „hochrechnen, damit es nach viel
       aussieht"), diese Zeile hält die ehrliche Mechanik daneben fest. */
    yieldYearNote: "Unused credits stay with you until your subscription year ends.",
    /* Jahresabo mit Startguthaben (14.09.2026, plans.js): der Kauftag bringt
       drei Monatsraten auf einmal, danach kommt jeden Monat etwas dazu. */
    startLine: (n, films) => `${n} credits right away — ${films} films`,
    thenEvery: (n) => `then +${n} every month`,
    included: "Always included, free",
    chips: [
      "Unlimited journaling", "Voice recording", "AI rewriting",
      "Sleep sounds", "Wind-down checklist", "Lucid guide", "Dream symbols",
    ],
    freeNote: "Only image and film generation costs credits — that is the part we pay the generative AI for.",
    cta: "Continue",
    renewNote: "Subscriptions renew automatically at the price shown until you cancel them in your Apple account settings, at least 24 hours before the current period ends. Payment is charged to your Apple ID.",
    termsLink: "Terms",
    privacyLink: "Privacy",
    notYet: "⚠ Payment is not connected yet — this is a preview of the plans.",
    /* StoreKit-Kaufstrecke (B1, 23.09.2026). */
    purchaseThanks: "Done — your credits are in.",
    purchaseFailed: "The purchase didn't go through. Nothing was charged — try again.",
    balance: (n) => `You currently have ${n} credits.`,
  },

  storyboard: {
    label: "Storyboard",
    scene: (i, n) => `Scene ${i} of ${n}`,
    // Zahl neben Wort ⇒ Funktion (Arität wird vom Shape-Check erzwungen).
    cutNote: (s) => `At ${s} seconds the dimmed scenes stay out of the film — a longer film keeps more of them.`,
    /* Stufe B: die Zeile unter der antippbaren Leiste — sagt Stand UND
       Grenze in einem Satz. */
    pickNote: (n, max) => `${n} of up to ${max} scenes at this length — tap a tile to swap it in or out.`,
    textOnly: "No picture is tied to this scene yet — the film builds it from the words.",
    fillScene: "Create this scene's image",
    scenePending: "This scene is being made — you'll get a note when it lands.",
    /* Den Szenentext vor dem Erzeugen anpassen (Antons Wunsch 22.08.).
       Der Hinweis sagt bewusst, dass die Änderung BLEIBT: Wer hier tippt,
       ändert den Bogen des Traums, nicht nur diesen einen Bildauftrag. */
    editBeat: "Adjust the wording",
    editHint: "Kept with the dream — the film uses these words too.",
    editSave: "Save wording",
    editCancel: "Leave it",
  },
  errors: {
    /* Der Server rechnet den Preis selbst und lag über dem angezeigten
       (HTTP 409). Nichts gerendert, nichts abgebucht — der neue Preis steht
       jetzt auf dem Knopf, ein zweiter Druck bestätigt ihn. */
    priceChanged: (quoted, actual) =>
      `The price has changed: ${actual} credits instead of ${quoted}. Nothing was made or charged — press again to confirm the new price.`,
    storageFull: "⚠ Storage full — delete old entries or reference photos.",
    unexpected: "Unexpected response from the server.",
    serverStatus: (s) => `Server responded with ${s}.`,
    // Ein Gast hat etwas Bezahltes versucht (S1) — das Anmelde-Blatt geht dazu auf.
    signIn: "Sign in to create dreams — it only takes a moment.",
    /* Für den Abbruch nach Zeit (AbortSignal in api.js): sagt, WAS man tun
       kann, nicht nur dass etwas schiefging. */
    timeout: "The service didn't answer. Check your connection and try again in a moment.",
    // Der Auftrag kam als gescheitert zurück — anders als ein Aussetzer,
    // den awaitJob einfach weiter versucht.
    renderFailed: "The generation didn't work out this time. Try again.",

    /* ── Warum es nicht ging (24.08.2026) ────────────────────────────────
       Bis hierher gab es genau EINEN Satz für jeden Fehlschlag, und er
       endete auf „Try again." Bei einem Policy-Verstoß ist das der einzige
       Rat, der garantiert nicht funktioniert: Der Text bleibt derselbe,
       also bleibt die Ablehnung dieselbe.

       ⚠ Die beiden Sätze unten sind GEGENSÄTZLICH — der eine schickt
       jemanden zum Traumtext, der andere zum Foto. Wer den falschen zeigt,
       schickt die Hälfte der Leute an die Stelle, an der nichts zu ändern
       ist. Deshalb rät falError.js beim Ort NICHT: Ist er unklar, kommt
       `policyPlain`. */
    /* ⚠ Kein Rat mehr, was man selbst tun koennte. Antons Einwand vom
       24.08.: „Nicht, weil es vom User zu viel verlangt, dass er das selbst
       doch editieren muss … Das erwarte ich von einer smarten App." Der
       Satz sagt jetzt nur noch, WAS passiert ist — was zu tun ist, steht
       auf dem Knopf direkt darunter. */
    policyPrompt: "Our image model turned this dream down — almost always a "
      + "protected character or brand name in the text.",
    policyImage: "Our image model turned the reference photo down. A "
      + "different picture of the same person usually works.",
    policyPlain: "Our image model turned this dream down. Rewording it, or "
      + "swapping a reference photo, usually gets it through.",
    /* Steht UNTER der Erklärung, nicht darin: Was zurückkam, ist Trost,
       kein Vorwurf. Die Zahl kommt aus dem Collector, der bereits erstattet
       hat, bevor dieser Satz erscheint. */
    /* Beide Modelle haben abgelehnt. Ab hier ist ein drittes Modell kein
       Angebot mehr, sondern eine Wette — der Text ist der einzige Hebel,
       der noch wirkt. */
    policyBothModels: "Both of our image models turned this dream down — it's the "
      + "wording, not the model. Letting the AI replace the name is the way through.",
    policyRefunded: (n) => `Nothing was charged — ${n} credit${n === 1 ? "" : "s"} went back to your balance.`,
  },
};
