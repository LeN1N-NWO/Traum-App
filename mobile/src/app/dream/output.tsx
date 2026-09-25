import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { OrbitGlow } from "@/components/orbit-glow";
import { useJournal } from "@/components/journal-data";
import { Clip } from "@/components/preset-tile";
import { WizardHeader } from "@/components/wizard-header";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, TAB_INSET } from "@/theme";

/* Schritt 2: Was soll daraus werden? Seit 26.09. (Antons Ansage) zwei große
   Kacheln über den ganzen Bildschirm, in denen ein Film läuft — „Speichern"
   und „Den Film machen". Antippen: eine Welle aus Liquid Glass läuft vom
   Finger aus durch die Kachel, die Kachel wächst, dann der nächste Schritt.
   Die Filme sind Platzhalter aus den Stil-Clips, bis eigene da sind.
   Bilder gibt es nativ nicht mehr (Antons Entscheidung 31.08.). */
const glassOK = isLiquidGlassAvailable();

export default function DreamOutputScreen() {
  const router = useRouter();
  const { data, bridge, send } = useJournal();
  const W = data?.wizard;
  const w = useWizardStore();
  const insets = useSafeAreaInsets();

  const save = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    send({ type: "saveDream", text: w.text, originalText: w.originalText, analysis: w.analysis, title: w.analysis?.title || "", tagline: w.analysis?.tagline || "", audioUrl: w.audioUrl ?? undefined });
    router.navigate("/journal");
  };
  const film = () => { patchWizard({ mode: "film" }); router.push("/dream/cast"); };

  return (
    <>
      <WizardHeader step={2} cancel={W?.cancel} />
      <View style={[styles.screen, { paddingTop: insets.top + 56 }]}>
        <Text style={styles.title}>{W?.outputTitle ?? "What should become of it?"}</Text>
        <BigTile clip="/clips/style-dreamlike.mp4" sf="film" title={W?.filmCta ?? W?.film ?? "Make the film"} hint={W?.filmHint} price={`${W?.from ?? "from"} ${W?.filmFrom ?? ""}`} main onGo={film} />
        <BigTile clip="/clips/style-nostalgic.mp4" sf="tray.and.arrow.down" title={W?.saveCta ?? W?.saveOnly ?? "Save"} hint={W?.saveOnlyHint} price={W?.free ?? "Free"} free onGo={save} />
      </View>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

function BigTile({ clip, sf, title, hint, price, main, free, onGo }: { clip: string; sf: SFSymbol; title?: string; hint?: string; price: string; main?: boolean; free?: boolean; onGo: () => void }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const wave = useSharedValue(0);     // 0 → 1: die Glaswelle wächst vom Finger aus
  const lift = useSharedValue(1);     // die Kachel drückt ein und wächst dann

  const go = () => { setBusy(false); onGo(); wave.value = 0; lift.value = 1; };
  const press = (x: number, y: number) => {
    if (busy) return;
    setBusy(true);
    setOrigin({ x, y });
    Haptics.impactAsync(main ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
    wave.value = 0;
    wave.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    lift.value = withSequence(withTiming(0.96, { duration: 110 }), withTiming(1.03, { duration: 380, easing: Easing.out(Easing.back(2)) }, (done) => { if (done) runOnJS(go)(); }));
  };

  // Der Kreis muss am Ende die weiteste Ecke erreichen.
  const reach = Math.hypot(Math.max(origin.x, box.w - origin.x), Math.max(origin.y, box.h - origin.y)) * 2;
  const waveStyle = useAnimatedStyle(() => ({
    opacity: wave.value === 0 ? 0 : 1 - wave.value * 0.35,
    transform: [{ scale: 0.05 + wave.value }],
  }));
  const tileStyle = useAnimatedStyle(() => ({ transform: [{ scale: lift.value }] }));

  return (
    <Animated.View style={[styles.tileWrap, tileStyle]}>
      <Pressable style={styles.tile} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        onPress={(e) => press(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessibilityRole="button" accessibilityLabel={title}>
        <Clip url={clip} />
        <LinearGradient colors={["rgba(5,10,20,0.15)", "rgba(5,10,20,0.1)", "rgba(5,10,20,0.78)"]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
        {/* Die Welle: echtes Liquid Glass auf iOS 26, sonst ein heller Schimmer. */}
        <Animated.View pointerEvents="none" style={[{ position: "absolute", left: origin.x - reach / 2, top: origin.y - reach / 2, width: reach, height: reach, borderRadius: reach / 2, overflow: "hidden" }, waveStyle]}>
          {glassOK
            ? <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="clear" colorScheme="dark" />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.18)" }]} />}
        </Animated.View>
        <View style={styles.text} pointerEvents="none">
          <View style={styles.titleRow}>
            <SymbolView name={sf} size={22} tintColor={colors.text} />
            <Text style={styles.tileTitle}>{title}</Text>
          </View>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
          <View style={[styles.pricePill, free && styles.priceFree]}><Text style={[styles.price, free && { color: colors.ok }]}>{price}</Text></View>
        </View>
      </Pressable>
      {main ? <OrbitGlow radius={28} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingBottom: TAB_INSET, gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, color: colors.text, marginLeft: 4 },
  tileWrap: { flex: 1, borderRadius: 28 },
  tile: { flex: 1, borderRadius: 28, overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.14)" },
  text: { position: "absolute", left: 20, right: 20, bottom: 18, gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tileTitle: { fontFamily: fonts.serif, fontSize: 30, color: colors.text },
  hint: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 19 },
  pricePill: { alignSelf: "flex-start", marginTop: 4, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "rgba(140,192,255,0.18)" },
  priceFree: { backgroundColor: "rgba(92,214,160,0.18)" },
  price: { color: colors.accentSoft, fontSize: 13, fontWeight: "700" },
  bridge: { height: 0, overflow: "hidden" },
});
