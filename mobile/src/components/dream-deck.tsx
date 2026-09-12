import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { DreamPoster } from "@/components/dream-poster";
import type { DreamItem } from "@/store/journal-store";
import { colors, radius } from "@/theme";

/* Das Deck: EIN Traum vorn, dahinter der Stapel (Antons Vorbild 13.09.).
 *
 * ⚠ Dritter Anlauf, und der einfachste — die beiden davor sind an dem
 * Versuch gescheitert, echte Nachbarkarten hinter die vordere zu legen:
 *   1. Horizontaler Scroller: die spätere Karte malt über die frühere,
 *      `zIndex` aus einem Reanimated-Stil greift dort nicht → der Titel
 *      der Nachbarin lag quer über der vorderen Karte.
 *   2. Eigener Fächer mit Pan-Geste: Malreihenfolge stimmte, aber das
 *      Wischen war eigenwillig (Antons Befund: „verhält sich ganz komisch,
 *      kann ich gar nicht richtig scrollen") und die Kippung sah fremd aus.
 *
 * Jetzt: ein GANZ NORMALER seitenweiser Scroller — Maus, Trackpad und
 * Finger verhalten sich, wie iOS es überall tut. Der Stapel dahinter sind
 * zwei ruhige Blätter je Seite, gezeichnet BEVOR die Karte kommt. Sie
 * gehören zur Seite, nicht zu den Nachbartraumkarten; deshalb kann nichts
 * mehr über der vorderen Karte liegen. */
const CARD = 0.78;      // Breite der Karte, Anteil der Bildschirmbreite
const SHEETS = [
  { dx: 16, dy: 10, scale: 0.955, opacity: 0.5 },
  { dx: 30, dy: 19, scale: 0.91, opacity: 0.28 },
];

export function DreamDeck({ items, locale, onOpen }: { items: DreamItem[]; locale: string; onOpen: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width * CARD, 320);
  const cardH = Math.round(cardW * 1.25);
  const [index, setIndex] = useState(0);
  const letzter = useRef(0);

  return (
    <View>
      <ScrollView
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== letzter.current) { letzter.current = i; Haptics.selectionAsync(); setIndex(i); }
        }}
        scrollEventThrottle={32}
      >
        {items.map((item, i) => (
          <View key={item.id} style={[styles.page, { width, height: cardH + 46 }]}>
            {/* Die Blätter dahinter — nur bei einem Traum, der Nachbarn hat. */}
            {i < items.length - 1 ? SHEETS.map((s, k) => (
              <View key={k} pointerEvents="none" style={[styles.sheet, {
                width: cardW, height: cardH, borderRadius: radius.card,
                transform: [{ translateX: s.dx }, { translateY: s.dy }, { scale: s.scale }],
                opacity: s.opacity,
              }]} />
            )) : null}
            <View style={{ width: cardW, height: cardH }}>
              <DreamPoster item={item} locale={locale} onPress={onOpen} />
            </View>
          </View>
        ))}
      </ScrollView>
      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((it, i) => <View key={it.id} style={[styles.dot, i === index && styles.dotOn]} />)}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { alignItems: "center", justifyContent: "center" },
  sheet: {
    position: "absolute", backgroundColor: colors.bg2,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine,
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.panelLine },
  dotOn: { width: 18, backgroundColor: colors.accentSoft },
});
