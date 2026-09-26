import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo, useRef, useState } from "react";
import Animated, { interpolate, type SharedValue, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddSheet, AssignSheet, type CastKind, type Choice, type Entity, type LibItem } from "@/components/cast-text";
import { PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { WizardHeader } from "@/components/wizard-header";
import { patchWizard, useWizardStore } from "@/store/wizard-store";
import { colors, fonts, radius, TAB_INSET } from "@/theme";

type CastData = { people: Entity[]; places: Entity[]; objects: Entity[]; library: LibItem[]; labels: Record<string, any> };

/* Schritt 3, nativ: wer ist drin, wo spielt es, welche Dinge zählen.
 *
 * Seit 13.09.2026 steht OBEN der Traumtext mit den Markierungen (Hannis
 * Idee, Antons Wunsch: „Diese Besetzung muss viel durchdachter sein und
 * einfacher gehen"). Darunter dieselben Zeilen wie bisher — die Wahl direkt
 * in der Zeile: KI erfindet, die Gesichter der Bibliothek, Foto neu. Beides
 * schreibt in dieselben assignmentOverrides; neu Hinzugefügtes landet in der
 * Analyse, aus der der Auftrag die Besetzung baut. */
export default function DreamCastScreen() {
  const router = useRouter();
  const { data, bridge, ask } = useJournal();
  const W = data?.wizard;
  const w = useWizardStore();
  const [cast, setCast] = useState<CastData | null>(null);
  const [open, setOpen] = useState<Entity | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  /* Bei jedem Fokus (und nach jeder Änderung der Analyse) neu fragen — nach
     „Neu anlegen" steht das Foto in der Bibliothek; passt sein @tag zum
     Namen, ist es die Wahl (wie CastStep.onCreated im Web). */
  useFocusEffect(useCallback(() => {
    ask({ type: "cast", analysis: w.analysis }).then((r) => {
      if (!r.result) return;
      setCast(r.result);
      const lib: LibItem[] = r.result.library;
      const over = { ...w.assignmentOverrides };
      let changed = false;
      for (const row of [...r.result.people, ...r.result.places, ...(r.result.objects ?? [])] as Entity[]) {
        if (over[row.name]) continue;
        const hit = lib.find((l) => l.tag.toLowerCase() === row.name.toLowerCase().replace(/[^a-z0-9äöüß]/gi, ""));
        if (hit) { over[row.name] = { avatarId: hit.id, free: false }; changed = true; }
      }
      if (changed) patchWizard({ assignmentOverrides: over });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.analysis]));

  const choice = (row: Entity): Choice => {
    const o = w.assignmentOverrides[row.name];
    if (o?.free) return { free: true, avatar: null };
    const id = o?.avatarId ?? row.avatarId;
    // Orte und Dinge ohne Treffer starten auf „KI erfindet" (startsFree im Web).
    if (!id && !o && (row.kind === "place" || row.kind === "object")) return { free: true, avatar: null };
    return { free: false, avatar: cast?.library.find((l) => l.id === id) ?? null };
  };
  function set(name: string, value: { avatarId?: string; free?: boolean }) {
    Haptics.selectionAsync();
    patchWizard({ assignmentOverrides: { ...w.assignmentOverrides, [name]: value } });
  }

  const entities = useMemo(() => (cast ? [...cast.people, ...cast.places, ...(cast.objects ?? [])] : []), [cast]);

  /* Neu hinzufügen / entfernen: die Analyse selbst ändern — Menschen und
     Tiere unter people (mit kind), Orte unter places, Dinge unter objects. */
  function addEntity(name: string, kind: CastKind) {
    const a = w.analysis ?? {};
    const exists = entities.some((e) => e.name.toLowerCase() === name.toLowerCase());
    setAdding(null);
    if (exists) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (kind === "person" || kind === "pet") patchWizard({ analysis: { ...a, people: [...(a.people ?? []), { name, kind, desc: "", wearing: "" }] } });
    else if (kind === "place") patchWizard({ analysis: { ...a, places: [...(a.places ?? []), name] } });
    else patchWizard({ analysis: { ...a, objects: [...(a.objects ?? []), name] } });
  }
  function removeEntity(e: Entity) {
    const a = w.analysis ?? {};
    const nameOf = (x: any) => (typeof x === "string" ? x : x?.name);
    const keep = (list: any[] | undefined) => (list ?? []).filter((x) => nameOf(x) !== e.name);
    const rest = { ...w.assignmentOverrides };
    delete rest[e.name];
    setOpen(null);
    patchWizard({ analysis: { ...a, people: keep(a.people), places: keep(a.places), objects: keep(a.objects) }, assignmentOverrides: rest });
  }

  const L = cast?.labels ?? {};
  const fill = (tpl: string | undefined, v: Record<string, string | number>) =>
    Object.entries(v).reduce((acc, [k, x]) => acc.replace(`{${k}}`, String(x)), tpl || "");

  function newWithPhoto(row: Entity) {
    Haptics.selectionAsync();
    setOpen(null);
    const category = row.kind === "pet" ? "pet" : row.kind;
    router.push({ pathname: "/dream/avatar", params: { category, tag: row.name } });
  }

  /* Karte für Karte (Antons Wahl 26.09., Entwurf „C"): eine Figur je
     Bildschirm — zwei Kacheln und die Gesichter der Bibliothek —, wischen
     oder „Weiter · Name" zur nächsten. Orte und Dinge kommen gesammelt auf die letzte Karte — die
     KI erfindet sie, ein Tipp gibt ihnen ein Foto. „Weiter" steht immer
     unten, nie mehr am Ende einer langen Liste. */
  const people = cast?.people ?? [];
  const others = [...(cast?.places ?? []), ...(cast?.objects ?? [])];
  const pages = Math.max(1, people.length + (others.length ? 1 : 0));
  const [rawPage, setPage] = useState(0);
  const page = Math.min(rawPage, pages - 1);   // nach dem Entfernen einer Figur nicht ins Leere zeigen
  const pager = useRef<ScrollView>(null);
  const last = page >= pages - 1;
  const nextLabel = last ? (W?.next ?? "Continue")
    : fill(L.nextName ?? "Next · {name}", { name: page + 1 < people.length ? people[page + 1].name : (L.placesTitle ?? "…") });
  function next() {
    if (last) { router.push("/dream/style"); return; }
    Haptics.selectionAsync();
    pager.current?.scrollTo({ x: (page + 1) * width, animated: true });
    setPage(page + 1);
  }
  /* Der Satz aus dem Traum, in dem die Figur vorkommt — damit man weiß, wen man besetzt. */
  const lineOf = (name: string) => (w.text.split(/(?<=[.!?])\s+/).find((x) => x.toLowerCase().includes(name.toLowerCase())) ?? "").trim();

  /* Seit 26.09. (Antons Ansage) keine Kachel „Bibliothek“ mehr: Die
     Gesichter der Bibliothek liegen direkt auf der Karte, zum Durchblättern
     wie die Träume im Deck — antippen, und das Gesicht spielt diese Figur.
     Oben bleiben die zwei Wege, die keine Bibliothek brauchen. Entfernen
     und die volle Auswahl liegen hinter dem „…“ neben der Schrittzahl. */
  const personCard = (row: Entity, i: number) => {
    const c = choice(row);
    const line = lineOf(row.name);
    const faces = (cast?.library ?? []).filter((l) => (row.kind === "pet" ? l.category === "pet" : l.category !== "pet" && l.category !== "place" && l.category !== "object"));
    return (
      <View key={row.name} style={[styles.page, { width }]}>
        <View style={styles.stepRow}>
          <Text style={styles.step}>{fill(L.stepOf ?? "{i} / {n}", { i: i + 1, n: pages })}</Text>
          <Pressable onPress={() => { Haptics.selectionAsync(); setOpen(row); }} hitSlop={12} accessibilityRole="button" accessibilityLabel={L.change ?? "More"}>
            <SymbolView name="ellipsis.circle" size={22} tintColor={colors.faint} />
          </Pressable>
        </View>
        <Text style={styles.who} numberOfLines={2}>{/^(ich|i|me|mich|mir)$/i.test(row.name.trim()) ? (L.whoYou ?? "How do you appear?") : String(L.whoIs ?? "{name}").replace("{name}", row.name)}</Text>
        {line ? <Text style={styles.quote} numberOfLines={2}>{`„${line}“`}</Text> : null}
        <View style={styles.tileRow}>
          <Tile on={c.free} label={L.tileAi ?? "AI invents"} onPress={() => set(row.name, { free: true })}>
            <SymbolView name="sparkles" size={30} tintColor={c.free ? colors.accentSoft : colors.muted} />
          </Tile>
          <Tile label={L.tileNew ?? "New photo"} dashed onPress={() => newWithPhoto(row)}>
            <SymbolView name="camera.fill" size={28} tintColor={colors.muted} />
          </Tile>
        </View>
        <Text style={styles.libLabel}>{L.fromLibrary ?? "From your library"}</Text>
        <FacePicker items={faces} selected={c.free ? null : c.avatar?.id ?? null} name={row.name} empty={L.libraryEmpty}
          onPick={(id) => set(row.name, { avatarId: id, free: false })} />
      </View>
    );
  };

  const placesCard = (
    <View key="__places" style={[styles.page, { width }]}>
      <Text style={styles.step}>{fill(L.stepOf ?? "{i} / {n}", { i: pages, n: pages })}</Text>
      <Text style={styles.who}>{L.placesTitle ?? "And the places?"}</Text>
      <Text style={styles.quote}>{L.placesHint}</Text>
      <View style={styles.chips}>
        {others.map((row) => {
          const c = choice(row);
          return (
            <Pressable key={row.name} onPress={() => { Haptics.selectionAsync(); setOpen(row); }} style={[styles.chip, !!c.avatar && styles.chipOn]}>
              {c.avatar?.img ? <Image source={{ uri: c.avatar.img }} style={styles.chipImg} contentFit="cover" /> : <SymbolView name={c.free ? "sparkles" : "questionmark"} size={13} tintColor={c.avatar ? colors.accentSoft : colors.muted} />}
              <Text style={styles.chipText} numberOfLines={1}>{row.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <>
      <WizardHeader step={3} cancel={W?.cancel} />
      <View style={[styles.screen, { paddingTop: insets.top + 52 }]}>
        {cast ? (
          <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ flex: 1 }}
            onMomentumScrollEnd={(e) => { const i = Math.round(e.nativeEvent.contentOffset.x / width); if (i !== page) { Haptics.selectionAsync(); setPage(i); } }}>
            {people.map(personCard)}
            {others.length ? placesCard : null}
            {!people.length && !others.length ? (
              <View style={[styles.page, { width, justifyContent: "center" }]}><Text style={styles.quote}>{L.noPeople}</Text></View>
            ) : null}
          </ScrollView>
        ) : <View style={{ flex: 1 }} />}
        <View style={styles.footer}>
          {pages > 1 ? (
            <View style={styles.dots}>{Array.from({ length: pages }, (_, i) => <View key={i} style={[styles.dot, i === page && styles.dotOn]} />)}</View>
          ) : null}
          <PrimaryButton label={nextLabel} onPress={next} style={{ flex: 0 }} />
          <Pressable onPress={() => { Haptics.selectionAsync(); setAdding(""); }} hitSlop={10}>
            <Text style={styles.missing}>{L.missing ?? "Someone missing?"}</Text>
          </Pressable>
        </View>
      </View>
      <AssignSheet
        entity={open} choice={open ? choice(open) : null} library={cast?.library ?? []} L={{ ...L, cancel: W?.cancel }}
        onPick={(v) => open && set(open.name, v)} onNew={() => open && newWithPhoto(open)} onRemove={() => open && removeEntity(open)} onClose={() => setOpen(null)}
      />
      <AddSheet word={adding} L={{ ...L, cancel: W?.cancel }} onAdd={addEntity} onClose={() => setAdding(null)} />
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

/* Eine große Kachel: Bild oder Zeichen, Beschriftung unten, gewählt = Rand + Haken. */
function Tile({ on, dashed, label, onPress, children }: { on?: boolean; dashed?: boolean; label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, dashed && styles.tileDashed, on && styles.tileOn, pressed && { transform: [{ scale: 0.97 }] }]}
      accessibilityRole="button" accessibilityState={{ selected: !!on }} accessibilityLabel={label}>
      <View style={styles.tileArt}>{children}</View>
      <View style={styles.tileFoot}><Text style={[styles.tileLabel, on && { color: colors.accentSoft }]} numberOfLines={1}>{label}</Text></View>
      {on ? <View style={styles.check}><SymbolView name="checkmark" size={12} tintColor={colors.bg} weight="bold" /></View> : null}
    </Pressable>
  );
}

/* Die Gesichter zum Durchblättern — gefächert wie Karten in der Hand:
   die mittlere groß und gerade, die Nachbarn kleiner, leicht gedreht und
   abgesenkt. Rastet je Karte ein (wie das Deck), ein Tipp wählt. Die
   gewählte trägt Rand, Haken und den Namen der Figur. */
function FacePicker({ items, selected, name, empty, onPick }: { items: LibItem[]; selected: string | null; name: string; empty?: string; onPick: (id: string) => void }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const x = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { x.value = e.contentOffset.x; });
  const scroller = useRef<Animated.ScrollView>(null);
  const shown = useRef(0);
  const cardW = Math.round(Math.max(0, Math.min(box.w * 0.44, (box.h - 26) / 1.3, 200)));
  const step = cardW + 14;
  const start = Math.max(0, items.findIndex((l) => l.id === selected));

  if (!items.length) {
    return <View style={styles.libEmpty}><Text style={styles.libEmptyText}>{empty ?? ""}</Text></View>;
  }
  return (
    <View style={{ flex: 1, marginHorizontal: -20 }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {cardW > 40 ? (
        <Animated.ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}
          snapToInterval={step} decelerationRate="fast" disableIntervalMomentum contentOffset={{ x: start * step, y: 0 }}
          contentContainerStyle={{ paddingHorizontal: (box.w - cardW) / 2, gap: 14, alignItems: "center" }}
          onMomentumScrollEnd={(e) => { const i = Math.round(e.nativeEvent.contentOffset.x / step); if (i !== shown.current) { shown.current = i; Haptics.selectionAsync(); } }}>
          {items.map((it, i) => (
            <FaceCard key={it.id} item={it} i={i} x={x} step={step} w={cardW} on={it.id === selected} name={name}
              onPress={() => { onPick(it.id); scroller.current?.scrollTo({ x: i * step, animated: true }); }} />
          ))}
        </Animated.ScrollView>
      ) : null}
    </View>
  );
}

function FaceCard({ item, i, x, step, w, on, name, onPress }: { item: LibItem; i: number; x: SharedValue<number>; step: number; w: number; on: boolean; name: string; onPress: () => void }) {
  const style = useAnimatedStyle(() => {
    const d = (x.value - i * step) / step;          // 0 = Mitte, ±1 = Nachbar
    const a = Math.min(1, Math.abs(d));
    return {
      opacity: interpolate(a, [0, 1], [1, 0.62]),
      transform: [{ translateY: a * 16 }, { rotate: `${-d * 5}deg` }, { scale: interpolate(a, [0, 1], [1, 0.86]) }],
    };
  });
  return (
    <Animated.View style={style}>
      <Pressable onPress={onPress} style={[styles.face, { width: w, height: Math.round(w * 1.3) }, on && styles.faceOn]}
        accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`@${item.tag}`}>
        {item.img ? <Image source={{ uri: item.img }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={styles.initial}>{item.tag.slice(0, 1).toUpperCase()}</Text>}
        <View style={styles.faceFoot}><Text style={[styles.faceTag, on && { color: colors.accentSoft }]} numberOfLines={1}>{on ? `✓ ${name}` : `@${item.tag}`}</Text></View>
        {on ? <View style={styles.check}><SymbolView name="checkmark" size={12} tintColor={colors.bg} weight="bold" /></View> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: TAB_INSET },
  page: { paddingHorizontal: 20, gap: 8, flex: 1 },
  step: { color: colors.faint, fontSize: 12, letterSpacing: 1.4, fontWeight: "600", textTransform: "uppercase" },
  who: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 36, color: colors.text },
  quote: { color: colors.muted, fontSize: 15, lineHeight: 21, fontStyle: "italic" },
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tileRow: { height: 112, flexDirection: "row", gap: 12, marginTop: 8 },
  libLabel: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase", marginTop: 10 },
  libEmpty: { flex: 1, maxHeight: 160, borderRadius: radius.card, borderWidth: 1, borderStyle: "dashed", borderColor: colors.panelLine, alignItems: "center", justifyContent: "center", padding: 20, marginBottom: 8 },
  libEmptyText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  face: { borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelLine, alignItems: "center", justifyContent: "center" },
  faceOn: { borderColor: colors.accentSoft, borderWidth: 2.5 },
  faceFoot: { position: "absolute", left: 0, right: 0, bottom: 0, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: "rgba(5,10,20,0.6)" },
  faceTag: { color: colors.text, fontSize: 14, fontWeight: "600", textAlign: "center" },
  tile: { flex: 1, borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelLine },
  tileDashed: { borderStyle: "dashed", backgroundColor: "transparent" },
  tileOn: { borderColor: colors.accentSoft, borderWidth: 2.5, backgroundColor: "rgba(79,156,249,0.12)" },
  tileArt: { flex: 1, alignItems: "center", justifyContent: "center" },
  tileFoot: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "rgba(5,10,20,0.55)" },
  tileLabel: { color: colors.text, fontSize: 15, fontWeight: "600", textAlign: "center" },
  initial: { color: colors.accentSoft, fontFamily: fonts.serif, fontSize: 44 },
  check: { position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelLine, maxWidth: "100%" },
  chipOn: { borderColor: colors.accentSoft },
  chipImg: { width: 22, height: 22, borderRadius: 11 },
  chipText: { color: colors.text, fontSize: 14, flexShrink: 1 },
  footer: { paddingHorizontal: 20, gap: 10, paddingTop: 4, alignItems: "stretch" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.panelLine },
  dotOn: { width: 18, backgroundColor: colors.accentSoft },
  missing: { color: colors.accentSoft, fontSize: 14, textAlign: "center" },
  bridge: { height: 0, overflow: "hidden" },
});
