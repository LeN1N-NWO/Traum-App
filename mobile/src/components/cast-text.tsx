import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { GlassButton, PrimaryButton } from "@/components/glass";
import { colors, fonts } from "@/theme";

/* Die Besetzung IM Text (Hannis Idee vom 07.08.2026, nativ am 13.09.2026
 * auf Antons Wunsch: „nach der LLM die Namen und Orte bereits im Text
 * markieren lassen, sodass man draufklicken kann oder selber hinzufügen,
 * falls etwas nicht ausgewählt wurde").
 *
 * Der Traumtext steht, wie er ist. Was die Analyse erkannt hat, leuchtet in
 * der Farbe seiner Gattung — Menschen blau, Orte warm, Dinge cyan. Ein Tipp
 * auf ein Markiertes öffnet „Wer ist das?" mit der Bibliothek; ein Tipp auf
 * irgendein anderes Wort öffnet „Zur Besetzung hinzufügen", vorbelegt mit
 * dem Wort. Entscheidungen reisen wie bisher als assignmentOverrides, neue
 * Einträge landen in der Analyse (people/places/objects) — dieselben Felder,
 * aus denen der Auftrag die Besetzung baut. */
export type CastKind = "person" | "pet" | "place" | "object";
export type Entity = { name: string; kind: CastKind; avatarId: string | null };
export type LibItem = { id: string; tag: string; img: string | null; category: string };
export type Choice = { free: boolean; avatar: LibItem | null };
type Labels = Record<string, any>;

const KIND_COLOR: Record<CastKind, string> = { person: colors.accentSoft, pet: colors.accentSoft, place: colors.warm, object: colors.cyan };
const KIND_BG: Record<CastKind, string> = { person: "rgba(140,192,255,0.20)", pet: "rgba(140,192,255,0.20)", place: "rgba(242,167,101,0.20)", object: "rgba(79,214,230,0.18)" };
const KIND_ICON: Record<CastKind, SFSymbol> = { person: "person.fill", pet: "pawprint.fill", place: "house.fill", object: "cube.fill" };
const SELF = new Set(["ich", "i", "me", "mich", "mir"]);
const WORD = /[A-Za-z0-9À-ÖØ-öø-ÿĀ-ſß]+/g;

type Seg = { text: string; word: boolean; entity: Entity | null };

/** Zerlegt den Text in Wörter und Zwischenräume und ordnet Wortfolgen den
 *  Einträgen zu. Mehrwortnamen („fremde Frau") gewinnen vor Einzelwörtern;
 *  eine gebeugte Form trifft, wenn sie mit dem Namen beginnt („Arztes" →
 *  „Arzt"). Das Ich leuchtet nur beim ersten Mal — sonst stünde jede
 *  zweite Zeile in Blau. */
