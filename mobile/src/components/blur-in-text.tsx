import { useEffect, useState } from "react";
import { PixelRatio, Text, View, type TextStyle } from "react-native";
import Animated, { useAnimatedProps, useAnimatedReaction, useReducedMotion, useSharedValue, type SharedValue } from "react-native-reanimated";
import Svg, { Defs, FeGaussianBlur, Filter, G, Text as SvgText, TSpan } from "react-native-svg";
import { useAmbient } from "@/lib/ambient-clock";
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
 * hing. Jetzt gilt der Filter für die ganze Zeichenfläche, und die ist
 * rundum so viel größer als die Schrift, dass die Unschärfe vorher ausläuft.
 *
 * ⚠ Kein Umschalten am Ende (Antons Befund 10.10.: „Tell it out loud"
 * sprang nach dem Einblenden in die Position): SVG setzt Buchstaben-Stücke
 * nicht exakt wie die normale Schrift — mittig verankert lag die Zeile
 * daneben, und beim Wechsel auf den normalen Text sprang sie. Jetzt steht
 * die SVG-Zeile genau dort, wo die normale Zeile liegt (Anfang und
 * Grundlinie aus onTextLayout), und bleibt stehen. Der normale Text liegt
 * unsichtbar darunter: Er hält den Platz und ist das, was VoiceOver liest.
 * Bei „Bewegung reduzieren" nur der normale Text.
 *
 * ⚠ Im gemeinsamen 30er-Takt (10.10., Antons Befund „kleiner Lag beim
 * ersten Öffnen des Traum-Tabs"): Jede Änderung eines Buchstabens zeichnet
 * die ganze Zeichenfläche neu, samt beider Unschärfe-Filter (Core Image,
 * auf dem Hauptthread). Mit withTiming geschah das jedes Bild — auf
 * ProMotion 120 Mal je Sekunde, zwei Sekunden lang. Jetzt läuft die Zeit
 * im Takt der ruhigen Bewegungen (lib/ambient-clock.tsx), ein Viertel der
 * Arbeit; ein weiches Einblenden sieht man darin nicht stufig. */
const AnimatedTSpan = Animated.createAnimatedComponent(TSpan);
const WIN = 900;                                  // so lange braucht ein Buchstabe vom Schleier zur Schrift (ms)
let seq = 0;

export function BlurInText({ text, style, align = "left", numberOfLines = 1, accessibilityRole }: {
  text: string; style: TextStyle; align?: "left" | "center"; numberOfLines?: number; accessibilityRole?: "header";
}) {
  const reduce = useReducedMotion();
  const active = useScreenActive();
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [line, setLine] = useState<{ x: number; base: number } | null>(null);   // wo die normale Zeile wirklich liegt
  const [id] = useState(() => `bi${++seq}`);
  const t = useSharedValue(0);                    // Zeit seit Beginn, in ms
  const start = useSharedValue(-1);               // Takt-Stand beim Beginn (−1: der nächste Schlag)
  const [playing, setPlaying] = useState(false);
  const clock = useAmbient(playing);
  /* Leerzeichen als festes Leerzeichen: SVG schluckt sie sonst am Rand eines Stücks. */
  const chars = Array.from(text).map((c) => (c === " " ? " " : c));
  const n = Math.max(1, chars.length);
  const stagger = Math.max(45, Math.min(90, 1100 / n));
  const total = WIN + stagger * (n - 1);
  const ready = !reduce && !!box && !!line;

  /* Bei jedem Wiederkommen (und wenn sich der Text ändert) neu einblenden.
     Beim Weggehen auf den Anfang (alles unsichtbar) — so blitzt beim
     Wiederkommen nichts Fertiges auf. */
  useEffect(() => {
    if (!ready) return;
    if (!active) { setPlaying(false); t.value = 0; return; }
    t.value = 0;
    start.value = -1;
    setPlaying(true);
    const done = setTimeout(() => { t.value = total; setPlaying(false); }, total + 120);
    return () => clearTimeout(done);
  }, [active, text, ready, total, t, start]);
  useAnimatedReaction(() => clock.value, (now) => {
    if (!playing) return;
    if (start.value < 0) start.value = now;
    t.value = Math.min(total, now - start.value);
  }, [playing, total]);

  const size = (style.fontSize ?? 17) * PixelRatio.getFontScale();
  const PAD = Math.ceil(size * 0.75);             // Luft rundum: mehr als die Unschärfe weit reicht
  const W = (box?.w ?? 0) + 2 * PAD, H = (box?.h ?? 0) + 2 * PAD;
  const heavy = size * 0.2, light = size * 0.07;

  const row = (layer: 0 | 1 | 2) => (
    <SvgText x={PAD + (line?.x ?? 0)} y={PAD + (line?.base ?? 0)} textAnchor="start" letterSpacing={style.letterSpacing}
      fontFamily={style.fontFamily} fontSize={size} fontWeight={style.fontWeight as any} fill={String(style.color ?? "#fff")}>
      {chars.map((c, i) => <Glyph key={i} ch={c} at={i * stagger} layer={layer} t={t} />)}
    </SvgText>
  );
  return (
    <View onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      {...(!reduce ? { accessible: true, accessibilityRole, accessibilityLabel: text } : {})}>
      {/* der normale Text: hält den Platz und liefert die Lage der Zeile (vorgelesen wird die Fläche darum) */}
      <Text style={[style, { textAlign: align }, !reduce && { opacity: 0 }]} numberOfLines={numberOfLines} accessibilityRole={reduce ? accessibilityRole : undefined}
        onTextLayout={(e) => { const l = e.nativeEvent.lines[0]; if (l) setLine({ x: l.x, base: l.y + l.ascender }); }}>{text}</Text>
      {ready ? (
        <View pointerEvents="none" style={{ position: "absolute", left: -PAD, top: -PAD, width: W, height: H }}
          accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Svg width={W} height={H}>
            <Defs>
              {/* Filterbereich = die ganze Zeichenfläche, nicht das Wort */}
              <Filter id={`${id}-h`} filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
                <FeGaussianBlur stdDeviation={heavy} />
              </Filter>
              <Filter id={`${id}-l`} filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
                <FeGaussianBlur stdDeviation={light} />
              </Filter>
            </Defs>
            <G filter={`url(#${id}-h)`}>{row(0)}</G>
            <G filter={`url(#${id}-l)`}>{row(1)}</G>
            {row(2)}
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
