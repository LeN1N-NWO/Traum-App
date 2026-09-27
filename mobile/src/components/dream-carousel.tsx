import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { Extrapolation, interpolate, type SharedValue, useAnimatedProps, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { DreamTile } from "@/components/dream-tile";
import type { DreamItem } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Das Journal als Karussell (Antons Wunsch 27.09. abends: „wie ein
   Streifen zum Wischen, die Kachel in der Mitte im Fokus, nach außen hin
   rechts und links in Blur — muss fancy aussehen"). Die mittlere Kachel
   steht groß, scharf, mit goldenem Schein; die Nachbarn werden kleiner,
   kippen leicht nach hinten (3D) und verschwimmen. Alles hängt am
   Scroll-Wert auf dem UI-Thread — kein setState pro Bild. Nur die Kachel in
   der Mitte spielt ihren Film. Tipp auf die Mitte öffnet den Traum, Tipp
   auf einen Nachbarn holt ihn in die Mitte. */
const AnimatedBlur = Animated.createAnimatedComponent(BlurView);
const AnimatedList = Animated.createAnimatedComponent(FlatList<DreamItem>);

export function DreamCarousel({ items, untitled, locale, onOpen }: { items: DreamItem[]; untitled?: string; locale: string; onOpen: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const W = Math.round(width * 0.6);
  const GAP = 6;
  const STEP = W + GAP;
  const side = (width - W) / 2;
  const x = useSharedValue(0);
  const [focus, setFocus] = useState(0);
  const list = useRef<FlatList<DreamItem>>(null);
  const onScroll = useAnimatedScrollHandler((e) => { x.value = e.contentOffset.x; });
  const current = items[focus] ?? items[0];
  const date = current ? new Date(current.createdAt).toLocaleDateString(locale, { day: "numeric", month: "long" }) : "";

  return (
    <View style={{ marginHorizontal: -16 }}>
      <AnimatedList
        ref={list as any}
        data={items}
        keyExtractor={(e) => e.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: side, paddingVertical: 18 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        initialNumToRender={4}
        windowSize={5}
        onMomentumScrollEnd={(e) => {
          const i = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.x / STEP)));
          if (i !== focus) { Haptics.selectionAsync(); setFocus(i); }
        }}
        renderItem={({ item, index }) => (
          <Card index={index} x={x} step={STEP} gap={GAP} width={W}>
            <DreamTile item={item} live={index === focus} untitled={untitled} width={W}
              onPress={() => {
                if (index === focus) onOpen(item.id);
                else list.current?.scrollToOffset({ offset: index * STEP, animated: true });
              }} />
          </Card>
        )}
      />
      <View style={styles.caption}>
        <Text style={styles.date}>{date.toUpperCase()}</Text>
        <Text style={styles.count}>{items.length ? `${focus + 1} / ${items.length}` : ""}</Text>
      </View>
    </View>
  );
}

function Card({ index, x, step, gap, width, children }: { index: number; x: SharedValue<number>; step: number; gap: number; width: number; children: React.ReactNode }) {
  const range = [(index - 1) * step, index * step, (index + 1) * step];
  const card = useAnimatedStyle(() => {
    const d = interpolate(x.value, range, [-1, 0, 1], Extrapolation.CLAMP);
    const a = Math.abs(d);
    return {
      opacity: 1 - 0.35 * a,
      transform: [
        { perspective: 900 },
        { translateY: 16 * a },
        { scale: 1 - 0.16 * a },
        { rotateY: `${-d * 22}deg` },
      ],
    };
  });
  // Der goldene Schein der Mitte — wächst, je näher die Kachel der Mitte kommt.
  const glow = useAnimatedStyle(() => {
    const a = Math.abs(interpolate(x.value, range, [-1, 0, 1], Extrapolation.CLAMP));
    return { shadowOpacity: 0.55 * (1 - a), borderColor: `rgba(246,198,91,${0.7 * (1 - a)})` };
  });
  const blur = useAnimatedProps(() => {
    const a = Math.abs(interpolate(x.value, range, [-1, 0, 1], Extrapolation.CLAMP));
    return { intensity: 38 * a };
  });
  return (
    <Animated.View style={[{ width, marginRight: gap }, card]}>
      <Animated.View style={[styles.frame, glow]}>
        <View style={styles.clip}>
          {children}
          <AnimatedBlur tint="dark" animatedProps={blur} style={StyleSheet.absoluteFill} pointerEvents="none" />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 17, borderWidth: 1, overflow: "visible", shadowColor: "#f4c27a", shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  clip: { borderRadius: 16, overflow: "hidden" },
  caption: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: 20, marginTop: -2 },
  date: { color: colors.faint, fontSize: 11, letterSpacing: 1.6, fontWeight: "600" },
  count: { color: colors.faint, fontSize: 12, fontFamily: fonts.serif, fontVariant: ["tabular-nums"] },
});
