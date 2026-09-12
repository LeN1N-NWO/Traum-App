import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, fonts, radius } from "@/theme";

import type { DreamItem } from "@/store/journal-store";

/* Ein Film hat kein Poster — das erste Bild ist der erste Frame. Einmal
   gezogen, im Speicher gehalten: dieselbe Kachel darf nicht bei jedem
   Scrollen neu rechnen. */
const thumbs = new Map<string, string>();
function useThumbnail(media: DreamItem["media"]) {
  const [uri, setUri] = useState<string | null>(media ? (media.kind === "image" ? media.url : thumbs.get(media.url) ?? null) : null);
  useEffect(() => {
    if (!media || media.kind !== "film" || thumbs.has(media.url)) return;
    let alive = true;
    VideoThumbnails.getThumbnailAsync(media.url, { time: 800, quality: 0.7 })
      .then((r) => { thumbs.set(media.url, r.uri); if (alive) setUri(r.uri); })
      .catch(() => {});
    return () => { alive = false; };
  }, [media]);
  return uri;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DreamPoster({ item, locale, onPress }: { item: DreamItem; locale: string; onPress: (id: string) => void }) {
  const uri = useThumbnail(item.media);
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const date = new Date(item.createdAt);
  const day = date.toLocaleDateString(locale, { day: "numeric", month: "short" });

  return (
    <AnimatedPressable
      style={[styles.card, style]}
      onPressIn={() => { scale.value = withSpring(0.965, { damping: 18, stiffness: 260 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 200 }); }}
      onPress={() => { Haptics.selectionAsync(); onPress(item.id); }}
      accessibilityRole="button"
      accessibilityLabel={item.title || "Untitled dream"}
    >
      {uri
        ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" transition={220} />
        : <View style={[StyleSheet.absoluteFill, styles.blank]} />}
      {/* Der Schleier trägt den Titel, wie auf einem Plakat: unten dicht, oben nichts. */}
      <LinearGradient
        colors={["rgba(5,10,20,0)", "rgba(5,10,20,0.55)", "rgba(5,10,20,0.92)"]}
        locations={[0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.date}>{day.toUpperCase()}</Text>
      <View style={styles.body}>
        {item.pending && (
          <View style={styles.pending}>
            <View style={styles.dot} />
            <Text style={styles.pendingText}>Rendering…</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>{item.title || "Untitled dream"}</Text>
        <Text style={styles.sub} numberOfLines={2}>{item.tagline || item.text}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, aspectRatio: 3 / 4, borderRadius: radius.card, overflow: "hidden",
    backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine,
  },
  blank: { backgroundColor: colors.sky },
  date: {
    position: "absolute", top: 12, left: 14, color: colors.text, fontSize: 11, fontWeight: "600",
    letterSpacing: 1.4, opacity: 0.85,
  },
  body: { position: "absolute", left: 14, right: 14, bottom: 14, gap: 3 },
  title: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 25, color: colors.text, letterSpacing: -0.2 },
  sub: { color: colors.muted, fontSize: 12.5, lineHeight: 17 },
  pending: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warm },
  pendingText: { color: colors.warm, fontSize: 11, fontWeight: "600", letterSpacing: 0.6 },
});
