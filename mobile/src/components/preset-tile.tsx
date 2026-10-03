import { SymbolView } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { clipSource } from "@/lib/style-clips";
import type { WizardPreset } from "@/store/journal-store";
import { colors } from "@/theme";

/* Eine Stil-Kachel — stumm: nur der Vorschau-Film in Schleife, kein Text
   (Antons Entwurf 12.09., nach dem Apple-Watch-Raster). Der Name kommt
   erst beim Antippen, in der großen Ansicht (style.tsx). Handwerksstile
   ohne Clip zeigen ein Zeichen auf Farbe. */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* Die Wahl muss man sehen, bevor man „Weiter" drückt (Antons Ansage
   25.09.): Die gewählte Kachel wächst, leuchtet und trägt einen Haken; die
   übrigen treten einen Schritt zurück. `dim` kommt von außen — nur wenn
   überhaupt etwas gewählt ist. */
export function PresetTile({ preset, active, dim = false, size, onPress }: { preset: WizardPreset; active: boolean; dim?: boolean; size: number; onPress: (id: string) => void }) {
  const press = useSharedValue(1);
  const pick = useSharedValue(active ? 1 : 0);
  useEffect(() => { pick.value = withSpring(active ? 1 : 0, { damping: 13, stiffness: 180 }); }, [active, pick]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: press.value * (1 + 0.1 * pick.value) }],
    shadowOpacity: 0.75 * pick.value,
  }));
  const radius = size * 0.28;
  return (
    <AnimatedPressable
      style={[styles.outer, { width: size, height: size, borderRadius: radius, zIndex: active ? 2 : 1, opacity: dim && !active ? 0.55 : 1 }, anim]}
      onPressIn={() => { press.value = withSpring(0.92, { damping: 18, stiffness: 300 }); }}
      onPressOut={() => { press.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
      onPress={() => onPress(preset.id)}
      accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={preset.label}
    >
      <View style={[styles.tile, { borderRadius: radius }, active && styles.active]}>
        {preset.clip ? <Clip url={preset.clip} /> : <View style={[StyleSheet.absoluteFill, styles.blank]}><SymbolView name="paintbrush.pointed" size={size * 0.34} tintColor={colors.accentSoft} /></View>}
        {active ? <View style={[styles.ring, { borderRadius: radius }]} pointerEvents="none" /> : null}
      </View>
      {active ? (
        <View style={styles.check} pointerEvents="none">
          <SymbolView name="checkmark" size={11} tintColor={colors.bg} weight="bold" />
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

/* Der Vorschau-Film in Schleife. Stil-Clips kommen aus dem Bündel
   (lib/style-clips.ts), alles andere von der Adresse. */
export function Clip({ url }: { url: string }) {
  const player = useVideoPlayer(clipSource(url), (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { player.loop = true; player.muted = true; player.play(); }, [player]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

const styles = StyleSheet.create({
  outer: { shadowColor: colors.accentSoft, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0 },
  tile: { flex: 1, overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  check: { position: "absolute", top: -5, right: -5, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.bg },
  active: { borderColor: colors.accentSoft },
  ring: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderWidth: 3, borderColor: colors.accentSoft },
  blank: { backgroundColor: colors.sky, alignItems: "center", justifyContent: "center" },
});
