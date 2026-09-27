import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DreamItem } from "@/store/journal-store";
import { useRecording } from "@/store/recording-store";
import { colors, fonts } from "@/theme";

/* Ein Traum als kleines Plakat (27.09.): zuerst auf der Startseite
   ausprobiert, dort hat Anton die kleine Ansicht gemocht — jetzt ist sie
   die Ansicht im Journal (Raster statt großem Deck). Nur `live` läuft als
   Film (stumm, Schleife); mehrere Player gleichzeitig bremsen den Renderer,
   die anderen zeigen ihr Standbild. Während einer Aufnahme steht der Film
   (recording-store.ts). */
export function DreamTile({ item, live = false, untitled, width, onPress }: { item: DreamItem; live?: boolean; untitled?: string; width: number; onPress: () => void }) {
  const film = live ? item.films[item.films.length - 1]?.url ?? null : null;
  const still = item.poster ?? item.images[0] ?? (item.media?.kind === "image" ? item.media.url : null);
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }} style={({ pressed }) => [styles.tile, { width, height: Math.round(width * 1.48), transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      {film ? <TileFilm url={film} /> : still ? <Image source={{ uri: still }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]} />}
      <LinearGradient colors={["rgba(5,10,20,0)", "rgba(5,10,20,0.85)"]} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
      {item.pending ? <View style={styles.pending}><View style={styles.dot} /></View> : null}
      {item.films.length ? <View style={styles.play}><Text style={styles.playText}>▶</Text></View> : null}
      <Text style={styles.title} numberOfLines={2}>{item.title || untitled}</Text>
    </Pressable>
  );
}

function TileFilm({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => { p.loop = true; p.muted = true; p.play(); });
  const rec = useRecording();
  useEffect(() => { player.loop = true; player.muted = true; if (rec) player.pause(); else player.play(); }, [player, rec]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

const styles = StyleSheet.create({
  tile: { borderRadius: 16, overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  title: { position: "absolute", left: 9, right: 9, bottom: 9, fontFamily: fonts.serif, fontSize: 14, lineHeight: 17, color: colors.text },
  pending: { position: "absolute", top: 9, right: 9 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warm },
  play: { position: "absolute", top: 8, left: 8, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,10,20,0.45)" },
  playText: { color: colors.text, fontSize: 8, marginLeft: 1 },
});
