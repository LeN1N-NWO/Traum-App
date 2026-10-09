import { useEffect, useState } from "react";
import { PixelRatio, Text, View, type TextStyle } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedProps, useReducedMotion, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import Svg, { Defs, FeGaussianBlur, Filter, G, Text as SvgText, TSpan } from "react-native-svg";
import { useScreenActive } from "@/lib/use-screen-active";

/* Überschriften, die verträumt aus der Unschärfe auftauchen (Antons Wunsch
 * 10.10.): Buchstabe für Buchstabe, von links nach rechts — jeder kommt
 * erst als weicher Schleier, wird dann scharf. Jedes Mal, wenn der
 * Bildschirm wieder nach vorn kommt.
 *
 * Gebaut aus drei SVG-Ebenen derselben Zeile: stark unscharf, leicht
 * unscharf, scharf. Jeder Buchstabe ist ein eigenes Stück (TSpan) und
 * blendet seine drei Fassungen nacheinander über — so wird er vom Schleier
 * zur Schrift.
 *
 * ⚠ Keine Maske und kein Filterbereich, der am Wort hängt (Antons Befund
 * 10.10.: „harte Kanten, sieht billig aus"): Die erste Fassung schnitt die
 * Unschärfe mit einer Maske ab, deren Bereich an den Umrissen des Wortes
 * hing — der Schleier stieß an einen unsichtbaren Kasten. Jetzt gilt der
 * Filter für die ganze Zeichenfläche, und die ist rundum so viel größer
 * als die Schrift, dass die Unschärfe vorher ausläuft.
 *
 * Danach steht wieder ein normaler Text da — VoiceOver, Dynamic Type und
 * Kopieren wie immer. Bei „Bewegung reduzieren" gleich der normale Text. */
const AnimatedTSpan = Animated.createAnimatedComponent(TSpan);
const WIN = 900;                                  // so lange braucht ein Buchstabe vom Schleier zur Schrift (ms)
let seq = 0;

export function BlurInText({ text, style, align = "left", numberOfLines = 1, accessibilityRole }: {
  text: string; style: TextStyle; align?: "left" | "center"; numberOfLines?: number; accessibilityRole?: "header";
}) {
  const reduce = useReducedMotion();
  const active = useScreenActive();
  const [w, setW] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const [id] = useState(() => `bi${++seq}`);
  const t = useSharedValue(0);                    // Zeit seit Beginn, in ms
  /* Leerzeichen als festes Leerzeichen: SVG schluckt sie sonst am Rand eines Stücks. */
  const chars = Array.from(text).map((c) => (c === " " ? " " : c));
  const n = Math.max(1, chars.length);
  const stagger = Math.max(45, Math.min(90, 1100 / n));
  const total = WIN + stagger * (n - 1);

  /* Bei jedem Wiederkommen (und wenn sich der Text ändert) neu einblenden.
     Schon beim Weggehen auf den Anfang stellen — sonst blitzt beim
     Wiederkommen kurz die fertige Schrift auf. */
  useEffect(() => {
    if (reduce) return;
    if (!active) { setPlaying(true); t.value = 0; return; }
    if (!w) return;
    setPlaying(true);
    t.value = 0;
    t.value = withTiming(total, { duration: total, easing: Easing.linear }, (done) => { if (done) runOnJS(setPlaying)(false); });
  }, [active, text, w, reduce, total, t]);

  const size = (style.fontSize ?? 17) * PixelRatio.getFontScale();
  const lineH = style.lineHeight ? style.lineHeight * PixelRatio.getFontScale() : size * 1.3;
  const PAD = Math.ceil(size * 0.75);             // Luft rundum: mehr als die Unschärfe weit reicht
  const W = w + 2 * PAD, H = lineH + 2 * PAD;
  const heavy = size * 0.2, light = size * 0.07;

  const plain = (
    <Text style={[style, { textAlign: align }]} numberOfLines={numberOfLines} accessibilityRole={accessibilityRole}>{text}</Text>
  );
  const line = (layer: 0 | 1 | 2) => (
    <SvgText x={PAD + (align === "center" ? w / 2 : 0)} y={PAD + lineH * 0.5 + size * 0.36} textAnchor={align === "center" ? "middle" : "start"}
      fontFamily={style.fontFamily} fontSize={size} fontWeight={style.fontWeight as any} fill={String(style.color ?? "#fff")}>
      {chars.map((c, i) => <Glyph key={i} ch={c} at={i * stagger} layer={layer} t={t} />)}
    </SvgText>
  );
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {/* der normale Text hält den Platz und steht am Ende allein da */}
      <View style={{ opacity: playing ? 0 : 1 }}>{plain}</View>
      {playing && w > 0 ? (
        <View pointerEvents="none" style={{ position: "absolute", left: -PAD, top: 0, width: W, bottom: 0, justifyContent: "center" }} accessible={false} importantForAccessibility="no-hide-descendants">
          <Svg width={W} height={H} style={{ marginVertical: -PAD }}>
            <Defs>
              {/* Filterbereich = die ganze Zeichenfläche, nicht das Wort */}
              <Filter id={`${id}-h`} filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
                <FeGaussianBlur stdDeviation={heavy} />
              </Filter>
              <Filter id={`${id}-l`} filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
                <FeGaussianBlur stdDeviation={light} />
              </Filter>
            </Defs>
            <G filter={`url(#${id}-h)`}>{line(0)}</G>
            <G filter={`url(#${id}-l)`}>{line(1)}</G>
            {line(2)}
          </Svg>
        </View>
      ) : null}
    </View>
  );
}

/* Ein Buchstabe in einer der drei Fassungen. `u` läuft für ihn 0 → 1:
   erst erscheint er (α), dann wird er scharf (f). Die drei Gewichte
   ergeben zusammen immer α — stark unscharf → leicht unscharf → scharf. */
function Glyph({ ch, at, layer, t }: { ch: string; at: number; layer: 0 | 1 | 2; t: SharedValue<number> }) {
  const props = useAnimatedProps(() => {
    const u = Math.max(0, Math.min(1, (t.value - at) / WIN));
    const a0 = Math.min(1, u / 0.5), f0 = Math.max(0, (u - 0.15) / 0.85);
    const a = a0 * a0 * (3 - 2 * a0), f = f0 * f0 * (3 - 2 * f0);
    const wgt = layer === 0 ? a * (1 - f) * (1 - f) : layer === 1 ? a * 2 * f * (1 - f) : a * f * f;
    return { fillOpacity: wgt };
  });
  return <AnimatedTSpan animatedProps={props}>{ch}</AnimatedTSpan>;
}
