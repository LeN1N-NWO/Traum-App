/* Das Film-Poster für die Kachel im Journal (Antons Wunsch 12.09.2026).
 *
 * Ablauf (server.js, finishPoster): 1. der Film wird gerendert, 2. sein
 * erstes Bild geht als Referenz an das Bildmodell — als INSPIRATION für
 * Szene, Figuren und Licht, nicht als Foto zum Abmalen. Titel und Tagline
 * kommen aus der Analyse (in der Traumsprache).
 *
 * Die Layoutregeln sind die des alten Posterbauers vom 10.08. (aus sieben
 * echten One-Sheets destilliert: Titanic, Gladiator, E.T., Pulp Fiction,
 * Léon, They Cloned Tyrone, Risky Business): EIN dominantes Motiv, strenge
 * Vertikale (Tagline oben, Motiv Mitte, Titel im unteren Drittel, Billing-
 * Block unten), Sperr-Palette, Typografie trägt das Genre. Welches Motiv-
 * Archetyp gilt, steht im `poster`-Feld des Stils (styles.js); Handwerks-
 * stile ohne Feld bekommen einen neutralen Archetyp aus ihrem Prompt.
 *
 * Format 2:3 (1024×1536) — Antons Vorgabe: „nicht 9:16, eher 1:1 oder
 * etwas, das unsere Kacheln füllt". Die Deck-Karte ist etwa 3:4; 2:3 ist
 * das nächste Maß, das GPT Image 2 als echte Größe kennt (imageModel.js:
 * die Presets wie portrait_16_9 sind winzig, 4:5 gibt es nicht). Gemessen
 * 12.09.: mit dem 9:16-Preset kam 608×1088 zurück. */
import { styleById } from "./styles.js";

export const POSTER_ASPECT = "2:3";
export const POSTER_SIZE = { width: 1024, height: 1536 };

const FALLBACK_POSTER = {
  archetype: "the film's key scene as one dominant motif, the main figure small against a generous, quiet background",
  lettering: "bold clean cinematic capitals, wide letter-spacing",
  palette: "the frame's own palette reduced to three tones plus one accent",
};

/** @param {{title:string, tagline?:string, styleId:string, withFrame?:boolean}} p */
export function buildPosterPrompt({ title, tagline = "", styleId, withFrame = true }) {
  const style = styleById(styleId) || styleById("ultrareal");
  const p = style?.poster || FALLBACK_POSTER;
  const taglineLine = tagline ? `Near the top, in small widely-spaced capitals: the tagline "${tagline}". ` : "";
  const frame = withFrame
    ? "\nImage 1 is a frame from the finished film: take its scene, its characters, wardrobe and light as the motif — it is the inspiration, not a photograph to copy. Compose the poster fresh."
    : "";
  return (
    `A theatrical film poster for an imaginary film, ${POSTER_ASPECT} vertical one-sheet.` +
    `\nCentral motif — commit to exactly ONE dominant visual idea, never a collage: ${p.archetype}.` +
    `\n${taglineLine}In the lower third, large and unmissable: the title "${title}" in ${p.lettering}. ` +
    `At the very bottom edge, a fine-print billing block of tiny illegible credit lines, like a real release poster.` +
    `\nRestricted palette: ${p.palette}.` +
    `\n${style?.prompt || ""}` +
    `\nRender the title${tagline ? " and tagline" : ""} EXACTLY as given, spelled correctly, as crisp printed typography. No other text, no logos, no watermarks.` +
    frame
  );
}
