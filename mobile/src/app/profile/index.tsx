import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useJournal } from "@/components/journal-data";
import { colors, fonts, radius } from "@/theme";

/* Das Profil, nativ: Gesicht, Name, Guthaben, zwei Zahlen. Foto/Name,
   Einstellungen und das Kaufblatt sind noch Web-Blätter (page.tsx). */
export default function ProfileScreen() {
  const router = useRouter();
  const { data, bridge } = useJournal();
  const p = data?.profile;
  const open = (page: string) => { Haptics.selectionAsync(); router.push({ pathname: "/profile/page", params: { page } }); };
  return (
    <>
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {p ? (
          <>
            <Pressable style={styles.hero} onPress={() => open("avatar")}>
              <View style={styles.faceRing}>
                {p.img ? <Image source={{ uri: p.img }} style={styles.face} contentFit="cover" /> : <View style={[styles.face, styles.faceEmpty]}><SymbolView name="plus" size={28} tintColor={colors.accentSoft} /></View>}
              </View>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.hint}>{p.hint}</Text>
            </Pressable>
            <View style={styles.stats}>
              <View style={styles.stat}><Text style={styles.statN}>{p.dreams}</Text><Text style={styles.statL}>{p.statDreams}</Text></View>
              <View style={styles.stat}><Text style={styles.statN}>{p.streak}</Text><Text style={styles.statL}>{p.statStreak}</Text></View>
            </View>
            {!p.surveyDone ? (
              <Pressable style={styles.card} onPress={() => open("survey")}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.cardTitle}>{p.surveyTitle}</Text>
                  <Text style={styles.cardHint}>{p.surveyHint}</Text>
                </View>
                <SymbolView name="chevron.right" size={14} tintColor={colors.faint} />
              </Pressable>
            ) : null}
            <Pressable style={styles.card} onPress={() => open("settings")}>
              <SymbolView name="gearshape" size={20} tintColor={colors.accentSoft} />
              <Text style={[styles.cardTitle, { flex: 1 }]}>{p.settings}</Text>
              <SymbolView name="chevron.right" size={14} tintColor={colors.faint} />
            </Pressable>
          </>
        ) : null}
      </ScrollView>
      <Stack.Screen.Title large style={{ color: colors.text, fontFamily: fonts.serif }} largeStyle={{ color: colors.text, fontFamily: fonts.serif, fontSize: 36 }}>
        {p?.title ?? "Profile"}
      </Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => open("paywall")}>{p ? `✦ ${p.credits} ${p.creditsWord}` : ""}</Stack.Toolbar.Button>
      </Stack.Toolbar>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  hero: { alignItems: "center", gap: 6, paddingVertical: 12 },
  faceRing: { padding: 4, borderRadius: 999, borderWidth: 1, borderColor: colors.panelLine, marginBottom: 8 },
  face: { width: 168, height: 168, borderRadius: 84, backgroundColor: colors.bg2 },
  faceEmpty: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.accentSoft },
  name: { fontFamily: fonts.serif, fontSize: 32, color: colors.text },
  hint: { color: colors.muted, fontSize: 14, textAlign: "center" },
  stats: { flexDirection: "row", justifyContent: "center", gap: 48, paddingVertical: 6 },
  stat: { alignItems: "center", gap: 2 },
  statN: { color: colors.text, fontSize: 28, fontWeight: "600", fontVariant: ["tabular-nums"] },
  statL: { color: colors.faint, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase" },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  cardHint: { color: colors.accentSoft, fontSize: 13 },
  bridge: { height: 0, overflow: "hidden" },
});
