import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Glass } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
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
      <Stack.Screen options={{ title: p?.settings ?? "Settings" }} />
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {S ? (
          <>
            {row(S.voiceSetting, S.voiceSettingHint, S.voice, () => router.push("/profile/voice"))}
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
  hint: { color: colors.faint, fontSize: 13, lineHeight: 17 },
  value: { color: colors.accentSoft, fontSize: 15 },
  bridge: { height: 0, overflow: "hidden" },
});
