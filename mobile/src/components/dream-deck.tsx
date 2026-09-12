import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from "react-native-reanimated";
import { DreamPoster } from "@/components/dream-poster";
import type { DreamItem } from "@/store/journal-store";
import { colors } from "@/theme";

/* Das Deck: die Träume liegen HINTEREINANDER GESTAPELT (Antons Vorbild
   13.09.) — vorne eine Karte gerade und groß, dahinter die Nachbarn nach
   beiden Seiten aufgefächert: kleiner, gekippt, gedämpft.
 *
 * ⚠ Warum KEIN Scroller mehr: In einer horizontalen `ScrollView` malt die
 * spätere Karte über die frühere, und `zIndex` aus einem Reanimated-Stil
 * greift dort nicht — bei starker Überlappung lag der Titel der Nachbarin
 * quer über der vorderen Karte (Befund 13.09., zwei Anläufe). Ein Stapel
 * braucht die Reihenfolge des MALENS: die fernsten Karten zuerst, die
 * vordere zuletzt. Das geht nur, wenn wir selbst zeichnen — also ein
 * Fächer aus absolut gesetzten Karten und eine Wisch-Geste darauf. */
const FRONT = 0.74;      // Breite der vorderen Karte, Anteil der Bildschirmbreite
const PEEK = 0.085;      // wie weit eine Karte dahinter zur Seite lugt (Anteil Kartenbreite)
const TILT = 5;          // Grad Kippung je Karte nach hinten
const SHRINK = 0.07;     // wie stark eine Karte nach hinten schrumpft
const FADE = 0.16;       // wie stark sie verblasst
const WINDOW = 3;        // so viele Karten je Seite bleiben sichtbar

export function DreamDeck({ items, locale, onOpen }: { items: DreamItem[]; locale: string; onOpen: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width * FRONT, 320);
  const cardH = Math.round(cardW * 1.25);
  const [index, setIndex] = useState(0);
  const drag = useSharedValue(0);          // −1 … 1 während des Wischens
  const last = Math.max(0, items.length - 1);
  const at = Math.min(index, last);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-18, 18])
    .onUpdate((e) => { drag.value = Math.max(-1.2, Math.min(1.2, -e.translationX / (cardW * 0.55))); })
    .onEnd((e) => {
      "worklet";
      const ziel = drag.value + (-e.velocityX / (cardW * 6));
      const step = ziel > 0.35 ? 1 : ziel < -0.35 ? -1 : 0;
      drag.value = withSpring(0, { damping: 20, stiffness: 180 });
      if (step !== 0) runStep(step);
    })
    .runOnJS(true);

  function runStep(step: number) {
    const next = Math.max(0, Math.min(last, at + step));
    if (next !== at) { Haptics.selectionAsync(); setIndex(next); }
  }

  /* Malreihenfolge: die fernsten Karten zuerst, die vordere zuletzt. */
  const sichtbar = useMemo(() => {
    const out: { item: DreamItem; i: number }[] = [];
    for (let d = WINDOW; d >= 1; d--) {
      for (const s of [-1, 1]) {
        const i = at + d * s;
        if (items[i]) out.push({ item: items[i], i });
      }
    }
    if (items[at]) out.push({ item: items[at], i: at });
    return out;
  }, [items, at]);

  return (
    <View>
      <GestureDetector gesture={pan}>
        <View style={[styles.stage, { height: cardH + 36 }]}>
          {sichtbar.map(({ item, i }) => (
            <DeckCard key={item.id} k={i - at} drag={drag} cardW={cardW} cardH={cardH}>
              <DreamPoster item={item} locale={locale} onPress={(id) => (i === at ? onOpen(id) : runStep(i > at ? 1 : -1))} />
            </DeckCard>
          ))}
        </View>
      </GestureDetector>
      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((it, i) => <View key={it.id} style={[styles.dot, i === at && styles.dotOn]} />)}
        </View>
      ) : null}
    </View>
  );
}

function DeckCard({ k, drag, cardW, cardH, children }: { k: number; drag: SharedValue<number>; cardW: number; cardH: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => {
    // n: Platz im Fächer, 0 = vorn. Während des Wischens wandert der ganze Fächer.
    const n = k + drag.value;
    const a = Math.abs(n);
    return {
      transform: [
        { perspective: 900 },
        { translateX: n * cardW * PEEK },
        { rotateZ: `${n * TILT}deg` },
        { scale: 1 - SHRINK * a },
      ],
      opacity: Math.max(0, 1 - FADE * a),
    };
  });
  return (
    <Animated.View style={[styles.card, { width: cardW, height: cardH, marginLeft: -cardW / 2, marginTop: -cardH / 2 }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: "center", justifyContent: "center" },
  card: {
    position: "absolute", left: "50%", top: "50%",
    shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 10 },
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.panelLine },
  dotOn: { width: 18, backgroundColor: colors.accentSoft },
});
