import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/glass";
import { isLockEnabled, unlock } from "@/lib/privacy-lock";
import { useJournalStore } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Das Sperr-Tor (Antons Ansage 22.09.2026): Liegt der Schalter in den
   Einstellungen auf An, deckt diese Schicht die App beim Start und bei
   jeder Rückkehr ab, bis Face ID (oder der Gerätecode) entsperrt.

   ⚠ Absichtlich KEIN <Modal>: Einwilligungs-Tor und Onboarding sind schon
   zwei Vollbild-Modals im Wurzel-Layout, und iOS präsentiert Geschwister-
   Modals unzuverlässig übereinander. Diese Schicht liegt als letzte View
   über den Tabs — dieselbe Technik wie MascotTapLayer, nur deckend.
   Preis: Ein offenes Modal (Onboarding) liegt ÜBER dem Tor; es zeigt
   keine Träume, das Tor fängt den Rest dahinter.

   Beim Kaltstart deckt das Tor, BIS der Schlüsselbund gelesen ist
   (Sekundenbruchteil): lieber ein kurzer dunkler Moment für alle als ein
   offener Blick auf die Träume für die, die gesperrt haben.

   Die Texte kommen aus der Brücke, sobald sie da ist — das Tor steht aber
   VOR ihr, deshalb tragen die Rückfälle hier englische Konstanten
   (Ausnahme von „alle Texte in en.js“, Begründung: en.js:449). */
const FALLBACK = { locked: "Your dreams are locked.", unlock: "Unlock", prompt: "Unlock your dreams" };

export function PrivacyGate() {
  const P = useJournalStore()?.profile?.settingsPage?.privacy;
  const [enabled, setEnabled] = useState<boolean | null>(null); // null = Schlüsselbund noch nicht gelesen
  const [locked, setLocked] = useState(false);
  const [covered, setCovered] = useState(false); // App-Umschalter: abdecken, ohne zu sperren
  const busy = useRef(false); // nie zwei Face-ID-Dialoge übereinander

  const tryUnlock = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try { if (await unlock(P?.title ?? FALLBACK.prompt)) setLocked(false); }
    finally { busy.current = false; }
  }, [P?.title]);

  useEffect(() => {
    let alive = true;
    isLockEnabled().then((on) => {
      if (!alive) return;
      setEnabled(on);
      if (on) setLocked(true);
    }).catch(() => { if (alive) setEnabled(false); });
    return () => { alive = false; };
  }, []);

  /* Erster Dialog von selbst, sobald gesperrt — danach nur noch über den
     Knopf (wer den Systemdialog wegtippt, soll nicht sofort den nächsten
     bekommen). */
  const asked = useRef(false);
  useEffect(() => {
    if (locked && !asked.current) { asked.current = true; tryUnlock(); }
    if (!locked) asked.current = false;
  }, [locked, tryUnlock]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "inactive") { setCovered(true); return; }
      if (state === "background") {
        setCovered(true);
        /* Beim Verlassen neu lesen: so greift der Schalter aus den
           Einstellungen spätestens ab der nächsten Rückkehr. */
        isLockEnabled().then((on) => { setEnabled(on); if (on) setLocked(true); }).catch(() => {});
        return;
      }
      setCovered(false);
    });
    return () => sub.remove();
  }, []);

  const show = enabled === null || locked || covered;
  if (!show) return null;

  return (
    <View style={styles.cover} pointerEvents="auto">
      <SymbolView name="moon.stars.fill" size={56} tintColor={colors.accentSoft} />
      <Text style={styles.brand}>Dream Rushes</Text>
      {locked && !covered ? (
        <View style={styles.body}>
          <Text style={styles.text}>{P?.locked ?? FALLBACK.locked}</Text>
          <PrimaryButton label={P?.unlock ?? FALLBACK.unlock} heavy onPress={tryUnlock} style={{ flex: 0, alignSelf: "stretch" }} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 32 },
  brand: { color: colors.text, fontSize: 22, fontFamily: fonts.serif, letterSpacing: 0.5 },
  body: { alignSelf: "stretch", alignItems: "center", gap: 18, marginTop: 22 },
  text: { color: colors.muted, fontSize: 15, textAlign: "center" },
});
