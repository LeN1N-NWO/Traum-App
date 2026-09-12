import { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, Extrapolation, type SharedValue } from "react-native-reanimated";
import { DreamPoster } from "@/components/dream-poster";
import type { DreamItem } from "@/store/journal-store";
import { colors } from "@/theme";

/* Das Deck aus dem Web-Journal (journal.css .j-deck): eine Plakatkarte je
   Traum, seitlich durchgewischt; die Karte in der Mitte steht vorn, die
   Nachbarn lugen kleiner und gekippt von den Seiten herein, darunter die
   Punkte. Nativ mit Snap und Reanimated auf dem UI-Thread. */
export function DreamDeck({ items, locale, onOpen }: { items: DreamItem[]; locale: string; onOpen: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width * 0.68, 300);
  const overlap = Math.round(cardW * 0.11);
  const stride = cardW - overlap;
  const side = (width - cardW) / 2;
  const x = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const onScroll = useAnimatedScrollHandler({ onScroll: (e) => { x.value = e.contentOffset.x; } });

  return (
    <View>
      <Animated.ScrollView
        horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast"
        snapToInterval={stride} snapToAlignment="start" disableIntervalMomentum
        contentContainerStyle={{ paddingHorizontal: side, paddingVertical: 16 }}
        onScroll={onScroll} scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / stride))}
      >
        {items.map((item, i) => (
          <DeckCard key={item.id} i={i} x={x} stride={stride} cardW={cardW} overlap={overlap} total={items.length}>
            <DreamPoster item={item} locale={locale} onPress={onOpen} />
          </DeckCard>
        ))}
      </Animated.ScrollView>
      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((it, i) => <View key={it.id} style={[styles.dot, i === index && styles.dotOn]} />)}
        </View>
      ) : null}
    </View>
  );
}

function DeckCard({ i, x, stride, cardW, overlap, total, children }: { i: number; x: SharedValue<number>; stride: number; cardW: number; overlap: number; total: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => {
    // -1 … 0 … 1: wie weit die Karte von der Mitte entfernt ist, in Karten.
    const n = interpolate(x.value, [(i - 1) * stride, i * stride, (i + 1) * stride], [1, 0, -1], Extrapolation.CLAMP);
    const a = Math.abs(n);
    return {
      transform: [{ perspective: 1000 }, { scale: 1 - 0.12 * a }, { rotateY: `${-10 * n}deg` }],
      opacity: 1 - 0.3 * a,
      zIndex: 100 - Math.round(a * 100),
    };
  });
  return (
    <Animated.View style={[{ width: cardW, marginHorizontal: -overlap / 2, marginLeft: i === 0 ? 0 : -overlap / 2, marginRight: i === total - 1 ? 0 : -overlap / 2 }, styles.shadow, style]}>
      <View style={{ aspectRatio: 4 / 5 }}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: { shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 17, shadowOffset: { width: 0, height: 12 } },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.panelLine },
  dotOn: { width: 18, backgroundColor: colors.accentSoft },
});
