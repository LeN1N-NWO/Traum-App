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
    newDream: "Record a new dream",
  },

  splash: {
    loading: "Dream Rushes is loading",
  },

  home: {
    greeting: {
      night: "Still awake",
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Almost dream time",
    },
    title: "What did you dream?",
    lede: "Tell it while it's still warm — half-asleep works best.",
    cta: "Record it",
    streak: (n) => `${n} day${n === 1 ? "" : "s"}`,
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
  },

  /* Der Morgen-Check-in (Mehrwert P2a): eine Frage, drei grobe Stufen —
     beantwortbar, bevor man wach ist. */
  checkin: {
    question: "How did you sleep?",
    levels: { 1: "rough", 2: "okay", 3: "well" },
    emoji: { 1: "🌑", 2: "🌗", 3: "🌕" },
    thanks: "Noted — sleep and dreams meet in your atlas.",
  },


  /* Die Meilenstein-Leiter hinter der Streak-Pille. Ehrlich: nur, was
     existiert — die Wesen-Rarität steigt wirklich mit der Serie. */
  streakBoard: {
    title: "Your streak",
    /* Die Mini-Geschenke (Antons Ja 22.08.). Der Ton ist bewusst nüchtern:
       ein Credit ist ein Bild, keine Konfetti-Kanone. */
    gift: (nights, credits) =>
      `✦ ${nights} nights — ${credits} ${credits === 1 ? "credit" : "credits"} from us`,
    giftBadge: (credits) => `+${credits} ${credits === 1 ? "credit" : "credits"}`,
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
    nights: (n) => (n === 1 ? "night" : "nights"),
    next: (n) => (n === 1 ? "1 more night to the next milestone." : `${n} more nights to the next milestone.`),
    done: "Every milestone reached. You are the calendar now.",
    rung: (n) => `${n} nights`,
    rewards: {
      warm: "Rarer creatures begin to stir in your menagerie.",
      epic: "Epic creatures come within reach.",
      steady: "Peak odds — from here every creature rolls with your full streak bonus.",
      legendary: "Legendary territory: a month of nights, told.",
      keeper: "Keeper of dreams — two months, few ever get here.",
      hundred: "One hundred nights. Your journal is a book now.",
    },
    note: "The streak counts nights with a written dream — never the amount. A hundred dreams in one day is still one night.",
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
    /* Die Besetzungsliste. Die Zahl steht getrennt vom Wort, weil sie
       in Serife gesetzt wird — deshalb liefert castDreamsN NUR das
       Wort, so wie creditsN und yieldFilms es auch tun. */
    castDreamsN: (n) => (n === 1 ? "dream" : "dreams"),
    castNever: "not in a dream yet",
    castNew: "Add a figure",
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
    makeFilmLede: "Now bring it to life.",
    filmPending: "Making your video — hang tight",
    imagesPending: "Making your images — hang tight",
    makeFilm: "Make a short film",
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
      create: "Turning them into pictures",
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
    withdrawConsent: "Withdraw consent",
    withdrawConsentHint: "Nothing leaves your device until you agree again",
    done: "Done",
    credits: "credits",
    creditsSoon: "Top-up coming soon",
    you: "You",
    meSet: "Tap to change your photo or name",
    meEmpty: "Add a photo so dreams can put you in them",
    addPhoto: "Add your photo",
    changePhoto: "Change your photo",
    statDreams: "dreams",
    statStreak: "day streak",
    people: "People",
    pets: "Pets",
    places: "Places",
    new: "New",
    deleteLabel: (tag) => `Delete @${tag}`,
    editLabel: (tag) => `Edit @${tag}`,
    referenceFor: (tag) => `Reference photo for @${tag}`,
    removed: (tag) => `@${tag} removed`,
  },

  avatarDialog: {
    titleFor: { person: "Add a person", pet: "Add a pet", place: "Add a place" },
    kindLabel: "What is this?",
    kindFor: { person: "Person", pet: "Animal", place: "Place" },
    delete: "Delete",
    drawFromDesc: "Draw them from your description",
    drawingNow: "Drawing…",
    drawHint: "One reference image, so they look the same in every picture",
    editTitleFor: { person: "Edit person", pet: "Edit pet", place: "Edit place" },
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
    descPlaceholder: "tall, dark curly hair, always in a green coat",
    previewAlt: "Preview of the selected photo",
    privacy: "This photo is sent to fal.ai when a dream is rendered.",
    cancel: "Cancel",
    save: "Save",
    saveChanges: "Save changes",
    needName: "⚠ Please use letters or numbers for the name.",
    needPhotoOrDesc: "⚠ Add a photo or describe them — the AI needs one of the two.",
    needPhotoOrDescHint: "Add a photo or a description. Without either there is nothing to draw from.",
    exists: (tag) => `⚠ @${tag} already exists.`,
    created: (tag) => `@${tag} added`,
    saved: (tag) => `@${tag} updated`,
    readFailed: "⚠ Could not read that photo.",
  },

  tagCard: {
    label: (tag) => `About @${tag}`,
    categories: { person: "Person", pet: "Pet", place: "Place" },
    photoOnly: "No description — the photo is used on its own.",
    close: "Close",
  },

  lucid: {
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
    reminderSoon: "Noted. The reminders themselves arrive with the iPhone build — for now this only records that you want them.",
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
    interview: "Tell it out loud",
    interviewHint: "I'll ask, you talk — eyes closed if you like",
    reading: "Reading your dream…",
    readingHint: "Naming it, and picking out who was there.",
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
      reading: "Reading your dream…",
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
      undecided: "Not decided yet",
      note: "Anything left undecided is invented by the AI.",
      removeLabel: (name) => `Remove ${name}`,
      pickTitle: (name) => `Who is “${name}”?`,
      libraryEmpty: "Your library is still empty.",
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
      keyframeLabel: "Which image comes to life?",
      keyframeHint: "The film starts from this picture — its look carries through.",
      filmModelLabel: "Which model",
      filmModels: {
        standard: {
          name: "Alive", hint: "your opening image starts to move, with sound · up to 15 seconds",
          model: "MiniMax H3",
          info: "The quick tier: it brings your opening image convincingly to life, sound included, and carries up to four reference photos so the real faces stay themselves. Films top out at 15 seconds. Pick the quality below — the credits per second are shown on the switch.",
        },
        premium: {
          name: "Cinema", hint: "up to 30 seconds in one take, with sound",
          model: "Seedance 2.5",
          info: "The longest story: one unbroken take of up to 30 seconds, with sound and second-precise timing — and your reference photos stay in the film the whole way. Pick the quality below; the sharp tier costs more than double here, the credits are on the switch.",
        },
      },
      qualityLabel: "Quality",
      qualityNames: { sd: "Standard", hd: "Sharp" },
      aboutModel: "About this model",
      aboutStyle: "About this style",
      presets: {
        dreamflow: "Dreamflow",
        dreamflowSub: "No cuts — every scene becomes the next",
        dreamflowInfo: "One unbroken take. Nothing is cut: the office turns into the lift, the lift into the cockpit, the sky into the ground. The whole dream in a single flow — dream logic as the form itself. Renders in the soft, glowing look, because a hard photoreal edge works against transitions.",
      },
      paceLabel: "Pace",
      paceNames: { calm: "Calm", fast: "Fast", flow: "One flow" },
      paceHints: {
        calm: "Few cuts, room to breathe",
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

    step6: {
      title: "Your dream",
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
    processing: "My dream texts and the photos I upload may be sent to the AI services named below (fal.ai, Google, DeepSeek — and for films MiniMax or ByteDance) to create my images and films.",
    adult: "I am 18 or older.",
    more: "Where does my data go?",
    details: [
      "Your dream text goes to fal.ai and DeepSeek (which helps write the image instructions). Photos you upload go to fal.ai and Google only. Your journal itself stays on this device.",
      "Films are rendered by MiniMax (Hailuo) or ByteDance (Seedance), depending on the quality tier you pick — fal.ai passes your images and scene text on to them for exactly that render, nothing else.",
      "Rendered images and films are stored on our server so the app can show them to you.",
      "Training: Google's paid API does not train on your content. DeepSeek's paid API is not used for training by default. fal.ai may use anonymized usage data to improve its services.",
      "Only upload photos you are allowed to use — for photos of other people, ask them first.",
      "Everything you create is AI-generated and is marked as such when you share it.",
    ],
    cta: "Start dreaming",
  },

  /* Die lesbaren Rechtstexte hinter den zwei Links im Consent-Gate.
   * Verständlichkeit vor Juristendeutsch: kurze Abschnitte, ehrliche
   * Aussagen — redigiert vor dem Store-Launch ein Anwalt (der Hinweis
   * dazu steht sichtbar IM Text, nicht nur hier im Kommentar). Ändert
   * sich der Inhalt wesentlich, zählt CONSENT_VERSION hoch. */
  legal: {
    close: "Close",
    updated: "Last updated: 21 August 2026",
    draftNote: "Written in plain language on purpose. A lawyer will review these texts before the app reaches the app stores.",
    terms: {
      title: "Terms of Use",
      sections: [
        { h: "What Dream Rushes is",
          p: "Dream Rushes is a dream journal that can turn your dream descriptions and reference photos into AI-generated images and films. The journal itself works entirely on your device; rendering happens through outside AI services." },
        { h: "Your content stays yours",
          p: "You keep all rights to your dream texts, photos and generated results. You grant us and the AI services we name in the Privacy Notice a limited permission to process your material for one purpose only: creating the images and films you asked for. We never sell your content, and this permission ends when the processing is done." },
        { h: "What you promise us",
          p: "You only upload photos you are allowed to use — for photos of other people, you ask them first. You do not use the app to create unlawful, deceptive or abusive material, and you do not present generated scenes of real people as real events." },
        { h: "Age",
          p: "Dream Rushes is for adults. By using the app you confirm that you are 18 or older." },
        { h: "Credits and purchases",
          p: "Creating images and films costs credits; writing, voice and everything in the Sleep tab is free. Prices are always shown before you pay. Credits have no cash value and cannot be paid out; subscription credits expire at the end of each period, purchased packs do not." },
        { h: "AI-generated content",
          p: "Everything the AI produces is synthetic. It can be wrong, strange or unlike what you imagined — that is the nature of the technology, not a defect. Shared films carry a label that says they are AI-made; please leave it in place, in some countries the law requires it." },
        { h: "Availability",
          p: "Rendering depends on outside services we do not control. We work to keep the app available but cannot promise uninterrupted service; if a paid render fails, your credits are not charged." },
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
          p: "Your dream texts, the photos you upload, your voice while you talk to the assistant, and the images and films made from them. Your journal, your settings and your credit balance stay on your device — there is no account and no cloud copy of your diary." },
        { h: "Where your data goes",
          p: "Rendering happens at named AI services, each only for its job: DeepSeek helps write and analyse text, Google handles the voice conversation and image rendering, fal.ai renders images and passes films on to MiniMax (Hailuo) or ByteDance (Seedance) depending on the tier you choose. None of them receives more than the material needed for your specific render." },
        { h: "Training",
          p: "Google's paid API does not use your content to train models. DeepSeek's paid API is not used for training by default. fal.ai may use anonymized usage data to improve its services. We ourselves never use your material to train anything." },
        { h: "Storage and deletion",
          p: "Rendered images and films are stored on our server so the app can show and share them. Deleting a dream in your journal removes it from your device; automatic deletion of old renders on the server is being built and will be in place before public launch." },
        { h: "Legal basis",
          p: "We process your material based on your consent (Art. 6(1)(a) GDPR), which you give at the gate before your first dream, and on the contract with you (Art. 6(1)(b) GDPR) for everything needed to deliver what you ordered." },
        { h: "Transfers outside the EU",
          p: "fal.ai and Google process data in the United States; film rendering by MiniMax or ByteDance and text processing by DeepSeek can involve transfers to other third countries, including China. These transfers rest on the providers' contractual safeguards (standard contractual clauses). If you are not comfortable with that, do not upload photos — the journal works without them." },
        { h: "Your rights",
          p: "You can ask what we hold about you, have it corrected or deleted, take back your consent at any time, and complain to a data-protection authority. Withdrawing consent stops future processing; it does not undo renders already made." },
        { h: "Age",
          p: "The app is intended for adults (18+). We do not knowingly process the data of minors." },
        { h: "Changes to this notice",
          p: "If this notice changes in substance, the app will show it to you again and ask for fresh consent before your next dream." },
      ],
    },
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
    gateReward: "✦ Your first dream is on us",
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
    granted: "✦ Welcome — your first dream is on us",
    thanks: "✦ Thanks — your profile is set",
    profileCard: "Finish your profile with a 2-minute chat",
    profileCardHint: "✦ Your first dream is on us",
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
      spent: "You're out of credits.",
      first: "That was your first one.",
    },
    ledeFor: {
      spent: "That's the one thing that stops here. Writing, talking and everything in the Sleep tab stay free.",
      first: "It's in your journal now, and it's yours. The next one needs credits — here's what they cost.",
    },
    tabSub: "Subscribe",
    tabPack: "Buy credits",
    periodName: { week: "Weekly", month: "Monthly", year: "Yearly" },
    packName: (n) => `${n} credits`,
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
    yieldFilms: (n) => (n === 1 ? "film" : "films"),
    upTo: "up to",
    yieldOr: "or",
    packNote: "Never expire — a little dearer per credit for it.",
    packYield: (i, f) => (f ? `${i} images, or up to ${f} ${f === 1 ? "film" : "films"}` : `${i} images`),
    /* Unter den Ertrags-Kacheln, nur beim Jahresabo: die Kacheln zeigen
       die Jahressumme (Antons Wunsch: „hochrechnen, damit es nach viel
       aussieht"), diese Zeile hält die ehrliche Mechanik daneben fest. */
    yieldYearNote: "Your whole year — 45 fresh credits land every month.",
    included: "Always included, free",
    chips: [
      "Unlimited journaling", "Voice recording", "AI rewriting",
      "Sleep sounds", "Wind-down checklist", "Lucid guide", "Dream symbols",
    ],
    freeNote: "Only image and film generation costs credits — that is the part we pay the generative AI for.",
    cta: "Continue",
    notYet: "⚠ Payment is not connected yet — this is a preview of the plans.",
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
    storageFull: "⚠ Storage full — delete old entries or reference photos.",
    unexpected: "Unexpected response from the server.",
    serverStatus: (s) => `Server responded with ${s}.`,
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
