/* The seven languages the app can run in.
 *
 * `id` is the file name under src/i18n/ AND the value sent to the voice
 * relay — server.js maps it to a full English language name in its own
 * LANGUAGE_NAMES table (see server.js near voiceSystem()), so this id only
 * ever needs to survive the [A-Za-z0-9-] sanitiser already in place for
 * BCP-47 tags. Never widen it to a display name.
 *
 * `label` is written in the language ITSELF, not translated — someone who
 * cannot yet read the interface still has to recognise their own language
 * in this list, the one screen where translating the label would defeat
 * the label's purpose.
 *
 * `rtl` drives `document.documentElement.dir` (see i18n/index.js). Layout
 * mirroring beyond that — text direction, form controls, native bidi — is
 * what the browser gives for free from `dir="rtl"`. Custom flex/absolute
 * layouts across the app are NOT individually audited for it; see the
 * 09.08.2026 worklog entry for what that means in practice.
 */
export const LOCALES = [
  { id: "en", label: "English", rtl: false },
  { id: "de", label: "Deutsch", rtl: false },
  { id: "es", label: "Español", rtl: false },
  { id: "fr", label: "Français", rtl: false },
  { id: "zh", label: "中文", rtl: false },
  { id: "hi", label: "हिन्दी", rtl: false },
  { id: "ar", label: "العربية", rtl: true },
];

export const DEFAULT_LOCALE = "en";

export function localeOf(id) {
  return LOCALES.find((l) => l.id === id) || LOCALES.find((l) => l.id === DEFAULT_LOCALE);
}
