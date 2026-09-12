import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { createVideoPlayer, type VideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Glass, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { colors, fonts } from "@/theme";

/* Die Stimmwahl, nativ — VoicePicker.jsx: Antippen IST die Hörprobe
   (wählt und spielt in einer Geste), die Welle atmet, solange die Probe
   läuft, „Klingt richtig" unten. Die Probe kommt vom Server
   (/api/voice-sample, je Stimme und Sprache einmal erzeugt und gecacht) —
   abgespielt über expo-video, wie die Schlafklänge. */
export default function VoicePickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, bridge, send } = useJournal();
  const S = data?.profile?.settingsPage;
  const [sel, setSel] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const player = useRef<VideoPlayer | null>(null);
  const current = sel ?? S?.voice ?? null;

  useEffect(() => () => { try { player.current?.release(); } catch {} }, []);

  function pick(id: string) {
    Haptics.selectionAsync();
    setSel(id);
    if (!S) return;
    try { player.current?.release(); } catch {}
    const p = createVideoPlayer({ uri: `${S.sampleBase}?voice=${encodeURIComponent(id)}&lang=${encodeURIComponent(data?.language ?? "en")}` });
    p.audioMixingMode = "duckOthers";
    p.showNowPlayingNotification = false;
    p.addListener("playToEnd", () => setPlaying(false));
    p.addListener("statusChange", (e) => { if (e.status === "error") setPlaying(false); });
    player.current = p;
    setPlaying(true);
    p.play();
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 18, paddingBottom: insets.bottom + 32 }]}>
        <Pressable onPress={() => router.back()} accessibilityLabel={S?.cancel ?? "Close"} style={styles.close} hitSlop={12}>
          <Glass style={styles.closeGlass} interactive><SymbolView name="xmark" size={14} tintColor={colors.text} weight="semibold" /></Glass>
        </Pressable>
        <Text style={styles.title}>{S?.pickTitle ?? ""}</Text>
        <Text style={styles.hint}>{S?.pickHint ?? ""}</Text>
        <Wave on={playing} />
        <View style={styles.list}>
          {(S?.voices ?? []).map((v) => {
            const on = v.id === current;
            return (
              <Pressable key={v.id} onPress={() => pick(v.id)} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                <Glass style={styles.row} tint={on ? "rgba(79,156,249,0.22)" : undefined} interactive>
                  <Text style={[styles.name, on && styles.nameOn]}>{v.id}</Text>
                  <Text style={styles.trait}>{v.trait}</Text>
                  {on ? <SymbolView name="checkmark" size={14} tintColor={colors.accentSoft} weight="semibold" /> : null}
                </Glass>
              </Pressable>
            );
          })}
        </View>
        <PrimaryButton label={S?.pickGo ?? "Sounds right"} onPress={() => { if (current) send({ type: "voice", value: current }); router.back(); }} style={{ flex: 0, marginTop: 8 }} />
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </View>
  );
}

/* Sechs Balken, die atmen, solange die Probe läuft — die einzige Bewegung
   des Blatts, damit sie „das ist die Stimme, die du hörst" bedeutet. */
function Wave({ on }: { on: boolean }) {
  return (
    <View style={styles.wave} accessibilityElementsHidden>
      {[18, 34, 52, 30, 44, 22].map((h, i) => <Bar key={i} h={h} i={i} on={on} />)}
    </View>
  );
}
function Bar({ h, i, on }: { h: number; i: number; on: boolean }) {
  const k = useSharedValue(1);
  useEffect(() => {
    k.value = on ? withRepeat(withTiming(0.45, { duration: 520 + i * 70, easing: Easing.inOut(Easing.quad) }), -1, true) : withTiming(1, { duration: 300 });
  }, [on, i, k]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: k.value }] }));
  return <Animated.View style={[styles.bar, { height: h, backgroundColor: on ? colors.accentSoft : colors.faint }, style]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, gap: 12 },
  close: { alignSelf: "flex-end" },
  closeGlass: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontFamily: fonts.serif, fontSize: 30, marginTop: -6 },
  hint: { color: colors.muted, fontSize: 15 },
  wave: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 64, marginVertical: 8 },
  bar: { width: 6, borderRadius: 3 },
  list: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16 },
  name: { flex: 1, color: colors.text, fontSize: 17 },
  nameOn: { color: colors.accentSoft, fontWeight: "600" },
  trait: { color: colors.muted, fontSize: 14 },
  bridge: { height: 0, overflow: "hidden" },
});
