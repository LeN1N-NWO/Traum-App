import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useJournal } from "@/components/journal-data";
import { MascotLoader } from "@/components/mascot-loader";
import LegacyOrder from "@/legacy/legacy-order";
import { showToast } from "@/store/toast-store";
import { resetWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts } from "@/theme";


/* Der Auftrag: Der Web-Motor (Step5Style.run) läuft UNSICHTBAR — er
   prüft den Preis, legt den Traum ins Journal und gibt den Filmauftrag
   ab; Geldweg und Prompt-Kette bleiben die des Web. Nativ steht davor nur
   das Abgeben: Faultier, ein wechselnder Satz. Sobald der Auftrag am Traum
   hängt, geht es ins Journal — KEIN Wartebildschirm (Antons Ansage
   21.08.): die Kachel sagt „wird gerade erstellt", der Abholer in der
   Brücke holt den Film, ein Toast meldet ihn. Scheitert das Abgeben,
   erscheint der Web-Motor mit seinem Fehlerblatt (Preis geändert, Server).
   Der erste eigene Traum öffnet danach einmal das Kaufblatt (Step6Result). */
export default function DreamOrderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const w = useWizardStore();
  const { data, bridge, send } = useJournal();
  const W = data?.wizard;
  const startedAt = useRef(Date.now());
  const firstDream = useRef<boolean | null>(null);
  const mineId = useRef<string | null>(null);
  const [msg, setMsg] = useState(0);
  const [showWeb, setShowWeb] = useState(false);
  const done = useRef(false);

  useEffect(() => { const id = setInterval(() => setMsg((m) => m + 1), 2600); return () => clearInterval(id); }, []);

  // Der Stand VOR dem Auftrag entscheidet über das Erster-Traum-Kaufblatt.
  useEffect(() => {
    if (firstDream.current === null && data) firstDream.current = data.journal.realDreams === 0 && !data.profile.paywallSeen;
  }, [data]);

  useEffect(() => {
    if (done.current || !data) return;
    /* Der neue Traum: erst mit Marke „pending" (angelegt), dann mit
       Auftragsnummer (abgegeben). Verliert er die Marke OHNE Nummer, ist
       das Abgeben gescheitert — dann zeigt der Motor sein Fehlerblatt. */
    const mine = mineId.current
      ? data.items.find((e) => e.id === mineId.current)
      : data.items.find((e) => new Date(e.createdAt).getTime() >= startedAt.current - 15_000 && (e.pending || e.rendering));
    if (!mine) return;
    if (!mineId.current && w.audioUrl) send({ type: "attachAudio", id: mine.id, audioUrl: w.audioUrl });   // die Aufnahme an den Traum (ADR-0007)
    mineId.current = mine.id;
    if (mine.rendering) {
      done.current = true;
      showToast(W?.queuedNote ?? "");
      resetWizard();
      if (firstDream.current) send({ type: "paywallSeen" });
      router.dismissAll();
      router.navigate("/journal");
      if (firstDream.current) setTimeout(() => router.push({ pathname: "/journal/paywall", params: { reason: "first" } }), 900);
    } else if (mine.failReason || !mine.pending) {
      setShowWeb(true);
    }
  }, [data, W, router, send, w.audioUrl]);

  // Rückfall: Meldet sich nach zwei Minuten kein Traum, zeigt der Motor, was los ist.
  useEffect(() => { const id = setTimeout(() => setShowWeb(true), 120_000); return () => clearTimeout(id); }, []);

  const loading = W?.loading ?? [];
  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      {!showWeb ? (
        <View style={[styles.stage, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
          <MascotLoader size={200} />
          <Text style={styles.title}>{W?.step6Title ?? ""}</Text>
          <Text style={styles.text}>{loading.length ? loading[msg % loading.length] : ""}</Text>
          <Text style={styles.hint}>{W?.renderingHint ?? ""}</Text>
        </View>
      ) : null}
      <View style={showWeb ? styles.web : styles.hidden}>
        <LegacyOrder safeTop={insets.top} safeBottom={insets.bottom} order={{ text: w.text, originalText: w.originalText, analysis: w.analysis, styleId: w.styleId, pace: w.pace, videoModel: w.videoModel, quality: w.quality, seconds: w.seconds, orderId: w.orderId, assignmentOverrides: w.assignmentOverrides, mode: w.mode }} dom={{ style: { flex: 1, backgroundColor: "#0a0d16" }, contentInsetAdjustmentBehavior: "never" }} />
      </View>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.text, textAlign: "center" },
  text: { color: colors.text, fontSize: 16, textAlign: "center", lineHeight: 23 },
  hint: { color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20 },
  web: { flex: 1 },
  hidden: { height: 0, opacity: 0, overflow: "hidden" },
  bridge: { height: 0, overflow: "hidden" },
});
