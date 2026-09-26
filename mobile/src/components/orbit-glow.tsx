import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";
import { colors } from "@/theme";

/* Der umlaufende Leuchtrand (Antons Ansage 26.09.): „eine schmale Linie,
   die sich immer im Kreis dreht, wie ein Loop" — an jedem Knopf, den man
   als Nächstes drücken soll. Ein Lichtstreifen (gut ein Fünftel des Umfangs)
   läuft um die abgerundete Kante; darunter derselbe Streifen breiter und
   blasser als Schein. Nur SVG + Reanimated, läuft auf dem UI-Thread.
   Die Ebene liegt ÜBER dem Knopf und fängt keine Tipps (pointerEvents none). */
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export function OrbitGlow({ radius, color = colors.warm, duration = 2800 }: { radius?: number; color?: string; duration?: number }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
  }, [t, duration]);

  const inset = 1.5;
  const w = Math.max(0, box.w - inset * 2), h = Math.max(0, box.h - inset * 2);
  const r = Math.min(radius ?? h / 2, h / 2, w / 2);
  // Umfang eines abgerundeten Rechtecks: gerade Stücke + ein ganzer Kreis.
  const perimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
  const dash = perimeter * 0.22;

  const line = useAnimatedProps(() => ({ strokeDashoffset: -t.value * perimeter }));
  const glow = useAnimatedProps(() => ({ strokeDashoffset: -t.value * perimeter }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {perimeter > 0 ? (
        <Svg width={box.w} height={box.h}>
          <AnimatedRect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none"
            stroke={color} strokeOpacity={0.28} strokeWidth={6} strokeLinecap="round"
            strokeDasharray={[dash * 1.2, perimeter - dash * 1.2]} animatedProps={glow} />
          <AnimatedRect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none"
            stroke={color} strokeWidth={1.6} strokeLinecap="round"
            strokeDasharray={[dash, perimeter - dash]} animatedProps={line} />
        </Svg>
      ) : null}
    </View>
  );
}
