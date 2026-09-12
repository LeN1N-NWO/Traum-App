import { SymbolView } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import type { WizardPreset } from "@/store/journal-store";
import { colors } from "@/theme";

/* Eine Stil-Kachel — stumm: nur der Vorschau-Film in Schleife, kein Text
   (Antons Entwurf 12.09., nach dem Apple-Watch-Raster). Der Name kommt
   erst beim Antippen, in der großen Ansicht (style.tsx). Handwerksstile
   ohne Clip zeigen ein Zeichen auf Farbe. */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PresetTile({ preset, active, size, onPress }: { preset: WizardPreset; active: boolean; size: number; onPress: (id: string) => void }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={[styles.tile, { width: size, height: size, borderRadius: size * 0.28 }, active && styles.active, anim]}
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 18, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
      onPress={() => onPress(preset.id)}
      accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={preset.label}
    >
      {preset.clip ? <Clip url={preset.clip} /> : <View style={[StyleSheet.absoluteFill, styles.blank]}><SymbolView name="paintbrush.pointed" size={size * 0.34} tintColor={colors.accentSoft} /></View>}
      {active ? <View style={[styles.ring, { borderRadius: size * 0.28 }]} pointerEvents="none" /> : null}
    </AnimatedPressable>
  );
}

export function Clip({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { player.loop = true; player.muted = true; player.play(); }, [player]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

const styles = StyleSheet.create({
  tile: { overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  active: { borderColor: colors.accentSoft },
  ring: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderWidth: 2.5, borderColor: colors.accentSoft },
  blank: { backgroundColor: colors.sky, alignItems: "center", justifyContent: "center" },
});