export function segmentText(text: string, entities: Entity[]): Seg[] {
  const raw: { text: string; word: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(WORD)) {
    if (m.index! > last) raw.push({ text: text.slice(last, m.index), word: false });
    raw.push({ text: m[0], word: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) raw.push({ text: text.slice(last), word: false });

  const names = entities
    .map((e) => ({ e, parts: (e.name.match(WORD) || []).map((p) => p.toLowerCase()) }))
    .filter((x) => x.parts.length > 0)
    .sort((a, b) => b.parts.length - a.parts.length);
  const selfSeen = new Set<string>();
  const out: Seg[] = [];
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    if (!r.word) { out.push({ ...r, entity: null }); continue; }
    let hit: { e: Entity; span: number } | null = null;
    for (const { e, parts } of names) {
      // Die Wörter des Namens, getrennt nur durch Zwischenräume
      let j = i, k = 0, ok = true;
      while (k < parts.length) {
        const tok = raw[j];
        if (!tok || !tok.word) { ok = false; break; }
        const t = tok.text.toLowerCase();
        const p = parts[k];
        const same = t === p || (k === parts.length - 1 && p.length >= 4 && t.startsWith(p) && t.length <= p.length + 3);
        if (!same) { ok = false; break; }
        k++;
        if (k < parts.length) { j++; if (raw[j] && !raw[j].word && /^\s+$/.test(raw[j].text)) j++; else { ok = false; break; } }
      }
      if (!ok) continue;
      if (parts.length === 1 && SELF.has(parts[0])) {
        if (selfSeen.has(e.name)) continue;
        selfSeen.add(e.name);
      }
      hit = { e, span: j - i + 1 };
      break;
    }
    if (hit) {
      out.push({ text: raw.slice(i, i + hit.span).map((x) => x.text).join(""), word: true, entity: hit.e });
      i += hit.span - 1;
    } else {
      out.push({ ...r, entity: null });
    }
  }
  return out;
}

export function MarkedText({ text, entities, choiceOf, onEntity, onWord, L }: {
  text: string; entities: Entity[]; choiceOf: (e: Entity) => Choice; onEntity: (e: Entity) => void; onWord: (w: string) => void; L: Labels;
}) {
  const segs = useMemo(() => segmentText(text, entities), [text, entities]);
  return (
    <View style={styles.textCard}>
      <Text style={styles.textLabel}>{L.textTitle}</Text>
      <Text style={styles.body} selectable={false}>
        {segs.map((s, i) => {
          if (s.entity) {
            const c = choiceOf(s.entity);
            const decided = c.free || !!c.avatar;
            return (
              <Text key={i} onPress={() => { Haptics.selectionAsync(); onEntity(s.entity!); }} suppressHighlighting={false}
                style={[styles.mark, { backgroundColor: KIND_BG[s.entity.kind], color: KIND_COLOR[s.entity.kind] }, !decided && styles.markOpen]}>
                {s.text}{c.avatar ? <Text style={styles.markTag}>{` @${c.avatar.tag}`}</Text> : null}
              </Text>
            );
          }
          if (s.word) return <Text key={i} onPress={() => onWord(s.text)}>{s.text}</Text>;
          return s.text;
        })}
      </Text>
      <Text style={styles.hint}>{L.markHint}</Text>
    </View>
  );
}

/** „Wer ist das?" — KI erfindet, ein Eintrag der Bibliothek, neu mit Foto,
 *  oder: gehört nicht dazu. */
export function AssignSheet({ entity, choice, library, L, onPick, onNew, onRemove, onClose }: {
  entity: Entity | null; choice: Choice | null; library: LibItem[]; L: Labels;
  onPick: (v: { avatarId?: string; free?: boolean }) => void; onNew: () => void; onRemove: () => void; onClose: () => void;
}) {
  const kind = entity?.kind ?? "person";
  const options = library.filter((l) => (kind === "place" ? l.category === "place" : kind === "object" ? l.category === "object" : l.category === "person" || l.category === "pet"));
  return (
    <Modal visible={!!entity} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.sheetTop}>
          <View style={[styles.kindDot, { backgroundColor: KIND_BG[kind] }]}><SymbolView name={KIND_ICON[kind]} size={16} tintColor={KIND_COLOR[kind]} /></View>
          <Text style={styles.sheetTitle} numberOfLines={2}>{String(L.whoIs ?? "{name}").replace("{name}", entity?.name ?? "")}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.grid}>
          <Pick label={L.freeShort ?? "AI"} sub={L.free} on={!!choice?.free} onPress={() => onPick(choice?.free ? {} : { free: true })}>
            <SymbolView name="sparkles" size={24} tintColor={choice?.free ? colors.bg : colors.accentSoft} />
          </Pick>
          {options.map((l) => (
            <Pick key={l.id} label={`@${l.tag}`} on={choice?.avatar?.id === l.id} onPress={() => onPick(choice?.avatar?.id === l.id ? {} : { avatarId: l.id, free: false })}>
              {l.img ? <Image source={{ uri: l.img }} style={styles.pickImg} contentFit="cover" /> : <Text style={styles.pickInitial}>{l.tag.slice(0, 1).toUpperCase()}</Text>}
            </Pick>
          ))}
          <Pick label={L.newShort ?? "Photo"} sub={L.createNew} dashed onPress={onNew}>
            <SymbolView name="camera.fill" size={22} tintColor={colors.accentSoft} />
          </Pick>
        </ScrollView>
        <View style={styles.sheetActions}>
          <Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); onRemove(); }} hitSlop={8} style={{ paddingVertical: 12 }}>
            <Text style={styles.remove}>{L.removeFromCast}</Text>
          </Pressable>
          <PrimaryButton label={L.close ?? "Done"} onPress={onClose} style={{ flex: 0, alignSelf: "stretch" }} />
        </View>
      </View>
    </Modal>
  );
}

