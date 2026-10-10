import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { swing, useAmbient } from "@/lib/ambient-clock";
import Svg, { Circle } from "react-native-svg";
import { useScreenActive } from "@/lib/use-screen-active";

/* Der Nachthimmel hinter Traum-Tab und Profil (Antons Wahl 26.09.: „der
   Hintergrund mit den Kometen"): Sterne in drei Gruppen, die langsam
   gegeneinander funkeln, und etwa alle neun Sekunden eine Sternschnuppe.
   Bewusst ruhig — man öffnet den Tab oft halb im Schlaf.
   Die Sterne stehen fest (ein fester Seed), damit der Himmel beim nächsten
   Öffnen derselbe ist; bewegt werden nur drei Gruppen-Deckkräfte und die
   Schnuppe, alles auf dem UI-Thread. */

function rand(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function NightSky({ density = 1 }: { density?: number }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const stars = useMemo(() => {
    const r = rand(20260926);
    return [0, 1, 2].map((g) => Array.from({ length: Math.round([46, 28, 12][g] * density) }, () => ({
      x: r(), y: Math.pow(r(), 1.35) * 0.9, r: [0.55, 0.85, 1.3][g] * (0.7 + r() * 0.6),
    })));
  }, [density]);

  /* Nur funkeln, solange der Tab zu sehen ist (04.10.): Der Himmel liegt
     inzwischen hinter vier Tabs, die alle montiert bleiben — vorher liefen
     alle vier Himmel ständig weiter, auch unsichtbar. Seit 10.10. im
     gemeinsamen 30er-Takt (lib/ambient-clock.tsx): jede Gruppe schwingt
     zwischen dunkel und hell, jede in ihrem eigenen Tempo, wie vorher. */
  const live = useScreenActive();
  const t = useAmbient(live);
  const twinkle = (i: number) => {
    "worklet";
    const lo = 0.25 + i * 0.15, hi = 0.75 + i * 0.08;
    return lo + (hi - lo) * swing(t.value, 2 * (4900 + i * 1600), i * 0.31);
  };
  /* Das Funkeln als Deckkraft einer EBENE, nicht als SVG-Eigenschaft
     (28.09., Dauerlast): So blendet die Grafikkarte drei fertige Bilder
     ineinander, statt das SVG jedes Bild neu zu zeichnen. */
  const g0 = useAnimatedStyle(() => ({ opacity: twinkle(0) }));
  const g1 = useAnimatedStyle(() => ({ opacity: twinkle(1) }));
  const g2 = useAnimatedStyle(() => ({ opacity: twinkle(2) }));
  const groups = [g0, g1, g2];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <LinearGradient colors={["#0b1834", "#070e1d", "#050a14"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      {box.w > 0 ? (
        stars.map((list, g) => (
          <Animated.View key={g} style={[StyleSheet.absoluteFill, groups[g]]} shouldRasterizeIOS>
            <Svg width={box.w} height={box.h}>
              {list.map((s, k) => <Circle key={k} cx={s.x * box.w} cy={s.y * box.h} r={s.r} fill="#eaf0fb" />)}
            </Svg>
          </Animated.View>
        ))
      ) : null}
      {box.w > 0 && live ? <ShootingStar w={box.w} h={box.h} /> : null}
    </View>
  );
}

/* Eine Sternschnuppe: ein heller Kopf mit ausgeblendetem Schweif, der schräg
   durch das obere Drittel zieht — alle acht bis zwölf Sekunden, jedes Mal
   an einer anderen Stelle. */
function ShootingStar({ w, h }: { w: number; h: number }) {
  const k = useSharedValue(0);
  const [start, setStart] = useState({ x: w * 0.8, y: h * 0.12 });
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const fly = () => {
      if (!alive) return;
      setStart({ x: w * (0.45 + Math.random() * 0.5), y: h * (0.04 + Math.random() * 0.22) });
      k.value = 0;
      k.value = withDelay(60, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }));
      timer = setTimeout(fly, 8000 + Math.random() * 4000);
    };
    timer = setTimeout(fly, 2500);
    return () => { alive = false; clearTimeout(timer); };
  }, [w, h, k]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.sin(Math.PI * k.value),
    transform: [{ translateX: -k.value * w * 0.42 }, { translateY: k.value * w * 0.17 }, { rotate: "-22deg" }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: start.x, top: start.y, width: 90, height: 2 }, style]}>
      <LinearGradient colors={["rgba(255,246,228,1)", "rgba(255,246,228,0)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1, borderRadius: 1 }} />
    </Animated.View>
  );
}
