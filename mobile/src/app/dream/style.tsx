import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
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
  const { width } = useWindowDimensions();
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

      {/* Die große Ansicht: Glas über dem Raster, der Film nach vorn. */}
      <Modal visible={!!shown} transparent animationType="none" onRequestClose={() => setOpen(null)}>
        {shown ? (
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill}>
            {isLiquidGlassAvailable()
              ? <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular" colorScheme="dark" />
              : <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(5,10,20,0.9)" }]} />}
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(null)} />
            <View style={styles.sheet} pointerEvents="box-none">
              <Animated.View entering={ZoomIn.springify().damping(16).stiffness(180)} style={[styles.big, { width: width - 56, height: (width - 56) * 1.25 }]}>
                {shown.clip ? <Clip url={shown.clip} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky, alignItems: "center", justifyContent: "center" }]}><SymbolView name="paintbrush.pointed" size={64} tintColor={colors.accentSoft} /></View>}
              </Animated.View>
              <Text style={styles.name}>{shown.label}</Text>
              <View style={{ width: width - 56, gap: 10 }}>
                <PrimaryButton label={W?.useStyle ?? "Use this style"} heavy onPress={() => use(shown.id)} style={{ flex: 0 }} />
                <Pressable onPress={() => setOpen(null)} style={{ alignSelf: "center" }} hitSlop={12}>
                  <Glass style={styles.close} interactive><SymbolView name="xmark" size={14} tintColor={colors.text} weight="semibold" /></Glass>
                </Pressable>
              </View>
            </View>
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
  name: { fontFamily: fonts.serif, fontSize: 28, color: colors.text, textAlign: "center" },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  bridge: { height: 0, overflow: "hidden" },
});