function Pick({ label, sub, on, dashed, onPress, children }: { label: string; sub?: string; on?: boolean; dashed?: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }} style={styles.pick} accessibilityLabel={sub ?? label} accessibilityState={{ selected: !!on }}>
      <View style={[styles.pickDot, on && styles.pickDotOn, dashed && styles.pickDotNew]}>{children}</View>
      <Text style={[styles.pickLabel, on && styles.pickLabelOn]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

/** „Zur Besetzung hinzufügen" — Name (vorbelegt mit dem getippten Wort)
 *  und Gattung. */
export function AddSheet({ word, L, onAdd, onClose }: { word: string | null; L: Labels; onAdd: (name: string, kind: CastKind) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CastKind>("person");
  const [seen, setSeen] = useState<string | null>(null);
  if (word !== seen) { setSeen(word); setName(word ?? ""); setKind("person"); }
  const kinds: CastKind[] = ["person", "pet", "place", "object"];
  return (
    <Modal visible={word !== null} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Text style={styles.sheetTitle}>{L.addTitle}</Text>
        <Text style={styles.fieldLabel}>{L.addName}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} autoFocus keyboardAppearance="dark" maxLength={40} placeholderTextColor={colors.faint} />
        <Text style={styles.fieldLabel}>{L.addAs}</Text>
        <View style={styles.kinds}>
          {kinds.map((k) => {
            const on = kind === k;
            return (
              <Pressable key={k} style={[styles.kind, on && { borderColor: KIND_COLOR[k], backgroundColor: KIND_BG[k] }]} onPress={() => { Haptics.selectionAsync(); setKind(k); }}>
                <SymbolView name={KIND_ICON[k]} size={18} tintColor={on ? KIND_COLOR[k] : colors.faint} />
                <Text style={[styles.kindText, on && { color: KIND_COLOR[k] }]}>{L.kindFor?.[k] ?? k}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.row}>
          <GlassButton label={L.cancel ?? "Cancel"} onPress={onClose} />
          <PrimaryButton label={L.add ?? "Add"} heavy disabled={name.trim().length < 2} onPress={() => onAdd(name.trim(), kind)} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  textCard: { padding: 16, borderRadius: 20, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 10 },
  textLabel: { color: colors.faint, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", textTransform: "uppercase" },
  body: { color: colors.text, fontSize: 17, lineHeight: 28 },
  mark: { fontWeight: "600" },
  markOpen: { textDecorationLine: "underline", textDecorationStyle: "dotted" },
  markTag: { fontSize: 12, fontWeight: "500", color: colors.muted },
  hint: { color: colors.faint, fontSize: 12.5, lineHeight: 18 },
  sheet: { flex: 1, backgroundColor: colors.bg2, padding: 20, gap: 12 },
  sheetTop: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  kindDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  sheetTitle: { flex: 1, fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14, paddingVertical: 12 },
  pick: { width: 74, alignItems: "center", gap: 6 },
  pickDot: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(140,192,255,0.10)", borderWidth: 2, borderColor: "transparent", overflow: "hidden" },
  pickDotOn: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  pickDotNew: { borderColor: colors.panelLine, borderStyle: "dashed", backgroundColor: "transparent" },
  pickImg: { width: 64, height: 64 },
  pickInitial: { color: colors.accentSoft, fontFamily: fonts.serif, fontSize: 24 },
  pickLabel: { color: colors.muted, fontSize: 12, textAlign: "center" },
  pickLabelOn: { color: colors.accentSoft, fontWeight: "600" },
  sheetActions: { gap: 4, paddingBottom: 20 },
  remove: { color: colors.bad, fontSize: 15, textAlign: "center" },
  fieldLabel: { color: colors.muted, fontSize: 13, marginLeft: 4, marginTop: 4 },
  input: { minHeight: 52, color: colors.text, fontSize: 17, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  kinds: { flexDirection: "row", gap: 8 },
  kind: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.panelLine },
  kindText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", gap: 10, marginTop: 10 },
});
