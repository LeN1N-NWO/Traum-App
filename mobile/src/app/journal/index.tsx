import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DreamCalendar } from "@/components/dream-calendar";
import { DreamDeck } from "@/components/dream-deck";
import { DreamRow } from "@/components/dream-row";
import { useJournal } from "@/components/journal-data";
import { colors, fonts, radius } from "@/theme";

/* Das Journal, nativ — der Aufbau ist der des Web (JournalScreen.jsx),
   nur das Material ist neu: Kopf mit Titel und Zahl, Suche und Ansicht-
   Umschalter, dann das DECK (Karten seitlich wischen, Antons Wahl) oder die
   Liste, darunter die Nebenräume als zwei halbe Kacheln je Zeile (Besetzung,
   Atlas ab dem 2. Traum, Menagerie mit Wesen), darunter der Kalender. */
export default function JournalScreen() {
  const router = useRouter();
  const { data, bridge, send } = useJournal();
  const J = data?.journal;
  const L = J?.labels ?? {};
  const [query, setQuery] = useState("");
  const locale = data?.language === "de" ? "de-DE" : "en-GB";
  const deck = (J?.view ?? "deck") !== "list";
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data?.items ?? [];
    return q ? all.filter((e) => (e.text + " " + e.title).toLowerCase().includes(q)) : all;
  }, [data, query]);
  const open = (id: string) => router.push({ pathname: "/journal/[id]", params: { id } });
  const room = (view: string) => { Haptics.selectionAsync(); router.push({ pathname: "/journal/web", params: { view } }); };
  const count = items.length === 1 ? L.count1 : String(L.countN ?? "{n}").replace("{n}", String(items.length));

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {J ? <Text style={styles.sub}>{count}</Text> : null}
        {items.length === 0 ? (
          <Text style={styles.empty}>{query ? L.emptySearch : L.empty}</Text>
        ) : deck ? (
          <DreamDeck items={items} locale={locale} onOpen={open} />
        ) : (
          <View style={styles.list}>{items.map((e) => <DreamRow key={e.id} item={e} months={L.months} onPress={open} rendering={L.rendering} untitled={L.untitled} />)}</View>
        )}

        {J ? (
          <View style={styles.shortcuts}>
            <Room title={L.library} text={J.castCount === 1 ? L.libraryCount1 : String(L.libraryCountN ?? "").replace("{n}", String(J.castCount))} onPress={() => room("cast")} />
            {J.realDreams >= 2 ? <Room title={L.atlas} text={L.atlasShort} onPress={() => room("atlas")} /> : null}
            {J.realDreams === 1 ? <Room title={L.atlas} text={L.atlasSoon} disabled /> : null}
            {J.creatures > 0 ? <Room title={L.menagerie} text={J.creatures === 1 ? L.menagerieCount1 : String(L.menagerieCountN ?? "").replace("{n}", String(J.creatures))} onPress={() => room("menagerie")} /> : null}
          </View>
        ) : null}

        {J && (data?.items.length ?? 0) > 0 ? <DreamCalendar items={data!.items} blankKeys={J.blankKeys} labels={L} onOpen={open} /> : null}
      </ScrollView>
      <Stack.Screen.Title large style={{ color: colors.text, fontFamily: fonts.serif }} largeStyle={{ color: colors.text, fontFamily: fonts.serif, fontSize: 36 }}>{L.title ?? "Journal"}</Stack.Screen.Title>
      <Stack.SearchBar placeholder={L.search ?? "Search"} onChangeText={(e) => setQuery(e.nativeEvent.text)} hideWhenScrolling />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon={deck ? "list.bullet" : "rectangle.stack"} onPress={() => { Haptics.selectionAsync(); send({ type: "journalView", value: deck ? "list" : "deck" }); }} />
      </Stack.Toolbar>
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
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  sub: { color: colors.faint, fontSize: 13, marginLeft: 2, marginBottom: 4 },
  empty: { color: colors.muted, textAlign: "center", marginVertical: 40, fontSize: 15 },
  list: { marginTop: 4 },
  shortcuts: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  room: { flexGrow: 1, flexBasis: "45%", flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  roomTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  roomText: { color: colors.muted, fontSize: 12 },
  bridge: { height: 0, overflow: "hidden" },
});
