import { useEffect, useState } from "react";
import { PixelRatio, Text, View, type TextStyle } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Defs, FeGaussianBlur, Filter, G, LinearGradient, Mask, Rect, Stop, Text as SvgText } from "react-native-svg";
import { useScreenActive } from "@/lib/use-screen-active";

/* Überschriften, die verträumt aus der Unschärfe auftauchen (Antons Wunsch
 * 10.10.): erst erscheint die Zeile verschwommen, dann zieht eine weiche
 * Schärfekante von links nach rechts darüber — die Schärfe folgt dem
 * Lesefluss. Jedes Mal, wenn der Bildschirm wieder nach vorn kommt.
 *
 * Gebaut aus zwei SVG-Ebenen derselben Zeile: unscharf (Gauß-Filter) und
 * scharf, jede durch eine Maske, deren weiche Kante wandert. Danach steht
 * wieder ein normaler Text da — VoiceOver, Dynamic Type und Kopieren wie
 * immer. Bei „Bewegung reduzieren" gleich der normale Text. */
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);
let seq = 0;

export function BlurInText({ text, style, align = "left", duration = 1800, numberOfLines = 1, accessibilityRole }: {
  text: string; style: TextStyle; align?: "left" | "center"; duration?: number; numberOfLines?: number; accessibilityRole?: "header";
}) {
  const reduce = useReducedMotion();
  const active = useScreenActive();
  const [w, setW] = useState(0);
  const [tw, setTw] = useState(0);               // Breite der Schrift selbst — die Kante läuft nur über das Wort
  const [playing, setPlaying] = useState(!reduce);
  const [id] = useState(() => `bi${++seq}`);
  const p = useSharedValue(0);

  /* Bei jedem Wiederkommen (und wenn sich der Text ändert) neu einblenden.
     Schon beim Weggehen auf den Anfang stellen — sonst blitzt beim
     Wiederkommen kurz die fertige Schrift auf. */
  useEffect(() => {
    if (reduce) return;
    if (!active) { setPlaying(true); p.value = 0; return; }
    if (!w || !tw) return;
    setPlaying(true);
    p.value = 0;
    p.value = withTiming(1, { duration, easing: Easing.linear }, (done) => { if (done) runOnJS(setPlaying)(false); });
  }, [active, text, w, tw, reduce, duration, p]);

  const size = (style.fontSize ?? 17) * PixelRatio.getFontScale();
  const lineH = style.lineHeight ? style.lineHeight * PixelRatio.getFontScale() : size * 1.3;
  const T = tw || w;
  const PAD = Math.ceil(size * 0.9);             // Luft rundum, damit die Unschärfe nicht an der Zeichenfläche abreißt
  const E = Math.max(30, T * 0.5);               // Breite der weichen Kante
  const x0 = PAD + (align === "center" ? (w - T) / 2 : 0);
  /* Erst ein Fünftel: die Zeile erscheint nur verschwommen. Dann zieht die
     Schärfe von links nach rechts über das Wort (sanft auslaufend). */
  const sweep = (v: number) => { "worklet"; const q = Math.max(0, Math.min(1, (v - 0.2) / 0.8)); return 1 - (1 - q) * (1 - q); };
  const sharpX = useAnimatedProps(() => ({ x: x0 - (T + E) + sweep(p.value) * (T + E) }));
  const softX = useAnimatedProps(() => ({ x: x0 - E + sweep(p.value) * (T + E) }));
  const softIn = useAnimatedProps(() => ({ opacity: Math.min(1, p.value / 0.2) }));

  const plain = (
    <Text style={[style, { textAlign: align }]} numberOfLines={numberOfLines} accessibilityRole={accessibilityRole}
      onTextLayout={(e) => setTw(Math.max(0, ...e.nativeEvent.lines.map((l) => l.width)))}>{text}</Text>
  );
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {/* der normale Text hält den Platz und steht am Ende allein da */}
      <View style={{ opacity: playing ? 0 : 1 }}>{plain}</View>
      {playing && w > 0 ? (
        <View pointerEvents="none" style={{ position: "absolute", left: -PAD, top: 0, width: w + 2 * PAD, bottom: 0, justifyContent: "center" }} accessible={false} importantForAccessibility="no-hide-descendants">
          <Svg width={w + 2 * PAD} height={lineH + 2 * PAD} style={{ marginVertical: -PAD }}>
            <Defs>
              <LinearGradient id={`${id}-gs`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#fff" />
                <Stop offset={String(T / (T + E))} stopColor="#fff" />
                <Stop offset="1" stopColor="#000" />
              </LinearGradient>
              <LinearGradient id={`${id}-gb`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#000" />
                <Stop offset={String(E / (T + E))} stopColor="#fff" />
                <Stop offset="1" stopColor="#fff" />
              </LinearGradient>
              <Mask id={`${id}-ms`}>
                <AnimatedRect animatedProps={sharpX} y={0} width={T + E} height={lineH + 2 * PAD} fill={`url(#${id}-gs)`} />
              </Mask>
              <Mask id={`${id}-mb`}>
                <AnimatedRect animatedProps={softX} y={0} width={T + E} height={lineH + 2 * PAD} fill={`url(#${id}-gb)`} />
              </Mask>
              <Filter id={`${id}-f`} x="-50%" y="-150%" width="200%" height="400%">
                <FeGaussianBlur stdDeviation={size * 0.14} />
              </Filter>
            </Defs>
            {/* unscharf, rechts der Kante */}
            <AnimatedG animatedProps={softIn} mask={`url(#${id}-mb)`}>
              <G filter={`url(#${id}-f)`}>
                <SvgText x={PAD + (align === "center" ? w / 2 : 0)} y={PAD + lineH * 0.5 + size * 0.36} textAnchor={align === "center" ? "middle" : "start"}
                  fontFamily={style.fontFamily} fontSize={size} fontWeight={style.fontWeight as any} fill={String(style.color ?? "#fff")}>{text}</SvgText>
              </G>
            </AnimatedG>
            {/* scharf, links der Kante */}
            <G mask={`url(#${id}-ms)`}>
              <SvgText x={PAD + (align === "center" ? w / 2 : 0)} y={PAD + lineH * 0.5 + size * 0.36} textAnchor={align === "center" ? "middle" : "start"}
                fontFamily={style.fontFamily} fontSize={size} fontWeight={style.fontWeight as any} fill={String(style.color ?? "#fff")}>{text}</SvgText>
            </G>
          </Svg>
        </View>
      ) : null}
    </View>
  );
}
