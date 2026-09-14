import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useJournal } from "@/components/journal-data";
import { Celebration } from "@/components/celebration";
import LegacyOrder from "@/legacy/legacy-order";
import { showToast } from "@/store/toast-store";
import { currentTap } from "@/store/tap-store";
import { resetWizard, useWizardStore } from "@/store/wizard-store";
import { colors } from "@/theme";


/* Der Auftrag: Der Web-Motor (Step5Style.run) läuft UNSICHTBAR — er
   prüft den Preis, legt den Traum ins Journal und gibt den Filmauftrag
   ab; Geldweg und Prompt-Kette bleiben die des Web. Nativ steht davor nur
   das Abgeben: Faultier, ein wechselnder Satz. Sobald der Auftrag am Traum
   hängt, geht es ins Journal — KEIN Wartebildschirm (Antons Ansage
   21.08.): die Kachel sagt „wird gerade erstellt", der Abholer in der
   Brücke holt den Film, ein Toast meldet ihn. Scheitert das Abgeben,
   erscheint der Web-Motor mit seinem Fehlerblatt (Preis geändert, Server).
   Der erste eigene Traum öffnet danach einmal das Kaufblatt (Step6Result). */
/* ⚠ Vorarbeit (13.09.2026): Der Auftrag kann auch ohne Web-Motor laufen —
   Brücken-Befehl `order` (journal-bridge.jsx, runOrder) tut dasselbe wie
   Step5Style.run für den Film. Bleibt AUS, bis er an einem echten,
   bezahlten Auftrag belegt ist: Es ist der Geldweg. Zum Prüfen auf `true`
   setzen; der Ablauf darunter (Traum erscheint mit `pending`, dann mit
   Auftragsnummer → Journal) bleibt derselbe, nur der Fehlerfall zeigt statt
   des Web-Fehlerblatts einen Toast und geht zurück. */
const NATIVE_ORDER = false;

/* Seit 13.09.2026 steht hier statt des Faultiers die BELOHNUNG (Antons
   Ansage): Konfetti, „Wow — dein erster Traumfilm" bzw. „Traum Nr. N ist
   unterwegs", dann ins Journal. Mindestens so lange, dass man es sieht —
   auch wenn der Auftrag schneller am Traum hängt. */
const MIN_CELEBRATE_MS = 2800;

