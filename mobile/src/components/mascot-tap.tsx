import * as Haptics from "expo-haptics";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import { PrimaryButton } from "@/components/glass";
import { clearTap, TAP_LENGTH_MS, TAP_MOMENT_MS, useTap } from "@/store/tap-store";

/* Das Maskottchen greift herein und tippt auf den Knopf — ButtonTapOverlay
 * aus dem Web, nativ (Antons Wunsch 13.09.2026: „dieses Maskottchen, was
 * transparent war und oben drüber als Layer auf den Button geklickt hat …
 * zurückholen, ich will mal sehen, wie das aussieht").
 *
 * Die Regeln des Web gelten weiter:
 *   · NIE ein Tor. Der Auftrag ist schon unterwegs, wenn der Frosch kommt;
 *     die Ebene fängt nur einen Tipp zum Überspringen.
 *   · Der Anker rechnet gegen den ECHTEN Knopf (gemessen im Moment des
 *     Drucks), nicht gegen Bildschirmprozente: Funke bei 14,5 % Breite,
 *     78 % Höhe, Größe 0,65 der Bildschirmbreite (mascots.js).
 *   · Reduzierte Bewegung → gar kein Frosch.
 *
 * Der Knopf selbst ist schon weg (der Auftragsbildschirm liegt darüber),
 * deshalb zeichnet diese Ebene ihn an derselben Stelle nach; im Moment des
 * Treffers drückt er ein und verpufft — Konfetti und Überschrift des
 * Auftragsbildschirms setzen genau dann ein (tap-store `tapAt`).
 *
 * Transparenz: Die Web-Datei ist eine Alpha-Packung (Farbe oben, Maske
 * unten) für einen WebGL-Shader. Nativ gibt es den nicht; iOS spielt HEVC
 * mit Alphakanal direkt. `assets/mascots/frog-tap.mov` ist daraus erzeugt:
 *   ffmpeg -i src/assets/mascot-frog-button.mp4 -filter_complex
 *     "[0:v]crop=720:1280:0:0[c];[0:v]crop=720:1280:0:1280,format=gray[a];
 *      [c][a]alphamerge,format=bgra" -c:v hevc_videotoolbox
 *     -alpha_quality 0.85 -q:v 60 -allow_sw 1 -tag:v hvc1 frog-tap.mov
 * ⚠ Android kann HEVC-Alpha nicht — dort bräuchte es eine andere Datei. */
const FROG = { src: require("../../assets/mascots/frog-tap.mov"), width: 720, height: 1280, anchor: { x: 0.145, y: 0.78 }, scale: 0.65 };

export function MascotTapLayer() {
  const tap = useTap();
  const [reduce, setReduce] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {}); }, []);
  useEffect(() => {
    if (!tap) return;
    if (reduce) { clearTap(); return; }
    const t = setTimeout(clearTap, Math.max(0, tap.endsAt - Date.now()) + 400);   // Netz, falls das Ende-Ereignis nie kommt
    return () => clearTimeout(t);
  }, [tap, reduce]);
  if (!tap || reduce) return null;
  return <Frog key={tap.startedAt} rect={tap.rect} label={tap.label} startedAt={tap.startedAt} />;
}

function Frog({ rect, label, startedAt }: { rect: { x: number; y: number; width: number; height: number }; label: string; startedAt: number }) {
  const { width: vw } = useWindowDimensions();
  const player = useVideoPlayer(FROG.src, (p) => { p.loop = false; p.muted = true; p.play(); });
  useEventListener(player, "playToEnd", () => clearTap());

  const w = vw * FROG.scale;
  const h = w * (FROG.height / FROG.width);
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const left = cx - FROG.anchor.x * w;
  const top = cy - FROG.anchor.y * h;

  // Der nachgezeichnete Knopf: steht, drückt beim Treffer ein, verpufft.
  const press = useSharedValue(1);
  const fade = useSharedValue(1);
  const frogOut = useSharedValue(1);
  useEffect(() => {
    const until = Math.max(0, startedAt + TAP_MOMENT_MS - Date.now());
    press.value = withDelay(until - 80, withSequence(withTiming(0.9, { duration: 90 }), withTiming(1.08, { duration: 160 }), withTiming(1, { duration: 120 })));
    fade.value = withDelay(until + 260, withTiming(0, { duration: 420 }));
    frogOut.value = withDelay(Math.max(0, startedAt + TAP_LENGTH_MS - 350 - Date.now()), withTiming(0, { duration: 350 }));
    const hit = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), until);
    return () => clearTimeout(hit);
  }, [startedAt, press, fade, frogOut]);
  const buttonStyle = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: press.value }] }));
  const frogStyle = useAnimatedStyle(() => ({ opacity: frogOut.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Antippen überspringt — beim zwanzigsten Traum sind sechs Sekunden lang. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={clearTap} accessible={false} />
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: rect.x, top: rect.y, width: rect.width, height: rect.height }, buttonStyle]}>
        <PrimaryButton label={label} heavy onPress={() => {}} style={{ flex: 1 }} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left, top, width: w, height: h }, frogStyle]}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} allowsPictureInPicture={false} />
      </Animated.View>
    </View>
  );
}
