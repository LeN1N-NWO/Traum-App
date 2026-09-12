import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DreamItem } from "@/store/journal-store";
import { colors } from "@/theme";

/* Die Listenzeile aus JournalCard (variant="row"): Tag und Monat links,
   Titel und Anfang, kleines Bild rechts. */
export function DreamRow({ item, months, onPress, rendering, untitled }: { item: DreamItem; months: string[]; onPress: (id: string) => void; rendering: string; untitled: string }) {
  const d = new Date(item.createdAt);
  return (
    <Pressable style={styles.row} onPress={() => { Haptics.selectionAsync(); onPress(item.id); }}>
      <View style={styles.date}><Text style={styles.day}>{d.getDate()}</Text><Text style={styles.month}>{(months?.[d.getMonth()] ?? "").toUpperCase()}</Text></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title} numberOfLines={1}>{item.title || untitled}</Text>
        <Text style={styles.text} numberOfLines={2}>{item.pending ? rendering : (item.tagline || item.text)}</Text>
      </View>
      {item.media ? <Image source={{ uri: item.media.url }} style={styles.thumb} contentFit="cover" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.panelLine },
  date: { width: 34, alignItems: "center" },
  day: { color: colors.text, fontSize: 16, fontWeight: "600", lineHeight: 18 },
  month: { color: colors.faint, fontSize: 10, letterSpacing: 0.6 },
  title: { color: colors.text, fontSize: 15, fontWeight: "600" },
  text: { color: colors.muted, fontSize: 13, lineHeight: 17 },
  thumb: { width: 46, height: 46, borderRadius: 10, backgroundColor: colors.bg2 },
});
