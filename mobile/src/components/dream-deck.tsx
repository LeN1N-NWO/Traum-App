import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from "react-native";
import { DreamPoster } from "@/components/dream-poster";
import type { DreamItem } from "@/store/journal-store";
import { colors, radius } from "@/theme";

/* Das Deck: EIN Traum vorn, dahinter der Stapel (Antons Vorbild 13.09.).
 *
 * ⚠ Die BREITE wird gemessen, nicht angenommen — daran ist der dritte
 * Anlauf gescheitert (Antons Befund: „die rasten gar nicht aus, bleiben
 * irgendwo dazwischen stehen"): Eine Seite war so breit wie der
 * BILDSCHIRM, der Scroller selbst aber 32 Punkte schmaler (das Polster des
 * Journals). `pagingEnabled` rastet auf die Breite des SCROLLERS — bei
 * jeder Seite lief der Versatz um 32 Punkte weiter auseinander. Jetzt
 * liefert `onLayout` die echte Breite, Seite und Raster sind dieselbe Zahl,
 * und das Einrasten ist wieder das des Systems: sanft rein, sanft raus,
 * eine Karte je Anstoßen.
 *
 * Frühere Anläufe, die nicht wiederkommen sollen: ein eigener Fächer mit
 * Pan-Geste (fühlte sich fremd an) und überlappende Nachbarkarten in einem
 * Scroller (die spätere Karte malt über die frühere, `zIndex` aus einem
 * Reanimated-Stil greift dort nicht). Der Stapel dahinter sind deshalb zwei
 * ruhige Blätter, die zur SEITE gehören. */
const CARD = 0.82;      // Breite der Karte, Anteil der Seitenbreite
const SHEETS = [
  { dx: 14, dy: 9, scale: 0.955, opacity: 0.5 },
  { dx: 26, dy: 17, scale: 0.91, opacity: 0.28 },
];

export function DreamDeck({ items, locale, onOpen }: { items: DreamItem[]; locale: string; onOpen: (id: string) => void }) {
  const [w, setW] = useState(0);
  const [index, setIndex] = useState(0);
  const letzter = useRef(0);
  const cardW = Math.min(w * CARD, 320);
  const cardH = Math.round(cardW * 1.25);

  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width))}>
      {w > 0 ? (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={w}
            snapToAlignment="start"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / w);
              if (i !== letzter.current) { letzter.current = i; Haptics.selectionAsync(); setIndex(i); }
            }}
          >
            {items.map((item, i) => (
              <View key={item.id} style={[styles.page, { width: w, height: cardH + 46 }]}>
                {/* Die Blätter dahinter — nur, wenn es noch Träume gibt. */}
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
        </>
      ) : (
        <View style={{ height: 320 }} />
      )}
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
