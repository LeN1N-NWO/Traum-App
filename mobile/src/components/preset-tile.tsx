import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import type { WizardPreset } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Eine Stil-Kachel: der Vorschau-Film läuft leise in Schleife (die Dynamik
   aus dem Web), Handwerksstile ohne Clip zeigen ihr Zeichen auf Farbe.
   Drei Spalten, Dreamflow doppelt breit — wie presets.js es vorsieht. */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PresetTile({ preset, active, onPress }: { preset: WizardPreset; active: boolean; onPress: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const cell = (width - 32 - 20) / 3;
  const w = preset.wide ? cell * 2 + 10 : cell;
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={[styles.tile, { width: w, height: cell * 1.35 }, active && styles.active, anim]}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 18, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
      onPress={() => onPress(preset.id)}
      accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={preset.label}
    >
      {preset.clip ? <Clip url={preset.clip} /> : <View style={[StyleSheet.absoluteFill, styles.blank]}><Text style={styles.emoji}>{preset.emoji}</Text></View>}
      <LinearGradient colors={["rgba(5,10,20,0)", "rgba(5,10,20,0.85)"]} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
      <Text style={styles.label} numberOfLines={2}>{preset.label}</Text>
      {active ? <View style={styles.ring} pointerEvents="none" /> : null}
    </AnimatedPressable>
  );
}

function Clip({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => { p.loop = true; p.muted = true; p.play(); });
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

const styles = StyleSheet.create({
  tile: { borderRadius: 16, overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  active: { borderColor: colors.accentSoft },
  ring: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, borderWidth: 2, borderColor: colors.accentSoft },
  blank: { backgroundColor: colors.sky, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 34 },
  label: { position: "absolute", left: 10, right: 10, bottom: 10, fontFamily: fonts.serif, fontSize: 15, color: colors.text },
});
