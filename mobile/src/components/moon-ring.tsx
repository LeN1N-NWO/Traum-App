import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { Moon } from "@/components/moon-strip";
import type { HomeData } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Der Ring mit Fäden (Antons Wahl 03.10., statt des W-Sternbilds):
 *
 *   · die Nächte dieses Mondes im Kreis, von Vollmond zu Vollmond — oben
 *     wartet der nächste Vollmond mit dem Schild „Mondfilm",
 *   · jede Nacht mit Traum zeigt ihr Bild; leere Nächte sind kleine
 *     Punkte, kommende ganz blass, heute pulsiert golden,
 *   · quer durch den Ring spannen sich Fäden zwischen Nächten mit
 *     demselben Motiv — über den Monat ein eigenes Fadenbild,
 *   · in der Mitte der echte Mond von heute Nacht; sein Schein wird
 *     stärker, je näher der Vollmond rückt.
 * Am Morgen nach dem Vollmond macht das iPhone aus den Bildern den
 * Mondfilm (glimpse-layer.tsx). Rechnung: src/lib/moonCycle.js.
 *
 * Leistung: Ring, Punkte und Fäden sind EIN stilles SVG; die Bilder sind
 * expo-image-Ansichten darüber; dauernd bewegt sich nur der Heute-Punkt
 * (native Ebene). */
const THUMB = 28;

export function MoonRing({ C, width, onOpen }: { C: HomeData["cycle"]; width: number; onOpen: (id: string) => void }) {
  const W = width, H = width;
  const cx = W / 2, cy = H / 2;
  const R = W * 0.4;
  const N = C.days.length;
  const at = (i: number, r = R) => {
    const a = -Math.PI / 2 + ((i + 0.5) / N) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const moonSize = Math.round(W * 0.3);
  const near = Math.max(0, 1 - C.left / 12);              // 0 … 1, je näher der Vollmond
  const todayIndex = C.days.findIndex((d) => d.today);

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <View style={{ width: W, height: H }}>
        {/* Das stille Bild: Schein, Bahn, Punkte */}
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0.55" stopColor="#ffd58f" stopOpacity={0.18 + 0.3 * near} />
              <Stop offset="1" stopColor="#ffd58f" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={cx} cy={cy} r={moonSize * 0.9} fill="url(#glow)" />
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(234,240,251,0.08)" strokeWidth={1} />
          {C.days.map((d, i) => {
            if (d.dreamId && d.img) return null;
            const [x, y] = at(i);
            if (d.dreamId) return <Circle key={d.key} cx={x} cy={y} r={4} fill="#fffaf0" opacity={0.85} />;   // Traum ohne Bild: ein Lichtpunkt
            if (d.today) return null;
            return <Circle key={d.key} cx={x} cy={y} r={d.future ? 1.6 : 2.2} fill={d.future ? "rgba(234,240,251,0.2)" : "rgba(234,240,251,0.38)"} />;
          })}
        </Svg>
        {/* Die Fäden — blenden nach den Bildern ein */}
        <Animated.View entering={FadeIn.delay(500).duration(900)} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={W} height={H}>
            {C.threads.map(([a, b], k) => {
              const [x1, y1] = at(a, R - THUMB / 2 - 2), [x2, y2] = at(b, R - THUMB / 2 - 2);
              // Der Faden biegt sich zur Mitte — wie gespannt, nicht wie eine Sehne.
              const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
              const qx = cx + (mx - cx) * 0.25, qy = cy + (my - cy) * 0.25;
              return <Path key={k} d={`M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}`} fill="none" stroke="#ffe7b0" strokeOpacity={0.45} strokeWidth={1.1} />;
            })}
          </Svg>
        </Animated.View>
        {/* Der Mond von heute Nacht */}
        <View style={[styles.center, { left: cx - moonSize / 2, top: cy - moonSize / 2 }]} pointerEvents="none">
          <Moon illum={C.moon.illum} waxing={C.moon.waxing} size={moonSize} />
        </View>
        {/* Der nächste Vollmond: das Ziel */}
        <View pointerEvents="none" style={[styles.full, { left: cx - 9, top: cy - R - 9 }]} />
        <View pointerEvents="none" style={[styles.chip, { left: cx - 40, top: cy - R + 13 }]}><Text style={styles.chipText}>{C.chip}</Text></View>
        {/* Die Traumbilder */}
        {C.days.map((d, i) => {
          if (!d.dreamId || !d.img) return null;
          const [x, y] = at(i);
          return (
            <Animated.View key={d.key} entering={FadeIn.delay(80 + i * 22).duration(380)} style={[styles.thumbWrap, { left: x - THUMB / 2, top: y - THUMB / 2 }]}>
              <Pressable onPress={() => { Haptics.selectionAsync(); onOpen(d.dreamId!); }} hitSlop={6}>
                <Image source={{ uri: d.img }} style={styles.thumb} contentFit="cover" transition={150} />
              </Pressable>
            </Animated.View>
          );
        })}
        {todayIndex >= 0 && !C.days[todayIndex].dreamId ? <TodayMark x={at(todayIndex)[0]} y={at(todayIndex)[1]} /> : null}
      </View>
      <Text style={styles.count}>{C.countLine.toUpperCase()}</Text>
      <Text style={styles.line}>{C.line}</Text>
      {C.thread ? <Text style={styles.thread}>{C.thread}</Text> : null}
    </View>
  );
}

/* Heute: ein goldener Ring, der leise pulsiert — hier kommt der nächste Traum hin. */
function TodayMark({ x, y }: { x: number; y: number }) {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true); }, [k]);
  const pulse = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * k.value, transform: [{ scale: 0.9 + 0.2 * k.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.today, { left: x - 10, top: y - 10 }, pulse]}>
      <View style={styles.todayDot} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { position: "absolute" },
  full: { position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff0c8", shadowColor: "#f6c65b", shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  chip: { position: "absolute", width: 80, alignItems: "center", paddingVertical: 3, borderRadius: 10, backgroundColor: colors.gold },
  chipText: { color: "#1a1206", fontSize: 11, fontWeight: "700" },
  thumbWrap: { position: "absolute", width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 1.2, borderColor: "rgba(255,231,176,0.8)", overflow: "hidden", backgroundColor: colors.bg2 },
  thumb: { width: "100%", height: "100%" },
  today: { position: "absolute", width: 20, height: 20, borderRadius: 10, borderWidth: 1.4, borderColor: colors.gold, alignItems: "center", justifyContent: "center" },
  todayDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.gold },
  count: { color: colors.gold, fontSize: 11, letterSpacing: 1.6, fontWeight: "600" },
  line: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center", paddingHorizontal: 20 },
  thread: { fontFamily: fonts.serif, fontStyle: "italic", fontSize: 14, color: colors.gold, textAlign: "center" },
});
