/* Was man anbieten kann, wenn ein Traum nicht durchkam.
 *
 * Antons Ansage vom 24.08.2026, in zwei Teilen:
 *
 *   „Ihm sollten zwei Wege vorgeschlagen werden: ein anderes Modell
 *   probieren — umzuschreiben. Wenn er das andere Modell probiert und es
 *   immer noch Probleme gibt, dann bleibt eigentlich nur noch die Funktion
 *   zum Umschreiben. Das System muss so schlau sein, das zu verstehen."
 *
 * Und davor, zur ersten Fassung, die nur einen Rat gab:
 *
 *   „Nicht, weil es vom User zu viel verlangt, dass er das selbst doch
 *   editieren muss … Das erwarte ich von einer smarten App."
 *
 * ⚠ Warum das eine eigene Datei ist und keine drei Bedingungen im JSX:
 * Es sind DREI Zustände, und der dritte entsteht erst nach einem bezahlten
 * Fehlversuch. Wer ihn im Bildschirm verdrahtet, kann ihn nur prüfen, indem
 * er ihn herstellt — und das kostet jedes Mal Geld. Hier kostet es nichts.
 */

/** Was diesem Traum jetzt anzubieten ist.
 *
 *  @returns {{ rewrite: boolean, otherModel: boolean, retry: boolean,
 *              message: "policyPrompt"|"policyImage"|"policyPlain"|
 *                       "policyBothModels"|"renderFailed"|null }}
 */
export function recoveryOptions(entry, { fallbackAvailable = true } = {}) {
  const grund = entry?.failReason || null;
  if (!grund) return { rewrite: false, otherModel: false, retry: false, message: null };

  const policy = grund.kind === "policy";
  /* ⚠ „Plan B ist verbraucht" heißt: Dieser Traum LIEF schon mit dem
     Ausweichmodell — und steht trotzdem wieder mit einem Grund da. Die Marke
     setzt der Wizard beim Plan-B-Lauf an den Eintrag; ohne sie böte die App
     sechs Credits für ein sicheres Nein an. */
  const planBVerbraucht = entry.fallback === true;

  return {
    /* Umschreiben hilft nur, wenn der TEXT beanstandet wurde. Bei einer
       Foto-Ablehnung ist der Traumtext unschuldig, und ihn umzuschreiben
       wäre Beschäftigungstherapie. */
    rewrite: policy && grund.where === "prompt",
    otherModel: policy && !planBVerbraucht && fallbackAvailable,
    /* Unverändert noch einmal senden ist bei einem Policy-Verstoß garantiert
       vergeblich — es bleibt trotzdem erreichbar, nur nie als erster Knopf:
       Es ist sein Traum und seine Credits. */
    retry: true,
    message: !policy ? "renderFailed"
      : planBVerbraucht ? "policyBothModels"
      : grund.where === "prompt" ? "policyPrompt"
      : grund.where === "image" ? "policyImage"
      : "policyPlain",
  };
}
