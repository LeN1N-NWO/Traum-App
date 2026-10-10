import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DreamCalendar } from "@/components/dream-calendar";
import { DreamCarousel } from "@/components/dream-carousel";
import { DreamRow } from "@/components/dream-row";
import { MoonStrip } from "@/components/moon-strip";
import { Glass } from "@/components/glass";
import { NightSky } from "@/components/night-sky";
import { TabBar, TabTitle, useTabTop } from "@/components/tab-header";
import { useJournal } from "@/components/journal-data";
import { colors, radius, TAB_INSET } from "@/theme";

/* Das Journal, nativ — der Aufbau ist der des Web (JournalScreen.jsx),
   nur das Material ist neu: Kopf mit Titel und Zahl, Suche und Ansicht-
   Umschalter, dann das KARUSSELL (Antons Wahl 27.09.: wischen, die Mitte
   im Fokus, die Nachbarn verschwimmen — components/dream-carousel.tsx)
   oder die Liste, darunter die Nebenräume als zwei halbe Kacheln je Zeile (Besetzung,
   Atlas ab dem 2. Traum, Menagerie mit Wesen), darunter der Kalender. */
export default function JournalScreen() {
  const router = useRouter();
  const { data, bridge, send } = useJournal();
  const J = data?.journal;
  const L = J?.labels ?? {};
  const [query, setQuery] = useState("");
  /* Die Suche ist eine Lupe oben neben dem Ansicht-Knopf (Antons Befund
     10.10.: die Leiste war „out of place"); das Feld erscheint erst beim
     Antippen und bleibt, solange etwas drinsteht. */
  const [searching, setSearching] = useState(false);
  const showSearch = searching || query.length > 0;
  const toggleSearch = () => { Haptics.selectionAsync(); if (showSearch) { setQuery(""); setSearching(false); } else setSearching(true); };
  const headerTop = useTabTop();
  const deck = (J?.view ?? "deck") !== "list";
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data?.items ?? [];
    return q ? all.filter((e) => (e.text + " " + e.title).toLowerCase().includes(q)) : all;
  }, [data, query]);
  const open = (id: string) => router.push({ pathname: "/journal/[id]", params: { id } });
  // Die Nebenräume sind nativ (atlas/cast/menagerie); der Web-Rückfall bleibt für den Rest.
  const room = (view: string) => {
    Haptics.selectionAsync();
    if (view === "atlas") router.push("/journal/atlas");
    else if (view === "cast") router.push("/journal/cast");
    else if (view === "menagerie") router.push("/journal/menagerie");
    else router.push({ pathname: "/journal/web", params: { view } });
  };
  const count = items.length === 1 ? L.count1 : String(L.countN ?? "{n}").replace("{n}", String(items.length));

  return (
    <>
      {/* Derselbe Nachthimmel wie Start, Traum und Profil (Antons Befund 04.10.). */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} pointerEvents="none"><NightSky /></View>
      {/* eigener Kopf statt der großen iOS-Überschrift (Antons Befund 05.10.): die
          Überschrift und die Suche scrollen mit weg, der Ansicht-Knopf bleibt oben */}
      <Stack.Screen options={{ headerShown: false, title: L.title ?? "Journal" }} />
      <ScrollView style={{ flex: 1, backgroundColor: "transparent" }} contentInsetAdjustmentBehavior="never" keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, { paddingTop: headerTop }]} scrollIndicatorInsets={{ top: headerTop }}>
        <TabTitle title={L.title ?? "Journal"} room={104} />
        {showSearch ? (
          <Glass style={styles.search}>
            <SymbolView name="magnifyingglass" size={15} tintColor={colors.faint} />
            <TextInput value={query} onChangeText={setQuery} placeholder={L.search ?? "Search"} placeholderTextColor={colors.faint} autoFocus
              onBlur={() => { if (!query) setSearching(false); }}
              style={styles.searchInput} returnKeyType="search" clearButtonMode="while-editing" autoCorrect={false} />
          </Glass>
        ) : null}
        {J ? <Text style={styles.sub}>{count}</Text> : null}
        {items.length === 0 ? (
          <Text style={styles.empty}>{query ? L.emptySearch : L.empty}</Text>
        ) : deck ? (
          <DreamCarousel items={items} untitled={L.untitled} locale={data?.language === "de" ? "de-DE" : "en-GB"} onOpen={open} />
        ) : (
          <View style={styles.list}>{items.map((e) => <DreamRow key={e.id} item={e} months={L.months} onPress={open} rendering={L.rendering} untitled={L.untitled} />)}</View>
        )}

        {/* Der Mond über den Nebenräumen: erst der Traum, dann der Himmel. */}
        {J?.moon ? <MoonStrip M={J.moon} /> : null}

        {J ? (
          <View style={styles.shortcuts}>
            <Room title={L.library} text={J.castCount === 1 ? L.libraryCount1 : String(L.libraryCountN ?? "").replace("{n}", String(J.castCount))} onPress={() => room("cast")} />
            {J.realDreams >= 2 ? <Room title={L.atlas} text={L.atlasShort} onPress={() => room("atlas")} /> : null}
            {J.realDreams === 1 ? <Room title={L.atlas} text={L.atlasSoon} disabled /> : null}
            {J.creatures > 0 ? <Room title={L.menagerie} text={J.creatures === 1 ? L.menagerieCount1 : String(L.menagerieCountN ?? "").replace("{n}", String(J.creatures))} onPress={() => room("menagerie")} /> : null}
          </View>
        ) : null}

        {J && (data?.items.length ?? 0) > 0 ? <DreamCalendar items={data!.items} blankKeys={J.blankKeys} sleep={J.sleep} sleepLevels={J.sleepLevels} labels={L} onOpen={open} /> : null}
      </ScrollView>
      <TabBar>
        <Pressable onPress={toggleSearch} hitSlop={6} accessibilityRole="button" accessibilityLabel={L.search ?? "Search"}>
          <Glass style={styles.viewBtn} interactive><SymbolView name={showSearch ? "xmark" : "magnifyingglass"} size={16} tintColor={colors.text} /></Glass>
        </Pressable>
        <Pressable onPress={() => { Haptics.selectionAsync(); send({ type: "journalView", value: deck ? "list" : "deck" }); }} hitSlop={6} accessibilityRole="button">
          <Glass style={styles.viewBtn} interactive><SymbolView name={deck ? "list.bullet" : "rectangle.stack"} size={17} tintColor={colors.text} /></Glass>
        </Pressable>
      </TabBar>
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

function Room({ title, text, onPress, disabled }: { title: string; text: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.room, disabled && { opacity: 0.55 }]} onPress={onPress} disabled={disabled}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.roomTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.roomText} numberOfLines={1}>{text}</Text>
      </View>
      {!disabled ? <SymbolView name="chevron.right" size={13} tintColor={colors.faint} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: TAB_INSET },
  sub: { color: colors.faint, fontSize: 13, marginLeft: 2, marginBottom: 4 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, height: 40, paddingHorizontal: 12, borderRadius: 12, marginBottom: 6 },
  searchInput: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 0 },
  viewBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  empty: { color: colors.muted, textAlign: "center", marginVertical: 40, fontSize: 15 },
  list: { marginTop: 4 },
  shortcuts: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  room: { flexGrow: 1, flexBasis: "45%", flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radius.card, backgroundColor: colors.panelSolid, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  roomTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  roomText: { color: colors.muted, fontSize: 12 },
  bridge: { height: 0, overflow: "hidden" },
});
