import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { ActionSheetIOS, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glass, GlassButton, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { useOfflineLabels } from "@/lib/offline-labels";
import { showToast } from "@/store/toast-store";
import { colors, fonts, TAB_INSET } from "@/theme";

/* Der Avatar-Dialog, nativ (13.09.2026) — AvatarDialog.jsx im Aufbau:
 * Gattung (nur beim Anlegen ohne Vorgabe), Name mit dem Tag, der daraus
 * wird, Gesichtsfoto (Mediathek oder Kamera), Ganzkörperfoto erst, wenn
 * das Gesicht steht, „Aus deiner Beschreibung zeichnen" erst, wenn es
 * etwas zu zeichnen gibt, Beschreibung, Hinweis zum Datenschutz, Speichern.
 * Löschen abgesetzt ganz unten — die einzige unumkehrbare Handlung, nie
 * neben Speichern unter dem Daumen, und nie für das eigene Porträt.
 *
 * Die Regeln (Tag, Pflicht Foto-oder-Beschreibung, Kollision, Umbenennen
 * zieht die Träume mit) liegen in der Brücke (`runAvatar`), nicht hier —
 * eine Wahrheit, dieselbe wie im Web.
 *
 * Fotos: nativ gewählt, auf 1600 px verkleinert (wie compactDataUrl im
 * Web, das ist auch, was die Bildmodelle bekommen) und als JPEG-Data-URL
 * gespeichert — fal lädt keine Pfade dieses Rechners. */
type Mode = "me" | "edit" | "new";
type Kind = "person" | "pet" | "place" | "object";
type Labels = Record<string, any>;

const KIND_ICON: Record<Kind, SFSymbol> = { person: "person.fill", pet: "pawprint.fill", place: "house.fill", object: "cube.fill" };
const cleanTag = (raw: string) => String(raw || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);

async function pickPhoto(camera: boolean, square: boolean): Promise<string | null> {
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: square, aspect: square ? [1, 1] : undefined, quality: 0.9 };
  const r = camera
    ? await ImagePicker.launchCameraAsync({ ...opts, cameraType: ImagePicker.CameraType.back }).catch(() => null)
    : await ImagePicker.launchImageLibraryAsync(opts).catch(() => null);
  const asset = r && !r.canceled ? r.assets[0] : null;
  if (!asset) return null;
  const actions = asset.width > 1600 ? [{ resize: { width: 1600 } }] : [];
  const small = await ImageManipulator.manipulateAsync(asset.uri, actions, { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true });
  return small.base64 ? `data:image/jpeg;base64,${small.base64}` : null;
}

