import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Glass } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { appleReauthCode } from "@/lib/apple-reauth";
import { deleteAccount, logout, restoreSession, useAccount } from "@/lib/auth";
import { canLock, isLockEnabled, setLockEnabled, unlock } from "@/lib/privacy-lock";
import { colors, TAB_INSET } from "@/theme";

/* Einstellungen, nativ — Settings.jsx im Aufbau: eine LISTE (die zweite
   und dritte Einstellung kommen), Stimme mit dem aktuellen Wert in der
   Zeile, die Rechtstexte, der Widerruf. Nativ als geschobene Seite mit
   Systemkopf statt Blatt; die Stimmwahl kommt als Karte. */
export default function SettingsScreen() {
  const router = useRouter();
  const { data, bridge, send } = useJournal();
  const p = data?.profile;
  const S = p?.settingsPage;
  /* Das Konto (Hannis Backend): angemeldet als … / Abmelden. Abmelden
     macht beides — Token bei Supabase ungültig UND vom Gerät (lib/auth.ts).
     Anmelden geht heute nur im Onboarding; hier steht der Stand. */
  const account = useAccount();
  useEffect(() => { restoreSession().catch(() => {}); }, []);

  /* Face-ID-Schalter (22.09.2026): Die Marke liegt im Schlüsselbund
     (privacy-lock.ts), nicht in der Brücke — das Tor steht vor ihr.
     Einschalten prüft erst, ob das Gerät sperren KANN (sonst wäre es eine
     Selbstaussperrung) und verlangt einmal Face ID als Probe; Ausschalten
     verlangt Face ID, damit nicht jeder mit dem offenen Telefon den
     Schutz abräumt. */
  const [lock, setLock] = useState<boolean | null>(null);
  useEffect(() => { isLockEnabled().then(setLock).catch(() => setLock(false)); }, []);
  const toggleLock = async (on: boolean) => {
    Haptics.selectionAsync();
    const Pv = S?.privacy;
    if (on && !(await canLock())) { Alert.alert(Pv?.title ?? "Face ID", Pv?.noBio ?? ""); return; }
    if (!(await unlock(Pv?.title ?? "Face ID"))) return;
    await setLockEnabled(on);
    setLock(on);
  };

  /* Sprachwahl (22.09.2026): aufklappbare Zeile, die Namen in ihrer
     eigenen Sprache (locales.js). Der Befehl geht durch die Brücke; der
     nächste Snapshot liefert alle Texte übersetzt. */
  const [langOpen, setLangOpen] = useState(false);

  /* Konto löschen (Apple 5.1.1(v), 23.09.2026): Bestätigungs-Dialog mit
     destruktivem Knopf; steht die Face-ID-Sperre an, verlangt der Weg
     zusätzlich Face ID — dieselbe Hürde wie beim Abschalten des Schutzes.
     Erst wenn der Server gelöscht hat, verschwindet die Sitzung
     (deleteAccount in lib/auth.ts). */
  const [deleting, setDeleting] = useState(false);
  const askDelete = () => {
    const D = S?.deleteAccount;
    if (!D) return;
    Haptics.selectionAsync();
    Alert.alert(D.confirmTitle, D.confirmText, [
      { text: S.cancel, style: "cancel" },
      {
        text: D.go, style: "destructive",
        onPress: async () => {
          if (deleting) return;
          setDeleting(true);
          try {
            if (lock && !(await unlock(D.title))) return;
            /* Apple-Konten: deleteAccount öffnet bei Bedarf Apples Blatt
               (Token-Widerruf, Weg A). Abgebrochen = nichts passiert, still. */
            const result = await deleteAccount(appleReauthCode);
            if (result !== "cancelled") Alert.alert(D.title, result === "done" ? D.done : D.failed);
          } finally { setDeleting(false); }
        },
      },
    ]);
  };

  const row = (label: string, hint: string | null, value: string | null, onPress: () => void) => (
    <Pressable key={label} onPress={() => { Haptics.selectionAsync(); onPress(); }}>
      <Glass style={styles.row} interactive>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.label}>{label}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        <SymbolView name="chevron.right" size={14} tintColor={colors.faint} />
      </Glass>
    </Pressable>
  );

  return (
    <>
      {/* headerBackTitle ausdrücklich: iOS merkt sich den Zurück-Text beim
          Schieben — ohne ihn stand nach dem Sprachwechsel hier noch die
          alte Sprache („Profil" über „Settings", Test 23.09.). */}
      <Stack.Screen options={{ title: p?.settings ?? "Settings", headerBackTitle: p?.title ?? "Profile" }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {S ? (
          <>
            {account
              ? row(S.account, account.email ? `${S.accountSignedIn} ${account.email}` : S.accountSignedInNoEmail, S.signOut, () => { logout().catch(() => {}); })
              : row(S.account, S.accountNone, null, () => {})}
            {/* Konto löschen — nur mit Konto sichtbar; Apple 5.1.1(v). */}
            {account ? (
              <Pressable onPress={askDelete} disabled={deleting}>
                <Glass style={styles.row} interactive>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.danger}>{S.deleteAccount.title}</Text>
                    <Text style={styles.hint}>{S.deleteAccount.hint}</Text>
                  </View>
                  <SymbolView name="trash" size={15} tintColor={colors.danger} />
                </Glass>
              </Pressable>
            ) : null}
            {/* Erinnerungen (13.09.2026) — ganz oben unter dem Konto: der Grund, morgens zu öffnen. */}
            {data?.reminders ? row(data.reminders.labels.title, data.reminders.labels.settingsHint, null, () => router.push("/profile/reminders")) : null}
            {row(S.voiceSetting, S.voiceSettingHint, S.voice, () => router.push("/profile/voice"))}
            <Glass style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.label}>{S.privacy.title}</Text>
                <Text style={styles.hint}>{S.privacy.hint}</Text>
              </View>
              <Switch value={!!lock} disabled={lock === null} onValueChange={toggleLock} trackColor={{ true: colors.accent }} />
            </Glass>
            <Pressable onPress={() => { Haptics.selectionAsync(); setLangOpen((v) => !v); }}>
              <Glass style={[styles.row, langOpen && styles.rowOpen]} interactive>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.label}>{S.languageSetting}</Text>
                  <Text style={styles.hint}>{S.languageSettingHint}</Text>
                </View>
                <Text style={styles.value}>{S.languages.find((l) => l.id === data?.language)?.label ?? data?.language}</Text>
                <SymbolView name={langOpen ? "chevron.up" : "chevron.down"} size={14} tintColor={colors.faint} />
              </Glass>
            </Pressable>
            {langOpen ? (
              <View style={styles.chips}>
                {S.languages.map((l) => (
                  <Pressable key={l.id} onPress={() => { Haptics.selectionAsync(); setLangOpen(false); send({ type: "language", value: l.id }); }}
                    style={[styles.chip, data?.language === l.id && styles.chipOn]}>
                    <Text style={[styles.chipText, data?.language === l.id && styles.chipTextOn]}>{l.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {row(S.legal.terms.title, null, null, () => router.push({ pathname: "/profile/legal", params: { doc: "terms" } }))}
            {row(S.legal.privacy.title, null, null, () => router.push({ pathname: "/profile/legal", params: { doc: "privacy" } }))}
            {/* Der Widerruf (Art. 7 Abs. 3): so einfach wie die Erteilung, kein
                Bestätigungsdialog — im Web steht danach sofort das Tor.
                ⚠ Das Tor ist nativ noch nicht gebaut (Gate startet in der
                Hülle bei „app"); der Widerruf wird gespeichert und greift,
                sobald das Onboarding nativ ist. */}
            {row(S.withdrawConsent, S.withdrawConsentHint, null, () => { send({ type: "withdraw" }); router.back(); })}
          </>
        ) : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: TAB_INSET, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 15, paddingHorizontal: 16, borderRadius: 18 },
  label: { color: colors.text, fontSize: 16 },
  danger: { color: colors.danger, fontSize: 16 },
  hint: { color: colors.faint, fontSize: 13, lineHeight: 17 },
  value: { color: colors.accentSoft, fontSize: 15 },
  rowOpen: { borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 4, marginTop: -2 },
  chip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  chipOn: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  chipText: { color: colors.muted, fontSize: 14 },
  chipTextOn: { color: colors.bg, fontWeight: "700" },
  bridge: { height: 0, overflow: "hidden" },
});
