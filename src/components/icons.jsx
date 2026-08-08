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
