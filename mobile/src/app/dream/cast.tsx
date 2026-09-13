import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AddSheet, AssignSheet, MarkedText, type CastKind, type Choice, type Entity, type LibItem } from "@/components/cast-text";
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
  const section = (title: string, lede: string, empty: string, rows: Entity[]) => (
    <View style={styles.section}>
      <Text style={styles.h}>{title}</Text>
      <Text style={styles.lede}>{lede}</Text>
      {rows.length === 0 ? <Text style={styles.empty}>{empty}</Text> : rows.map((row) => {
        const c = choice(row);
        const options = (cast?.library ?? []).filter((l) => row.kind === "place" ? l.category === "place" : row.kind === "object" ? l.category === "object" : l.category === "person" || l.category === "pet");
        return (
          <View key={row.name} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={1}>{row.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>{c.avatar ? `@${c.avatar.tag}` : c.free ? L.free : L.undecided}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip} style={{ flexShrink: 1 }}>
                <Pressable onPress={() => set(row.name, c.free ? {} : { free: true })} accessibilityLabel={L.free} style={styles.pick}>
                  <View style={[styles.dot, c.free && styles.dotOn]}>
                    <SymbolView name="sparkles" size={18} tintColor={c.free ? colors.bg : colors.accentSoft} />
                  </View>
                  <Text style={[styles.pickLabel, c.free && styles.pickLabelOn]} numberOfLines={1}>{L.freeShort ?? "KI"}</Text>
                </Pressable>
                {options.map((l) => (
                  <Pressable key={l.id} onPress={() => set(row.name, c.avatar?.id === l.id ? {} : { avatarId: l.id, free: false })} accessibilityLabel={`@${l.tag}`} style={styles.pick}>
                    <View style={[styles.dot, c.avatar?.id === l.id && styles.dotOn]}>
                      {l.img ? <Image source={{ uri: l.img }} style={styles.dotImg} contentFit="cover" /> : <Text style={styles.dotInitial}>{l.tag.slice(0, 1).toUpperCase()}</Text>}
                    </View>
                    <Text style={[styles.pickLabel, c.avatar?.id === l.id && styles.pickLabelOn]} numberOfLines={1}>{l.tag}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => newWithPhoto(row)} accessibilityLabel={L.createNew} style={styles.pick}>
                  <View style={[styles.dot, styles.dotNew]}><SymbolView name="camera.fill" size={17} tintColor={colors.accentSoft} /></View>
                  <Text style={styles.pickLabel} numberOfLines={1}>{L.newShort ?? "Foto"}</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        );
      })}
    </View>
  );

  function newWithPhoto(row: Entity) {
    Haptics.selectionAsync();
    setOpen(null);
    const category = row.kind === "pet" ? "pet" : row.kind;
    router.push({ pathname: "/dream/avatar", params: { category, tag: row.name } });
  }

  return (
    <>
      <WizardHeader step={3} cancel={W?.cancel} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {cast ? (
          <>
            {w.text ? <MarkedText text={w.text} entities={entities} choiceOf={choice} onEntity={setOpen} onWord={(word) => { Haptics.selectionAsync(); setAdding(word); }} L={L} /> : null}
            {section(L.people, L.peopleLede, L.peopleEmpty, cast.people)}
            {section(L.places, L.placesLede, L.placesEmpty, cast.places)}
            {section(L.objects, L.objectsLede, L.objectsEmpty, cast.objects ?? [])}
          </>
        ) : null}
        <PrimaryButton label={W?.next ?? "Continue"} onPress={() => router.push("/dream/style")} style={{ flex: 0, marginTop: 6 }} />
      </ScrollView>
      <AssignSheet
        entity={open} choice={open ? choice(open) : null} library={cast?.library ?? []} L={{ ...L, cancel: W?.cancel }}
        onPick={(v) => open && set(open.name, v)} onNew={() => open && newWithPhoto(open)} onRemove={() => open && removeEntity(open)} onClose={() => setOpen(null)}
      />
      <AddSheet word={adding} L={{ ...L, cancel: W?.cancel }} onAdd={addEntity} onClose={() => setAdding(null)} />
      <View style={styles.bridge}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: TAB_INSET, gap: 18 },
  section: { gap: 10 },
  h: { fontFamily: fonts.serif, fontSize: 28, color: colors.text, marginTop: 4 },
  lede: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  empty: { color: colors.faint, fontSize: 14, paddingVertical: 8 },
  card: { borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  name: { fontFamily: fonts.serif, fontSize: 18, color: colors.text },
  sub: { color: colors.muted, fontSize: 13 },
  strip: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingLeft: 10 },
  pick: { alignItems: "center", gap: 4, width: 52 },
  pickLabel: { color: colors.faint, fontSize: 10, textAlign: "center" },
  pickLabelOn: { color: colors.accentSoft, fontWeight: "600" },
  dot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(140,192,255,0.10)", borderWidth: 1.5, borderColor: "transparent", overflow: "hidden" },
  dotOn: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  dotNew: { borderColor: colors.panelLine, borderStyle: "dashed", backgroundColor: "transparent" },
  dotImg: { width: 40, height: 40 },
  dotInitial: { color: colors.accentSoft, fontFamily: fonts.serif, fontSize: 18 },
  bridge: { height: 0, overflow: "hidden" },
});
