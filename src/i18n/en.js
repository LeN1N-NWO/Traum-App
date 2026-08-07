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
    newDream: "Record a new dream",
  },

  splash: {
    loading: "Dream Rushes is loading",
  },

  home: {
    kicker: "Your subconscious, directed",
    title1: "Record your dream.",
    title2: "Get a film.",
    lede: "Tell it while it's still warm — half-asleep works best.",
    cta: "Record your dream",
    streak: (n) => `${n} day${n === 1 ? "" : "s"}`,
    lastHeading: "Last night",
    menagerieHeading: "Your menagerie",
    menagerieEmpty: "No creatures yet. Every dream you write down leaves one behind.",
    untitled: "Untitled dream",
  },

  journal: {
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
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
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
    credits: "Credits",
    creditsSoon: "Top-up coming soon",
    people: "People",
    pets: "Pets",
    places: "Places",
    guide: "Learn to lucid dream",
    new: "New",
    deleteLabel: (tag) => `Delete @${tag}`,
    referenceFor: (tag) => `Reference photo for @${tag}`,
    removed: (tag) => `@${tag} removed`,
  },

  avatarDialog: {
    titleFor: { person: "Add a person", pet: "Add a pet", place: "Add a place" },
    nameLabel: (tag) => `Name (becomes @${tag})`,
    photoLabel: "Reference photo",
    previewAlt: "Preview of the selected photo",
    privacy: "This photo is sent to fal.ai when a dream is rendered.",
    cancel: "Cancel",
    save: "Save",
    needName: "⚠ Please use letters or numbers for the name.",
    exists: (tag) => `⚠ @${tag} already exists.`,
    created: (tag) => `@${tag} added`,
    readFailed: "⚠ Could not read that photo.",
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
             "Reference photos go to fal.ai only. Your journal stays on this device.",
    submit: "✦ Summon the dream",
    submitting: "Summoning…",
    tooShort: "⚠ Write a little more first.",
    caught: (name) => `✦ ${name} joined your menagerie`,
    voiceReady: "🎙 voice ready",
    voiceListening: "● listening…",
    voiceLabel: "Speak your dream",
    loading: [
      "Developing your rushes…",
      "Editing the fog…",
      "Colour-grading your subconscious…",
      "Summoning what you saw…",
      "Almost lucid…",
    ],
  },

  errors: {
    storageFull: "⚠ Storage full — delete old entries or reference photos.",
    unexpected: "Unexpected response from the server.",
    serverStatus: (s) => `Server responded with ${s}.`,
  },
};