export default function DreamOrderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const w = useWizardStore();
  const { data, bridge, send, ask } = useJournal();
  const nativeStarted = useRef(false);
  useEffect(() => {
    if (!NATIVE_ORDER || nativeStarted.current || !data) return;
    nativeStarted.current = true;
    ask({ type: "order", order: { entryId: w.entryId, text: w.text, originalText: w.originalText, analysis: w.analysis, styleId: w.styleId, pace: w.pace, videoModel: w.videoModel, quality: w.quality, seconds: w.seconds, mode: w.mode, assignmentOverrides: w.assignmentOverrides } })
      .then((r) => {
        if (r.error === "nocredits") { router.replace({ pathname: "/dream/paywall", params: { reason: "spent" } }); return; }
        if (r.error) { showToast(`⚠ ${r.error}`); router.back(); }
      });
  }, [data, ask, router, w]);
  const W = data?.wizard;
  const [startedAt] = useState(() => Date.now());
  /* Tippt der Frosch (mascot-tap.tsx), beginnt die Feier im Moment des
     Treffers und platzt aus dem Knopf; ohne Frosch sofort, aus der Mitte. */
  const [tap] = useState(() => currentTap());
  const celebrateFrom = tap ? Math.max(startedAt, tap.tapAt) : startedAt;
  const [celebrating, setCelebrating] = useState(() => !tap || tap.tapAt <= Date.now());
  useEffect(() => {
    if (celebrating) return;
    const t = setTimeout(() => setCelebrating(true), Math.max(0, celebrateFrom - Date.now()));
    return () => clearTimeout(t);
  }, [celebrating, celebrateFrom]);
  const firstDream = useRef<boolean | null>(null);
  const mineId = useRef<string | null>(null);
  const [showWeb, setShowWeb] = useState(false);
  const done = useRef(false);
  const [number, setNumber] = useState<number | null>(null);

  // Der Stand VOR dem Auftrag entscheidet über das Erster-Traum-Kaufblatt.
  useEffect(() => {
    if (firstDream.current === null && data) firstDream.current = data.journal.realDreams === 0 && !data.profile.paywallSeen;
    if (number === null && data) setNumber(data.journal.realDreams + 1);
  }, [data]);

  useEffect(() => {
    if (done.current || !data) return;
    /* Der neue Traum: erst mit Marke „pending" (angelegt), dann mit
       Auftragsnummer (abgegeben). Verliert er die Marke OHNE Nummer, ist
       das Abgeben gescheitert — dann zeigt der Motor sein Fehlerblatt. */
    const mine = mineId.current
      ? data.items.find((e) => e.id === mineId.current)
      : w.entryId
        ? data.items.find((e) => e.id === w.entryId && (e.pending || e.rendering))   // neue Fassung: der bestehende Traum
        : data.items.find((e) => new Date(e.createdAt).getTime() >= startedAt - 15_000 && (e.pending || e.rendering));
    if (!mine) return;
    if (!mineId.current && w.audioUrl) send({ type: "attachAudio", id: mine.id, audioUrl: w.audioUrl });   // die Aufnahme an den Traum (ADR-0007)
    mineId.current = mine.id;
    if (mine.rendering) {
      done.current = true;
      showToast(W?.queuedNote ?? "");
      /* Seit es kein Willkommensgeschenk mehr gibt (14.09.2026), ist auch der
         erste Film bezahlt. „Der nächste braucht Credits" stimmt dann nur,
         wenn der Rest keinen weiteren Film trägt — sonst kein Kaufblatt. */
      const first = !!firstDream.current && (data.profile.credits ?? 0) < (W?.filmFrom ?? 0);
      if (first) send({ type: "paywallSeen" });
      /* Nicht sofort weg: der Befehl (Aufnahme anhaengen) laeuft im
         Bruecken-Webview DIESES Bildschirms. Verschwindet er im selben
         Tick, haengt die Aufnahme nie am Traum (Antons Befund 12.09.). */
      setTimeout(() => {
        resetWizard();
        router.dismissAll();
        router.navigate("/journal");
        if (first) setTimeout(() => router.push({ pathname: "/journal/paywall", params: { reason: "first" } }), 900);
      }, Math.max(celebrateFrom + MIN_CELEBRATE_MS - Date.now(), w.audioUrl ? 900 : 50));
    } else if (mine.failReason || !mine.pending) {
      setShowWeb(true);
    }
  }, [data, W, router, send, w.audioUrl, w.entryId]);

  // Rückfall: Meldet sich nach zwei Minuten kein Traum, zeigt der Motor, was los ist.
  useEffect(() => { const id = setTimeout(() => setShowWeb(true), 120_000); return () => clearTimeout(id); }, []);

  const n = number ?? (data ? data.journal.realDreams + 1 : 1);
  const title = w.entryId ? (W?.rendering ?? "") : n <= 1 ? (W?.celebrateFirst ?? "") : String(W?.celebrateN ?? "").replace("{n}", String(n));
  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      {!showWeb ? (
        <View style={[styles.stage, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {W && celebrating ? <Celebration title={title} text={W.celebrateText ?? ""} hint={W.celebrateHint} origin={tap ? { x: tap.rect.x + tap.rect.width / 2, y: tap.rect.y + tap.rect.height / 2 - insets.top } : undefined} /> : null}
        </View>
      ) : null}
      <View style={showWeb ? styles.web : styles.hidden}>
        {NATIVE_ORDER ? null : <LegacyOrder safeTop={insets.top} safeBottom={insets.bottom} order={{ entryId: w.entryId, text: w.text, originalText: w.originalText, analysis: w.analysis, styleId: w.styleId, pace: w.pace, videoModel: w.videoModel, quality: w.quality, seconds: w.seconds, orderId: w.orderId, assignmentOverrides: w.assignmentOverrides, mode: w.mode }} dom={{ style: { flex: 1, backgroundColor: "#0a0d16" }, contentInsetAdjustmentBehavior: "never" }} />}
      </View>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: colors.bg },
  web: { flex: 1 },
  hidden: { height: 0, opacity: 0, overflow: "hidden" },
  bridge: { height: 0, overflow: "hidden" },
});
