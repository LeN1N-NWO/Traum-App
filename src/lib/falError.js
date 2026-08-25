/* Warum ein bezahlter Auftrag NICHT durchkam — und wie man es jemandem sagt.
 *
 * Antons Befund vom 24.08.2026: Er hat einen Traum mit Freddy Krüger
 * geschrieben, die Bilder kamen nie, und die App sagte nur:
 *
 *     „Die Generierung hat diesmal nicht geklappt. Versuch es noch mal."
 *
 * Beides war falsch. Der Grund stand fest, und er war nicht „diesmal":
 * fal antwortete mit `content_policy_violation` auf `body.prompt`, weil
 * „Freddy Krüger" eine geschützte Figur ist. „Versuch es noch mal" ist bei
 * einem Policy-Verstoß der genau falsche Rat — der zweite Versuch scheitert
 * mit derselben Begründung, und der dritte auch.
 *
 * ⚠ Die Begründung war DA und wurde weggeworfen: `jobStatus()` in server.js
 * hatte die Antwort als `data` in der Hand und schrieb `status: "failed"`
 * ohne sie. Selbst der Server wusste danach nicht mehr, warum.
 *
 * Diese Datei ist der reine Teil davon: Sie übersetzt fals Antwort in eine
 * ART, mit der die Oberfläche etwas anfangen kann. Kein Netzwerk, kein DOM,
 * keine Texte — die stehen in i18n, weil sie übersetzt gehören.
 *
 * ⚠ Bewusst NUR zwei Arten. Eine Liste von zwanzig Fehlerklassen wäre eine
 * Liste von zwanzig Übersetzungen, von denen neunzehn nie jemand sieht. Was
 * die Oberfläche wirklich unterscheiden muss, ist:
 *   "policy"  — der Text (oder das Foto) selbst ist das Problem. Nochmal
 *               drücken hilft nie; etwas ändern hilft immer.
 *   "unknown" — alles andere. Nochmal drücken hilft oft.
 */

/** fals Fehlerform, so wie sie am 24.08.2026 wirklich zurückkam:
 *
 *   { detail: [ { loc: ["body","prompt"],
 *                 msg: "The content could not be processed …",
 *                 type: "content_policy_violation" } ] }
 *
 *  ⚠ `detail` kann auch ein blanker String sein (andere fal-Fehler tun das),
 *  und bei einem Netzwerkaussetzer ist `data` schlicht null. Beides darf hier
 *  nichts werfen: Diese Funktion läuft im Fehlerpfad, und eine Ausnahme im
 *  Fehlerpfad kostet die Erstattung mit.
 */
export function failureReason(data) {
  const detail = data?.detail;
  const erste = Array.isArray(detail) ? detail[0] : null;

  const typ = String(erste?.type || "");
  const text = String(erste?.msg || (typeof detail === "string" ? detail : "") || "");

  const policy = typ === "content_policy_violation"
    /* Der Typ ist die verlässliche Quelle. Der Text ist die Rückfallebene für
       den Tag, an dem fal die Typbezeichnung ändert — dann fällt die Meldung
       auf „unknown" zurück und die App gibt wieder den nutzlosen Rat. */
    || /content polic|flagged by a content checker|safety system/i.test(text);

  if (!policy) return { kind: "unknown", where: null, msg: text.slice(0, 300) };

  /* WO es lag, entscheidet den Rat, den wir geben können, und die beiden
     Ratschläge sind gegensätzlich: Beim Prompt ändert man den TEXT, beim
     Bild tauscht man das FOTO. Wer hier rät, schickt die Hälfte der Leute
     an die falsche Stelle. Also nur sagen, was dasteht — sonst `null`, und
     die Oberfläche bleibt allgemein. */
  const loc = (erste?.loc || []).map(String);
  const where = loc.includes("prompt") ? "prompt"
    : loc.some((l) => l === "image" || l === "image_urls" || l === "image_url") ? "image"
    : null;

  return { kind: "policy", where, msg: text.slice(0, 300) };
}

/** Ist bei diesem Grund ein zweiter Versuch mit DEMSELBEN Modell sinnlos?
 *
 *  Daran hängt mehr als ein Knopf: Eine Bildkette, deren erste Szene an der
 *  Policy scheitert, darf die restlichen vier nicht auch noch einreichen.
 *  Sie enthalten denselben Namen und werden garantiert genauso abgelehnt —
 *  das ist derselbe Fehler viermal, nur langsamer. */
export function isHopeless(reason) {
  return reason?.kind === "policy";
}

/** Welcher Text aus `t.errors` zu diesem Grund gehört.
 *
 *  Die Zuordnung steht HIER und nicht in der Oberfläche, weil sie zweimal
 *  gebraucht wird — beim Toast und beim Traum im Journal — und weil sie
 *  eine Regel ist, keine Darstellung: Ein unklarer Ort muss auf den
 *  allgemeinen Satz fallen, nie auf einen geratenen. Der Rat „ändere deinen
 *  Text" und der Rat „tausch das Foto" schließen einander aus; wer rät,
 *  schickt die Hälfte der Leute an die falsche Stelle.
 */
export function failureTextKey(reason) {
  if (reason?.kind !== "policy") return "renderFailed";
  if (reason.where === "prompt") return "policyPrompt";
  if (reason.where === "image") return "policyImage";
  return "policyPlain";
}
