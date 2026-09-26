import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, G } from "react-native-svg";

/* Der Nachthimmel hinter Traum-Tab und Profil (Antons Wahl 26.09.: „der
   Hintergrund mit den Kometen"): Sterne in drei Gruppen, die langsam
   gegeneinander funkeln, und etwa alle neun Sekunden eine Sternschnuppe.
   Bewusst ruhig — man öffnet den Tab oft halb im Schlaf.
   Die Sterne stehen fest (ein fester Seed), damit der Himmel beim nächsten
   Öffnen derselbe ist; bewegt werden nur drei Gruppen-Deckkräfte und die
   Schnuppe, alles auf dem UI-Thread. */
const AnimatedG = Animated.createAnimatedComponent(G);

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

  const tw = [useSharedValue(0.5), useSharedValue(0.7), useSharedValue(0.9)];
  useEffect(() => {
    tw.forEach((v, i) => {
      v.value = withRepeat(withSequence(
        withTiming(0.25 + i * 0.15, { duration: 2300 + i * 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.75 + i * 0.08, { duration: 2600 + i * 700, easing: Easing.inOut(Easing.sin) }),
      ), -1, true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const g0 = useAnimatedProps(() => ({ opacity: tw[0].value }));
  const g1 = useAnimatedProps(() => ({ opacity: tw[1].value }));
  const g2 = useAnimatedProps(() => ({ opacity: tw[2].value }));
  const groups = [g0, g1, g2];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <LinearGradient colors={["#0b1834", "#070e1d", "#050a14"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      {box.w > 0 ? (
        <Svg width={box.w} height={box.h} style={StyleSheet.absoluteFill}>
          {stars.map((list, g) => (
            <AnimatedG key={g} animatedProps={groups[g]}>
              {list.map((s, k) => <Circle key={k} cx={s.x * box.w} cy={s.y * box.h} r={s.r} fill="#eaf0fb" />)}
            </AnimatedG>
          ))}
        </Svg>
      ) : null}
      {box.w > 0 ? <ShootingStar w={box.w} h={box.h} /> : null}
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
