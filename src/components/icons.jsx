/* The app's icon set — one visual language, not a bag of emoji.
 *
 * All of them: 24×24 box, stroked in currentColor at the same weight, round
 * caps and joins, nothing filled. That is what makes a row of them read as
 * one family. Emoji cannot do this: every platform draws its own, at its own
 * weight, in its own colours.
 */
const base = {
  viewBox: "0 0 24 24", width: 24, height: 24,
  fill: "none", stroke: "currentColor", strokeWidth: 1.6,
  strokeLinecap: "round", strokeLinejoin: "round",
  "aria-hidden": "true",
};

export function IconMoon() {
  return (
    <svg {...base}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z" />
    </svg>
  );
}

export function IconBook() {
  return (
    <svg {...base}>
      <path d="M4 5.5A2 2 0 0 1 6 4h5v16H6a2 2 0 0 0-2 1.2Z" />
      <path d="M20 5.5A2 2 0 0 0 18 4h-5v16h5a2 2 0 0 1 2 1.2Z" />
    </svg>
  );
}

/* Sleep: the crescent again would collide with Home, so this is the pillow —
   a bed seen from the side, the calmest unambiguous sleep glyph. */
export function IconBed() {
  return (
    <svg {...base}>
      <path d="M3 6v13" />
      <path d="M3 10h15a3 3 0 0 1 3 3v6" />
      <path d="M3 17h18" />
      <path d="M7.5 10v-.6a1.4 1.4 0 0 1 1.4-1.4h2.2" />
    </svg>
  );
}

export function IconSparkle() {
  return (
    <svg {...base}>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9Z" />
      <path d="M18.5 4.2v2.6M17.2 5.5h2.6" />
    </svg>
  );
}

export function IconPerson() {
  return (
    <svg {...base}>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

/* A sequence of stills — three overlapping frames, the middle one forward,
   so it reads as pictures in a row rather than one photo. */
export function IconImages() {
  return (
    <svg {...base}>
      <rect x="3" y="7" width="13" height="13" rx="2.2" transform="rotate(-8 9.5 13.5)" opacity=".55" />
      <rect x="7" y="4" width="14" height="14" rx="2.2" />
      <circle cx="12.3" cy="9.6" r="1.4" />
      <path d="M8.5 15.2 11 12.6a1.4 1.4 0 0 1 2 0l1 1 1.6-1.7a1.4 1.4 0 0 1 2 0L20 14.5" />
    </svg>
  );
}

/* Spellcheck: the "abc" of a proofreading mark with a tick under it. Reads
   as "check the letters themselves", which is exactly what this mode does
   and nothing more. */
export function IconSpellcheck() {
  return (
    <svg {...base}>
      <path d="M3.5 14 7 5.5 10.5 14" />
      <path d="M4.7 11.2h4.6" />
      <path d="M13.5 20.5 16 23l5.5-6" />
      <path d="M13.5 14c0-2 1.4-3.2 3.2-3.2 1.9 0 3 1 3 3V16" />
      <path d="M19.7 12.8c-3.6 0-5.4.8-5.4 2.4 0 1 .8 1.7 2 1.7 1.7 0 3.4-1.2 3.4-3" />
    </svg>
  );
}

export function IconPencil() {
  return (
    <svg {...base}>
      <path d="M4 20h4L19.2 8.8a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14.8 4.4 4.8 4.8" />
    </svg>
  );
}

export function IconTrash() {
  return (
    <svg {...base}>
      <path d="M4 6.5h16" />
      <path d="M9.5 6.5V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7" />
      <path d="M6.3 6.5 7 19.2a1.6 1.6 0 0 0 1.6 1.5h6.8a1.6 1.6 0 0 0 1.6-1.5l.7-12.7" />
      <path d="M10.4 10.3v6.6M13.6 10.3v6.6" />
    </svg>
  );
}

export function IconShare() {
  return (
    <svg {...base}>
      <path d="M12 15V4" />
      <path d="m8.4 7.4 3.6-3.4 3.6 3.4" />
      <path d="M6 12H4.8A.8.8 0 0 0 4 12.8v6.4a.8.8 0 0 0 .8.8h14.4a.8.8 0 0 0 .8-.8v-6.4a.8.8 0 0 0-.8-.8H18" />
    </svg>
  );
}

/* The "this leads somewhere" mark at the end of a row. Same stroke family as
   the rest, so it does not read as a typographic ">" borrowed from the font. */
export function ChevronRight() {
  return (
    <svg {...base} width="18" height="18">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/* Settings: six teeth, not the usual twelve — at 24px a fine-toothed gear
   turns into a fuzzy circle. Fewer, larger teeth still read as "gear". */
export function IconGear() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.6v2.6M12 18.8v2.6M21.4 12h-2.6M5.2 12H2.6M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8M18.6 18.6l-1.8-1.8M7.2 7.2 5.4 5.4" />
    </svg>
  );
}

/* A filmstrip, not a clapperboard — sprocket holes read at 24px, a clapper's
   hinge and stripes do not. */
export function IconFilm() {
  return (
    <svg {...base}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M8 5v14M16 5v14" />
      <path d="M3.5 9h2.2M18.3 9h2.2M3.5 15h2.2M18.3 15h2.2" />
    </svg>
  );
}