export function AvatarEditor({ mode, id, category, tag: suggested, onDone }: { mode: Mode; id?: string; category?: string; tag?: string; onDone: (savedId?: string) => void }) {
  const insets = useSafeAreaInsets();
  const { bridge, ask } = useJournal();
  const [L, setL] = useState<Labels | null>(null);
  const [price, setPrice] = useState(2);
  const [kind, setKind] = useState<Kind>((["person", "pet", "place", "object"].includes(String(category)) ? category : "person") as Kind);
  const [tag, setTag] = useState(suggested ?? "");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [img2, setImg2] = useState("");
  const [busy, setBusy] = useState<"save" | "draw" | null>(null);
  /* Die Bestätigung je Foto (Antons Ansage 13.09.2026). Ein neues oder
     entferntes Foto setzt sie zurück; ein aus der Beschreibung GEZEICHNETES
     Bild zeigt niemanden Echtes und braucht sie nicht. */
  const [consent, setConsent] = useState(false);
  const [drawn, setDrawn] = useState(false);
  /* Die Foto-Prüfung (Antons Idee 13.09.2026): In dem Moment, in dem der Haken
     gesetzt wird, fragt die App im Hintergrund, ob der Filmdienst das Foto
     annimmt — damit „das Bild können wir nicht verwenden" JETZT kommt und
     nicht nach einem bezahlten Film. Ein neues Foto setzt sie zurück. */
  const [check, setCheck] = useState<{ status: "idle" | "checking" | "ok" | "blocked" | "unavailable"; message?: string | null }>({ status: "idle" });
  const checkRun = useRef(0);
  const choosing = mode === "new" && (!category || category === "any");

  /* Nie ewig laden (Antons Befund 13.09. abends): Antwortet die Brücke nicht
     binnen 10 s — im Entwicklungsbau meist, weil Metro oder der Server nicht
     läuft —, steht da, was los ist, mit „Noch mal versuchen". */
  const O = useOfflineLabels();
  const [attempt, setAttempt] = useState(0);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    let done = false;
    setStuck(false);
    const timer = setTimeout(() => { if (!done) setStuck(true); }, 10_000);
    ask({ type: "avatarLoad", mode, id, tag: suggested }).then((r) => {
      done = true; clearTimeout(timer); setStuck(false);
      if (r.error || !r.result) { showToast("⚠ " + (r.error ?? "")); onDone(); return; }
      const e = r.result.entry;
      setL(r.result.labels); setPrice(r.result.price);
      setTag(e.tag); setDesc(e.desc); setImg(e.img); setImg2(e.img2); setConsent(!!e.photoConsent);
      if (e.category) setKind(e.category);
    });
    return () => clearTimeout(timer);
  }, [attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!L) {
    return (
      <View style={[styles.screen, { alignItems: "center", justifyContent: "center", padding: 32, gap: 14 }]}>
        {stuck ? (
          <>
            <SymbolView name="wifi.exclamationmark" size={40} tintColor={colors.warm} />
            <Text style={[styles.title, { flex: 0 }]}>{O.title}</Text>
            <Text style={[styles.hint, { textAlign: "center" }]}>{O.hint}</Text>
            {__DEV__ ? <Text style={[styles.hint, { textAlign: "center" }]}>{O.devHint}</Text> : null}
            <View style={[styles.actions, { alignSelf: "stretch" }]}>
              <GlassButton label={O.close} onPress={() => onDone()} />
              <PrimaryButton label={O.retry} onPress={() => setAttempt((a) => a + 1)} />
            </View>
          </>
        ) : <ActivityIndicator color={colors.muted} />}
        {/* Ein neuer Versuch baut die Brücke neu auf (key), sonst bliebe ein
            nie geladener Webview einfach tot. */}
        <View key={attempt} style={styles.bridge}>{bridge}</View>
      </View>
    );
  }

  const hasSubstance = Boolean(img) || Boolean(desc.trim());
  const clean = cleanTag(tag);
  const title = mode === "me" ? L.meTitle : mode === "edit" ? (L.editTitleFor[kind] ?? L.editTitleFor.person) : L.titleFor[kind];
  const face = mode === "me" || kind === "person";
  const needsConsent = Boolean((img && !drawn) || img2);

  /* Die Fotoquelle als System-Blatt — Mediathek, Kamera, Entfernen. */
  function photoMenu(slot: 1 | 2) {
    Haptics.selectionAsync();
    const has = slot === 1 ? !!img : !!img2;
    const set = slot === 1 ? setImg : setImg2;
    const options = [L!.photoAdd, L!.photoTake, ...(has ? [L!.photoRemove] : []), L!.cancel];
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: has ? 2 : undefined, userInterfaceStyle: "dark" },
      async (i) => {
        if (i === 0 || i === 1) {
          const url = await pickPhoto(i === 1, slot === 1 && kind !== "place");
          if (url) { set(url); if (slot === 1) setDrawn(false); setConsent(false); setCheck({ status: "idle" }); checkRun.current++; Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
        } else if (has && i === 2) { set(""); if (slot === 1) setDrawn(false); setConsent(false); setCheck({ status: "idle" }); checkRun.current++; }
      },
    );
  }

  async function draw() {
    if (busy || desc.trim().length < 10) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusy("draw");
    const r = await ask({ type: "avatarDraw", text: desc, category: kind });
    setBusy(null);
    if (r.error === "nocredits") { showToast("⚠ " + (L!.creditsWord ?? "Credits")); return; }
    if (r.error || !r.result?.img) { showToast("⚠ " + (r.error ?? "")); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setImg(r.result.img); setDrawn(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function save() {
    if (busy || !hasSubstance) return;
    if (needsConsent && !consent) { showToast(L!.needConsent ?? "⚠"); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return; }
    if (check.status === "blocked") { showToast(L!.checkBlockedSave ?? "⚠"); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setBusy("save");
    const r = await ask({ type: "avatarSave", mode, id, avatar: { tag, desc, img, img2, category: kind, consent: !needsConsent || consent, check: check.status === "idle" || check.status === "checking" ? undefined : check.status } });
    setBusy(null);
    if (r.error) { showToast(r.error); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    if (r.result?.toast) showToast(r.result.toast);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDone(r.result?.id);
  }

  async function runCheck() {
    const photo = img && !drawn ? img : img2;
    if (!photo) return;
    const run = ++checkRun.current;
    setCheck({ status: "checking" });
    const r = await ask({ type: "avatarCheck", photo, category: mode === "me" ? "person" : kind });
    if (run !== checkRun.current) return;                 // inzwischen neues Foto oder Haken weg
    const res = r.result ?? { status: "unavailable" };
    setCheck({ status: res.status, message: res.message });
    if (res.status === "ok") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (res.status === "blocked") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  async function remove() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const r = await ask({ type: "avatarDelete", id });
    if (r.result?.toast) showToast(r.result.toast);
    onDone();
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => { Haptics.selectionAsync(); onDone(); }} hitSlop={12} accessibilityLabel={L.cancel}>
          <Glass style={styles.close} interactive><SymbolView name="xmark" size={15} tintColor={colors.text} weight="semibold" /></Glass>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: TAB_INSET + 20 }]} keyboardShouldPersistTaps="handled">
        {/* Das Bild zuerst und groß: darum geht es hier. Antippen öffnet die Quelle. */}
        <Pressable onPress={() => photoMenu(1)} style={styles.faceWrap} accessibilityLabel={img ? L.photoReplace : L.photoAdd}>
          <View style={[styles.face, kind === "place" && styles.facePlace]}>
            {img
              ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
              : <SymbolView name={face ? "person.crop.circle.badge.plus" : kind === "pet" ? "pawprint.circle" : "photo.badge.plus"} size={58} tintColor={colors.accentSoft} />}
            {busy === "draw" ? <View style={styles.drawing}><ActivityIndicator color={colors.text} /><Text style={styles.drawingText}>{L.drawingNow}</Text></View> : null}
          </View>
          <View style={styles.faceBadge}><Glass style={styles.faceBadgeGlass} interactive><SymbolView name={img ? "arrow.triangle.2.circlepath.camera" : "camera.fill"} size={15} tintColor={colors.text} /></Glass></View>
        </Pressable>
        <Text style={styles.caption}>{face ? L.photoLabelClose : L.photoLabel}</Text>
        {kind !== "place" && !img ? <Text style={styles.hint}>{L.photoHint}</Text> : null}

        {/* „Aus deiner Beschreibung zeichnen" — erst, wenn es etwas zu zeichnen gibt. */}
        {!img && desc.trim().length >= 10 ? (
          <Pressable onPress={draw} disabled={!!busy}>
            <Glass style={styles.draw} interactive>
              <SymbolView name="sparkles" size={20} tintColor={colors.gold} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.drawTitle}>{busy === "draw" ? L.drawingNow : L.drawFromDesc}</Text>
                <Text style={styles.hint}>{L.drawHint}</Text>
              </View>
              <Text style={styles.price}>{price} {L.creditsWord}</Text>
            </Glass>
          </Pressable>
        ) : null}

        {choosing ? (
          <View style={styles.field}>
            <Text style={styles.label}>{L.kindLabel}</Text>
            <View style={styles.kinds}>
              {(["person", "pet", "place", "object"] as Kind[]).map((k) => {
                const on = kind === k;
                return (
                  <Pressable key={k} style={{ flex: 1 }} onPress={() => { Haptics.selectionAsync(); setKind(k); }}>
                    <Glass style={[styles.kind, on && styles.kindOn]} tint={on ? "rgba(140,192,255,0.3)" : undefined} interactive>
                      <SymbolView name={KIND_ICON[k]} size={18} tintColor={on ? colors.accentSoft : colors.faint} />
                      <Text style={[styles.kindText, on && { color: colors.accentSoft }]}>{L.kindFor[k]}</Text>
                    </Glass>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>{String(L.nameTpl).replace("{tag}", clean || "…")}</Text>
          <TextInput style={styles.input} value={tag} onChangeText={setTag} maxLength={20} autoCapitalize="none" autoCorrect={false} keyboardAppearance="dark" placeholderTextColor={colors.faint} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{mode === "me" ? (img ? L.descLabelMeOptional : L.descLabelMe) ?? L.descLabel : img ? L.descLabelOptional : L.descLabel}</Text>
          <TextInput style={[styles.input, styles.inputMulti]} value={desc} onChangeText={setDesc} maxLength={120} multiline placeholder={L.descPlaceholder} placeholderTextColor={colors.faint} keyboardAppearance="dark" />
        </View>

        {/* Das Ganzkörperfoto erst, wenn das Gesicht steht — vorher wäre es
            die Frage nach dem zweiten Schritt vor dem ersten. */}
        {img && kind !== "place" ? (
          <Pressable onPress={() => photoMenu(2)}>
            <Glass style={styles.body} interactive>
              {img2 ? <Image source={{ uri: img2 }} style={styles.bodyThumb} contentFit="cover" /> : <View style={[styles.bodyThumb, styles.bodyEmpty]}><SymbolView name="figure.stand" size={24} tintColor={colors.accentSoft} /></View>}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.drawTitle}>{img2 ? L.photoLabelBody : L.photoBodyAdd}</Text>
                <Text style={styles.hint}>{L.photoBodyWhy}</Text>
              </View>
              <SymbolView name="chevron.right" size={14} tintColor={colors.faint} />
            </Glass>
          </Pressable>
        ) : null}

        {!hasSubstance ? <Text style={[styles.hint, { color: colors.warm }]}>{L.needPhotoOrDescHint}</Text> : null}

        {/* Je Foto: „Ich darf das" — ohne Haken kein Speichern. */}
        {needsConsent ? (
          <Pressable onPress={() => { Haptics.selectionAsync(); const next = !consent; setConsent(next); if (next) runCheck(); else { checkRun.current++; setCheck({ status: "idle" }); } }} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
            <Glass style={[styles.consent, consent && styles.consentOn]} interactive>
              <SymbolView name={consent ? "checkmark.square.fill" : "square"} size={24} tintColor={consent ? colors.ok : colors.muted} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.consentText}>{L.consentFor?.[mode === "me" ? "me" : kind] ?? L.consentFor?.person}</Text>
                <Text style={styles.consentSmall}>{L.consentSmall}</Text>
              </View>
            </Glass>
          </Pressable>
        ) : null}
        {needsConsent && check.status !== "idle" ? (
          <View style={[styles.check, check.status === "ok" && styles.checkOk, check.status === "blocked" && styles.checkBad]} accessibilityLiveRegion="polite">
            {check.status === "checking" ? <ActivityIndicator size="small" color={colors.muted} /> : (
              <SymbolView name={check.status === "ok" ? "checkmark.seal.fill" : check.status === "blocked" ? "exclamationmark.octagon.fill" : "questionmark.circle"} size={20} tintColor={check.status === "ok" ? colors.ok : check.status === "blocked" ? colors.bad : colors.faint} />
            )}
            <Text style={[styles.checkText, check.status === "blocked" && { color: colors.text }]}>
              {check.status === "checking" ? L.checking : check.status === "ok" ? L.checkOk : check.status === "blocked" ? (check.message ?? L.checkBlockedSave) : L.checkUnavailable}
            </Text>
          </View>
        ) : null}
        <Text style={styles.privacy}>{L.privacy}</Text>

        <View style={styles.actions}>
          <GlassButton label={L.cancel} onPress={() => onDone()} />
          <PrimaryButton label={busy === "save" ? "…" : mode === "new" ? L.save : L.saveChanges} heavy onPress={save} disabled={!hasSubstance || !clean || !!busy || (needsConsent && !consent) || check.status === "blocked"} />
        </View>

        {mode === "edit" ? (
          <Pressable onPress={remove} style={styles.delete} hitSlop={8}>
            <Text style={styles.deleteText}>{L.delete}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <View style={styles.bridge}>{bridge}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  close: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontFamily: fonts.serif, fontSize: 22, color: colors.text },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  faceWrap: { alignSelf: "center", marginTop: 6 },
  face: { width: 168, height: 168, borderRadius: 84, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(140,192,255,0.10)", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  facePlace: { width: 220, borderRadius: 28 },
  faceBadge: { position: "absolute", right: 4, bottom: 4 },
  faceBadgeGlass: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  drawing: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(5,10,20,0.6)", alignItems: "center", justifyContent: "center", gap: 6 },
  drawingText: { color: colors.text, fontSize: 12 },
  caption: { color: colors.muted, fontSize: 13, textAlign: "center", marginTop: -4 },
  hint: { color: colors.faint, fontSize: 12.5, lineHeight: 17 },
  draw: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18 },
  drawTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  price: { color: colors.gold, fontSize: 12.5, fontWeight: "600" },
  field: { gap: 6 },
  label: { color: colors.muted, fontSize: 13, marginLeft: 4 },
  input: { minHeight: 52, color: colors.text, fontSize: 17, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  inputMulti: { minHeight: 84, textAlignVertical: "top" },
  kinds: { flexDirection: "row", gap: 8 },
  kind: { alignItems: "center", gap: 6, paddingVertical: 12, borderRadius: 16 },
  kindOn: {},
  kindText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  body: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 18 },
  bodyThumb: { width: 52, height: 72, borderRadius: 10, overflow: "hidden" },
  bodyEmpty: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(140,192,255,0.10)" },
  privacy: { color: colors.faint, fontSize: 12, textAlign: "center", marginTop: 4 },
  consent: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 18 },
  consentOn: { borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(61,220,151,0.4)" },
  consentText: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: "600" },
  consentSmall: { color: colors.faint, fontSize: 11.5, lineHeight: 16 },
  check: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.panel },
  checkOk: { backgroundColor: "rgba(61,220,151,0.10)" },
  checkBad: { backgroundColor: "rgba(239,106,106,0.16)" },
  checkText: { flex: 1, color: colors.muted, fontSize: 13.5, lineHeight: 19 },
  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
  delete: { alignSelf: "center", marginTop: 18, paddingVertical: 10, paddingHorizontal: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.panelLine },
  deleteText: { color: colors.bad, fontSize: 15 },
  bridge: { height: 0, overflow: "hidden" },
});
