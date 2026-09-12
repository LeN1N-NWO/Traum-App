import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { Clip, PresetTile } from "@/components/preset-tile";
import { Glass, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { WizardHeader } from "@/components/wizard-header";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, TAB_INSET } from "@/theme";

/* Schritt 2, nativ — Antons Entwurf 12.09.: die Stile als stumme Kacheln,
   in denen die Filme laufen, ohne Text. Antippen holt den Stil nach vorn:
   der Rest wird unscharf (Glas über allem), der Film groß, darunter der
   Name und „Diesen Stil verwenden". Dreamflow ist ein Tempo (flow), kein
   Stil — wie im Web (presets.js). Alle Stile sichtbar, kein „Mehr". */
export default function DreamStyleScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { data, bridge } = useJournal();
  const W = data?.wizard;
  const w = useWizardStore();
  const [open, setOpen] = useState<string | null>(null);
  const activeId = w.pace === "flow" ? "dreamflow" : (W?.presets.find((p) => p.id !== "dreamflow" && p.styleId === w.styleId)?.id ?? "ultrareal");
  const presets = W?.presets ?? [];
  const cols = 4;
  const gap = 12;
  const size = Math.floor((width - 32 - gap * (cols - 1)) / cols);
  const shown = presets.find((p) => p.id === open) ?? null;

  function use(id: string) {
    const p = presets.find((x) => x.id === id); if (!p) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    patchWizard(p.id === "dreamflow" ? { pace: "flow", styleId: p.styleId } : { styleId: p.styleId, pace: w.pace === "flow" ? "calm" : w.pace });
    setOpen(null);
  }

  return (
    <>
      <WizardHeader step={5} cancel={W?.cancel} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{W?.styleTitle ?? "How should it look?"}</Text>
        <View style={[styles.grid, { gap }]}>
          {presets.map((p) => <PresetTile key={p.id} preset={p} size={size} active={p.id === activeId} onPress={(id) => { Haptics.selectionAsync(); setOpen(id); }} />)}
        </View>
        <PrimaryButton label={W?.next ?? "Continue"} onPress={() => router.push("/dream/length")} style={{ flex: 0, marginTop: 10 }} />
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>

      {/* Die große Ansicht: Milchglas über dem Raster, der Film nach vorn —
          und wischen zwischen den Stilen wie im Journal-Deck (Anton 12.09.). */}
      <Modal visible={!!shown} transparent animationType="none" onRequestClose={() => setOpen(null)}>
        {shown ? (
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill}>
            <BlurView intensity={70} tint="systemThickMaterialDark" style={StyleSheet.absoluteFill} />
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(null)} />
            <Animated.View entering={ZoomIn.duration(240).easing(Easing.out(Easing.cubic))} style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <ScrollView
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                contentOffset={{ x: width * Math.max(0, presets.findIndex((p) => p.id === shown.id)), y: 0 }}
                onMomentumScrollEnd={(e) => { const i = Math.round(e.nativeEvent.contentOffset.x / width); const p = presets[i]; if (p && p.id !== open) { Haptics.selectionAsync(); setOpen(p.id); } }}
                style={{ flex: 1 }}
              >
                {presets.map((p) => (
                  <View key={p.id} style={{ width, height, alignItems: "center", justifyContent: "center" }}>
                    <View style={[styles.big, { width: width - 48, height: Math.min((width - 48) * 1.4, height * 0.72) }]}>
                      {p.clip ? <Clip url={p.clip} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky, alignItems: "center", justifyContent: "center" }]}><SymbolView name="paintbrush.pointed" size={64} tintColor={colors.accentSoft} /></View>}
                      <LinearGradient colors={["rgba(5,10,20,0.6)", "rgba(5,10,20,0)", "rgba(5,10,20,0)", "rgba(5,10,20,0.7)"]} locations={[0, 0.3, 0.6, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
                      <Text style={styles.name}>{p.label}</Text>
                      <Pressable onPress={() => setOpen(null)} style={styles.closeWrap} hitSlop={12}>
                        <Glass style={styles.close} interactive><SymbolView name="xmark" size={14} tintColor={colors.text} weight="semibold" /></Glass>
                      </Pressable>
                      <View style={styles.useWrap}>
                        <PrimaryButton label={W?.useStyle ?? "Use this style"} heavy onPress={() => use(p.id)} style={{ flex: 0 }} />
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.dots} pointerEvents="none">
                {presets.map((p) => <View key={p.id} style={[styles.pageDot, p.id === shown.id && styles.pageDotOn]} />)}
              </View>
            </Animated.View>
          </Animated.View>
        ) : null}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: TAB_INSET, gap: 16 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, color: colors.text, marginTop: 8, marginLeft: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  sheet: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  big: { borderRadius: 28, overflow: "hidden", backgroundColor: colors.bg2, shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 30, shadowOffset: { width: 0, height: 12 } },
  name: { position: "absolute", top: 18, left: 20, right: 64, fontFamily: fonts.serif, fontSize: 30, color: colors.text },
  closeWrap: { position: "absolute", top: 14, right: 14 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  useWrap: { position: "absolute", left: 16, right: 16, bottom: 16 },
  dots: { position: "absolute", left: 0, right: 0, bottom: 56, flexDirection: "row", justifyContent: "center", gap: 6 },
  pageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)" },
  pageDotOn: { backgroundColor: colors.text, width: 18 },
  bridge: { height: 0, overflow: "hidden" },
});
