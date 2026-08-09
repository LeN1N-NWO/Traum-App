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
    settings: "Settings",
    voiceSetting: "Assistant voice",
    voiceSettingHint: "Which voice talks to you",
    done: "Done",
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

  lucid: {
    lede: "Lucid dreaming means noticing you're dreaming while it happens — and sometimes steering what comes next. It can be learned: in the largest comparison study to date, one week of practice was enough for many people. Here is what the evidence actually supports, including the part that contradicts most advice you'll find online.",
    leversTitle: "What actually moves the needle",
    levers: [
      { stat: "18 % vs 11 %", title: "Get back to sleep fast",
        text: "The biggest single difference in the whole study wasn't which technique people used — it was falling asleep again within ten minutes of doing it. Lie down straight away. No phone." },
      { stat: "18 % vs 6 %", title: "Wake after about five hours",
        text: "Nights with a short wake-up produced three times as many lucid dreams as nights without. Nearly every method below is built on this one moment." },
      { stat: "the groundwork", title: "Keep writing dreams down",
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
        id: "ssild", name: "SSILD — Senses initiated", rate: "16.9 %",
        summary: "Cycle through sight, sound and touch until you drift off. The best result in the study, and the least effort.",
        steps: [
          "After the five-hour wake-up, lie down comfortably.",
          "Four quick rounds: eyes (whatever you see behind closed lids), ears (whatever you can hear), body (the weight of the blanket). Two or three seconds each — don't linger.",
          "Then four to six slow rounds: about twenty seconds per sense.",
          "Stop, roll into your normal sleeping position, and let yourself fall asleep.",
        ],
        note: "Trying hard is the classic mistake. The rounds are meant to leave you drowsy, not alert — if you're still concentrating, you've overdone it. Falling asleep during the slow rounds is a success, not a failure.",
      },
      {
        id: "mild", name: "MILD — Intention before sleep", rate: "16.5 %",
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
      autoStart: "Start my mix when the app opens",
      autoStartHint: "Browsers want one tap first — your mix starts with the first touch.",
      background: "The mix keeps playing wherever you go in the app. The speaker " +
                  "button in the top corner mutes it any time.",
    },
    soundsMute: "Mute sleep sounds",
    soundsUnmute: "Unmute sleep sounds",
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
    gateLater: "Maybe later",
    surveyTitle: "getting to know you",
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
