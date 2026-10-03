import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useScreenActive } from "@/lib/use-screen-active";

/* Der Frosch in der Mitte des Rings (Antons Wahl 03.10., Variante A:
 * Video-Zustände — „das sieht am echtesten aus"). Ein Grund-Loop läuft
 * immer (schlafen bei Serie 0, sonst wach); Ereignisse spielen einen
 * einmaligen Clip DARÜBER, der danach ausblendet — so gibt es nie einen
 * schwarzen Sprung zwischen zwei Videos.
 *
 * ⚠ PLATZHALTER: Bis Antons Loops da sind, gibt es nur den Schlaf-Loop
 * (assets/mascots/frog-idle.mov). Fehlt ein Clip, fällt „wach" auf ihn
 * zurück und ein Ereignis wird zu einem kleinen Hüpfer der Figur. Neue
 * Clips trägt man NUR in FROG_CLIPS ein — Format und Erzeugung stehen in
 * docs/plans/2026-10-03-frosch-loops.md. */
export type FrogBase = "sleep" | "idle";
export type FrogEvent = "tap" | "dream" | "milestone" | "cheer";

const FROG_CLIPS: Record<FrogBase | FrogEvent, number | null> = {
  sleep: require("../../assets/mascots/frog-idle.mov"),
  idle: null,        // wach, atmet, blinzelt — Loop
  tap: null,         // angetippt: schaut hoch, quakt — einmalig
  dream: null,       // neuer Traum: hüpft vor Freude — einmalig
  milestone: null,   // Meilenstein: springt hoch, Glühwürmchen — einmalig
  cheer: null,       // Ring voll: feiert — einmalig
};

export function FrogStage({ base, event, size }: { base: FrogBase; event: { kind: FrogEvent; at: number } | null; size: number }) {
  const active = useScreenActive();
  const baseSrc = FROG_CLIPS[base] ?? FROG_CLIPS.sleep;
  const loop = useVideoPlayer(baseSrc, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => {
    loop.replaceAsync(baseSrc).then(() => { loop.loop = true; loop.muted = true; if (active) loop.play(); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseSrc]);
  useEffect(() => { try { if (active) loop.play(); else loop.pause(); } catch {} }, [active, loop]);

  // Der einmalige Clip darüber.
  const shot = useVideoPlayer(null, (p) => { p.loop = false; p.muted = true; });
  const [shotOn, setShotOn] = useState(false);
  const shotFade = useSharedValue(0);
  useEventListener(shot, "playToEnd", () => {
    shotFade.value = withTiming(0, { duration: 260 });
    setTimeout(() => setShotOn(false), 280);
  });

  // Ohne Clip: ein kleiner Hüpfer der ganzen Figur.
  const hop = useSharedValue(0);
  const tilt = useSharedValue(0);
  const last = useRef(0);
  useEffect(() => {
    if (!event || event.at === last.current) return;
    last.current = event.at;
    const clip = FROG_CLIPS[event.kind];
    if (clip) {
      setShotOn(true);
      shot.replaceAsync(clip).then(() => { shot.currentTime = 0; shot.play(); shotFade.value = withTiming(1, { duration: 140 }); }).catch(() => setShotOn(false));
      return;
    }
    const big = event.kind === "milestone" || event.kind === "cheer";
    hop.value = withSequence(withTiming(big ? -26 : -12, { duration: 180, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 7, stiffness: 180 }));
    tilt.value = withSequence(withTiming(big ? 0.12 : 0.06, { duration: 120 }), withTiming(-0.06, { duration: 160 }), withSpring(0, { damping: 8 }));
  }, [event, shot, hop, tilt, shotFade]);

  const body = useAnimatedStyle(() => ({ transform: [{ translateY: hop.value }, { rotate: `${tilt.value}rad` }] }));
  const shotStyle = useAnimatedStyle(() => ({ opacity: shotFade.value }));

  return (
    <Animated.View style={[{ width: size, height: size }, body]} pointerEvents="none">
      <VideoView player={loop} style={[StyleSheet.absoluteFill, styles.clear]} contentFit="contain" nativeControls={false} />
      {shotOn ? (
        <Animated.View style={[StyleSheet.absoluteFill, shotStyle]}>
          <VideoView player={shot} style={[StyleSheet.absoluteFill, styles.clear]} contentFit="contain" nativeControls={false} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/* Ausdrücklich durchsichtig: die Clips tragen einen Alphakanal (HEVC). */
const styles = StyleSheet.create({ clear: { backgroundColor: "transparent" } });
