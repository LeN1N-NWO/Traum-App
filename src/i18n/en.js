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
      evening: "Good evening",
    },
    title: "What did you dream?",
    lede: "Tell it while it's still warm — half-asleep works best.",
    cta: "Record it",
    streak: (n) => `${n} day${n === 1 ? "" : "s"}`,
    lastHeading: "Last night",
    menagerieHeading: "Your menagerie",
    menagerieEmpty: "No creatures yet. Every dream you write down leaves one behind.",
    untitled: "Untitled dream",
  },

  journal: {
    viewList: "Show as a list",
    viewDeck: "Show as cards",
    library: "Your cast",
    libraryLede: "People, pets and places your dreams can draw on.",
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
    makeLede: "No pictures yet. Want some?",
    makeImages: "Make the images",
    makeFilmLede: "Now bring it to life.",
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
    title: "Symbols",
    subtitle: "Motifs that keep coming back",
    empty: "No symbols yet. Write down a few dreams and they'll show up here.",
    close: "Close",
    disclaimer: "A common reading, offered for reflection — not a diagnosis.",
    occurrences: (n) => (n === 1 ? "In 1 dream" : `In ${n} dreams`),
    untitled: "Untitled dream",
  },

  profile: {
    title: "Profile",
    credits: "credits",
    creditsSoon: "Top-up coming soon",
    you: "You",
    meSet: "Tap to change your photo",
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
    editTitleFor: { person: "Edit person", pet: "Edit pet", place: "Edit place" },
    meTitle: "This is you",
    nameLabel: (tag) => `Name (becomes @${tag})`,
    photoLabel: "Reference photo",
    photoAdd: "Add a photo",
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
    needPhotoOrDesc: "⚠ Add a photo or describe them — the renderer needs one of the two.",
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

  guide: [
    {
      title: "Reality checks",
      text: "Ask yourself several times a day whether you're dreaming — and actually " +
            "check: count your fingers, look at a clock, look away, look back. " +
            "In a dream the answer changes.",
    },
    {
      title: "MILD",
      text: "As you fall asleep, repeat: “Tonight I'll notice that I'm dreaming.” " +
            "Picture a dream you've had and imagine catching yourself inside it.",
    },
    {
      title: "WBTB",
      text: "Wake briefly after about five hours, stay up 20–30 minutes, then fall " +
            "back asleep using MILD. The most reliable method — and the one that " +
            "costs you sleep.",
    },
    {
      title: "Write it down",
      text: "Note your dreams right after waking, before you get up. People who " +
            "write regularly remember more — and start seeing their own patterns.",
    },
  ],

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
    tooShort: "⚠ Write a little more first.",
    noCredits: "Not enough credits. Top-up is coming soon.",
    progress: (n, total) => `Step ${n} of ${total}`,

    step1: {
      title: "What did you dream?",
      improve: "Improve with AI",
      reading: "Reading your dream…",
      why: "The AI retells your dream in your own language and works out who and " +
           "where appears in it. Everything after this — the characters, the " +
           "places, the images — is built on that.",
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
      styleLabel: "Style",
      formatLabel: "Format",
      portrait: "Phone, stories",
      landscape: "Widescreen",
      keyframeLabel: "Which image comes to life?",
      keyframeHint: "The film starts from this picture — its look carries through.",
      filmModelLabel: "Which renderer",
      filmModels: {
        standard: { name: "Standard", hint: "up to 15s · 1 credit a second" },
        premium:  { name: "Premium",  hint: "up to 30s in one take · 6 a second" },
      },
      lengthLabel: "How long",
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
      summaryImages: (n) => `${n} images in one continuous sequence.`,
      summaryFilm: "One still, brought to life.",
      summaryFilmLength: (s) => `${s} seconds of film. Rendering takes a few minutes — you can leave and come back.`,
      summaryRefs: (n) =>
        n === 0 ? "No reference photos — everything is invented."
                : n === 1 ? "1 reference photo will be used."
                          : `${n} reference photos will be used.`,
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
        text: "Reality checks, MILD, WBTB, journaling",
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
      autoStart: "Start my mix when the app opens",
      autoStartHint: "Browsers want one tap first — your mix starts with the first touch.",
      background: "The mix keeps playing wherever you go in the app. The speaker " +
                  "button in the top corner mutes it any time.",
    },
    soundsMute: "Mute sleep sounds",
    soundsUnmute: "Unmute sleep sounds",
  },

  onboarding: {
    tagline: "Your dreams, developed.",
    swipe: "swipe",
    slides: [
      { title: "Keep every dream",
        text: "Tell it half-asleep, out loud — the assistant asks the right " +
              "questions and writes the night down for you." },
      { title: "Visualise your dream",
        text: "It becomes a sequence of cinematic images — with the real " +
              "faces of the people, pets and places in it. Pick your " +
              "favourite and bring it to life as a short film." },
      { title: "There's more, free",
        text: "A guide to lucid dreaming, and what your recurring symbols " +
              "might mean — whenever you want them." },
    ],
    start: "Get started",
    gateTitle: "Make it yours",
    gateText: "A two-minute chat with the assistant personalises your " +
              "profile — how you dream, what keeps coming back, what to " +
              "call you. You can skip any question.",
    gateReward: "✦ 3 free credits when you finish",
    gateStart: "Let's talk",
    gateLater: "Maybe later",
    surveyTitle: "getting to know you",
    selfieTitle: "One last thing",
    selfieText: "Add a photo of yourself and your dreams can star YOU — " +
                "the images use your real face. You can always do this later.",
    selfieAdd: "Add my photo",
    selfieSkip: "Not now",
    granted: "✦ Welcome — 3 credits added",
    thanks: "✦ Thanks — your profile is set",
    profileCard: "Finish your profile with a 2-minute chat",
    profileCardHint: "✦ 3 free credits when you do",
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
    errors: {
      NO_GEMINI_KEY: "⚠ No voice key on the server. Set GEMINI_KEY and restart.",
      MIC_DENIED: "⚠ Microphone access was blocked. Allow it in your browser settings.",
      UPSTREAM: "⚠ The voice service dropped out. Try again.",
      SOCKET: "⚠ Could not reach the voice service.",
      CLOSED: "⚠ The connection closed. Try again.",
    },
  },

  paywall: {
    title: "Dream Rushes Plus",
    close: "Close",
    headline: "Your dreams, as films.",
    lede: "Writing, voice and everything in the Sleep tab stay free. Credits are only for what a renderer has to draw.",
    tabSub: "Subscribe",
    tabPack: "Buy credits",
    periodName: { month: "Monthly", year: "Yearly" },
    packName: (n) => `${n} credits`,
    per: { month: "per month", year: "per year" },
    oneTime: "one-time",
    save: (pct) => `Save ${pct}`,
    creditsPerMonth: (n) => `${n} credits every month`,
    creditsOnce: (n) => `${n} credits, never expire`,
    yield: (credits, five, three) =>
      `${credits} credits — about ${five} dreams with 5 images, or ${three} with 3. A film costs the same as 5 images.`,
    included: "Always included, free",
    chips: [
      "Unlimited journaling", "Voice recording", "AI rewriting",
      "Sleep sounds", "Wind-down checklist", "Lucid guide", "Dream symbols",
    ],
    freeNote: "Only image and film generation costs credits — that is the part we pay a renderer for.",
    cta: "Continue",
    notYet: "⚠ Payment is not connected yet — this is a preview of the plans.",
    balance: (n) => `You currently have ${n} credits.`,
  },

  errors: {
    storageFull: "⚠ Storage full — delete old entries or reference photos.",
    unexpected: "Unexpected response from the server.",
    serverStatus: (s) => `Server responded with ${s}.`,
  },
};
