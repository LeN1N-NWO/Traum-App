import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { DreamPoster } from "@/components/dream-poster";
import { useJournal } from "@/components/journal-data";
import { colors, fonts } from "@/theme";

/* Die Journal-Liste, nativ (12.09.2026) — der erste Bildschirm des Umzugs.
   Poster im Zweierraster, großer Titel, Suche im Kopf; die Traum-Seite
   dahinter ist noch die Web-Seite. Nebenräume (Besetzung, Atlas, Menagerie,
   Kalender) folgen, bis dahin erreichbar über das Raster-Symbol oben. */
export default function JournalScreen() {
  const router = useRouter();
  const { data, bridge } = useJournal();
  const [query, setQuery] = useState("");
  const locale = data?.language === "de" ? "de-DE" : "en-GB";
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data?.items ?? [];
    return q ? all.filter((e) => (e.text + " " + e.title).toLowerCase().includes(q)) : all;
  }, [data, query]);

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={({ item }) => (
          <DreamPoster item={item} locale={locale} onPress={(id) => router.push({ pathname: "/journal/[id]", params: { id } })} />
        )}
        ListHeaderComponent={data ? <Text style={styles.count}>{items.length === 1 ? "1 dream" : `${items.length} dreams`}</Text> : null}
        ListEmptyComponent={data ? <Text style={styles.empty}>{query ? "Nothing matches." : "No dreams yet. Tap + to capture one."}</Text> : null}
      />
      {/* Der große Titel in der Serife der Traumtitel — die App hat eine
          Buchstimme, nicht die einer Einstellungs-App. */}
      <Stack.Screen.Title
        large
        style={{ color: colors.text, fontFamily: fonts.serif }}
        largeStyle={{ color: colors.text, fontFamily: fonts.serif, fontSize: 36 }}
      >
        Journal
      </Stack.Screen.Title>
      <Stack.SearchBar placeholder="Search dreams" onChangeText={(e) => setQuery(e.nativeEvent.text)} hideWhenScrolling />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="square.grid.2x2" onPress={() => router.push("/journal/web")} />
      </Stack.Toolbar>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 14, paddingBottom: 24, gap: 12 },
  row: { gap: 12 },
  count: { color: colors.faint, fontSize: 13, marginBottom: 2, marginLeft: 2 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 48, fontSize: 15 },
  bridge: { height: 0, overflow: "hidden" },
});
