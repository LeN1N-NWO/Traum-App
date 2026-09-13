import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import { requestRecordingPermissionsAsync } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming, type SharedValue } from "react-native-reanimated";
import Svg, { Circle, G } from "react-native-svg";
import { Clip } from "@/components/preset-tile";
import { clipSource } from "@/lib/style-clips";
import { Glass, GlassButton, PrimaryButton } from "@/components/glass";
import { login, useAccountEmail, type LoginFailure } from "@/lib/auth";
import type { OnboardData } from "@/store/journal-store";
import { colors, fonts, radius } from "@/theme";

/* Das Onboarding, nativ — eine Frage je Bildschirm (Antons Vorbild 13.09.:
   Moonly/Opal), und die Berechtigungen GANZ AM ANFANG: „Was nicht am Anfang
   passiert, passiert nie."
 *
 * Die Fragen sind dieselben wie im Web-Formular (lib/onboardingForm.js) —
 * gleiche Schlüssel, gleiche Werte, damit der Traumbogen im Profil davon
 * nichts merkt. Nur gestellt wird anders: einzeln, groß, mit Fortschritt.
 *
 * Der Platzhalter für Antons Intro-Video ist das vorhandene
 * intro-faultier.mp4; der Name blendet darüber auf. Tauscht er die Datei,
 * ändert sich hier eine Zeile. */
const intro = require("../../../src/assets/intro-faultier.mp4");

type Answers = { name: string; mascot: string; goals: string[]; recall: string; lucid: string; sleepHours: string; timeBudget: string; themes: string[] };
const EMPTY: Answers = { name: "", mascot: "", goals: [], recall: "", lucid: "", sleepHours: "", timeBudget: "", themes: [] };

/* Wie viele Jahre Schlaf die Antwort bedeutet — der Aufschlag-Bildschirm
   nach Antons Opal-Vorbild. Aus der Mitte der gewählten Spanne, über ein
   Leben von 80 Jahren; ein Viertel der Schlafzeit ist REM (Traumschlaf). */
const SLEEP_HOURS: Record<string, number> = { "under-6": 5.5, "6-7": 6.5, "7-8": 7.5, "8-9": 8.5, "over-9": 9.5 };
const LIFE_YEARS = 80;
function sleepYears(key: string) {
  const h = SLEEP_HOURS[key] ?? 7.5;
  return Math.round((h / 24) * LIFE_YEARS);
}
function dreamYears(key: string) {
  return Math.max(1, Math.round(sleepYears(key) * 0.25));
}

const ICONS: Record<number, SFSymbol> = { 0: "waveform.and.mic", 1: "film", 2: "moon.stars", 3: "lock" };

export function OnboardingFlow({ O, onDone, onPhoto, questionsOnly = false, onExit }: { O: OnboardData; onDone: (answers: Answers) => void; onPhoto?: (dataUrl: string) => void; questionsOnly?: boolean; onExit?: () => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(() => (__DEV__ && typeof (globalThis as any).__ONB_STEP__ === "number" ? (globalThis as any).__ONB_STEP__ : 0));
  const [a, setA] = useState<Answers>(EMPTY);
  const [mic, setMic] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<boolean | null>(null);
  const [themeDraft, setThemeDraft] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);   // Vorschau (Datei-URI), das Bild selbst geht als Data-URL zur Brücke

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((prev) => ({ ...prev, [k]: v }));
  // Ein zweiter Tipp nimmt die Antwort zurück — wie im Web-Formular.
  const pick = (k: "recall" | "lucid" | "sleepHours" | "timeBudget", v: string) => { Haptics.selectionAsync(); set(k, a[k] === v ? "" : v); };
  // Mehrfachwahl beim Ziel (Antons Wunsch 13.09.): „selten hat man genau einen Grund".
  const toggleGoal = (v: string) => { Haptics.selectionAsync(); set("goals", a.goals.includes(v) ? a.goals.filter((x) => x !== v) : [...a.goals, v]); };

  /* Die Antworten als RASTER gleich großer Kacheln (Antons Vorbild: das
     Apple-Watch-Raster) — die alten Pillen hatten jede eine andere Breite
     und blieben beim Umbrechen „zwischen den Kacheln stecken". Zwei
     Spalten, gleiche Höhe, Text mittig; die gewählte trägt Glas und Haken. */
  const raster = (values: string[], labels: Record<string, string>, gewaehlt: (v: string) => boolean, tap: (v: string) => void, multi: boolean) => (
    <View style={styles.grid}>
      {values.map((v) => {
        const on = gewaehlt(v);
        return (
          <Pressable key={v} onPress={() => tap(v)} style={styles.gridCell}>
            <Glass style={[styles.tile, on && styles.tileOn]} tint={on ? "rgba(140,192,255,0.3)" : undefined} interactive>
              {multi ? (
                <SymbolView name={on ? "checkmark.circle.fill" : "circle"} size={17} tintColor={on ? colors.accentSoft : colors.faint} />
              ) : null}
              <Text style={[styles.tileText, on && styles.tileTextOn]}>{labels[v] ?? v}</Text>
            </Glass>
          </Pressable>
        );
      })}
    </View>
  );

  const frage = (key: "recall" | "lucid" | "sleepHours" | "timeBudget", title: string, values: string[], labels: Record<string, string>) => ({
    key, title, answered: !!a[key],
    body: raster(values, labels, (v) => a[key] === v, (v) => pick(key, v), false),
  });

  /* Die Bildschirme in der Reihenfolge, in der sie kommen. Intro und
     Feature-Kacheln tragen ihren eigenen Knopf, die Fragen den gemeinsamen
     „Weiter" unten. */
  const fragen = [
    {
      key: "goals" as const, title: O.formGoal, answered: a.goals.length > 0,
      body: raster(O.values.goal.order, O.values.goal.labels, (v) => a.goals.includes(v), toggleGoal, true),
    },
    frage("recall", O.formRecall, O.values.recall.order, O.values.recall.labels),
    frage("lucid", O.formLucid, O.values.lucid.order, O.values.lucid.labels),
    frage("sleepHours", O.formSleep, O.values.sleepHours.order, O.values.sleepHours.labels),
    frage("timeBudget", O.formTime, O.values.timeBudget.order, O.values.timeBudget.labels),
  ];
  /* Die Reihenfolge der Bildschirme — als LISTE, nicht als Rechnung mit
     Indizes: Nach jeder Frage kommt ein Zwischenbild mit Film (Antons
     Wunsch 13.09., Moonly-Vorbild), und nach der Schlaf-Frage der
     Jahre-Zähler. Wer hier etwas einschiebt, ändert nur diese Liste. */
  type Screen =
    | { kind: "intro" } | { kind: "features" } | { kind: "permits" } | { kind: "name" }
    | { kind: "question"; at: number } | { kind: "showcase"; at: number }
    | { kind: "sleepYears" } | { kind: "mascot" } | { kind: "themes" } | { kind: "account" } | { kind: "me" } | { kind: "done" };
  const screens: Screen[] = [{ kind: "intro" }, { kind: "features" }, { kind: "permits" }, { kind: "name" }];
  fragen.forEach((f, i) => {
    screens.push({ kind: "question", at: i });
    if (f.key === "sleepHours") screens.push({ kind: "sleepYears" });
    else {
      const at = i > 3 ? i - 1 : i;
      screens.push({ kind: "showcase", at });
      /* Nach dem Zwischenbild „Die Menschen darin sind deine" (at 1) das
         eigene Foto (Antons Platzwahl 13.09.): erst sehen, dass man
         mitspielt, dann das Gesicht geben. */
      if (at === 1) screens.push({ kind: "me" });
    }
  });
  /* Die Anmeldung GANZ AM ENDE (Antons Platzwahl 13.09.): Wer bis hierher
     geantwortet hat, sichert das Ergebnis — nicht umgekehrt. Am Anfang
     schreckt sie ab, beim Kauf ist sie zu spät. */
  screens.push({ kind: "mascot" }, { kind: "themes" }, { kind: "account" }, { kind: "done" });
  /* Nur die Fragen (Profil → „Umfrage", seit 13.09. nativ statt der
     Web-Umfrage): Name, die fünf Fragen samt Jahre-Kreis, Themen, Schluss —
     ohne Intro, Berechtigungen, Zwischenbilder, Foto, Begleiter, Anmeldung. */
  const shown = questionsOnly ? screens.filter((x) => ["name", "question", "sleepYears", "themes", "done"].includes(x.kind)) : screens;
  const total = shown.length;
  const jetzt = shown[Math.min(step, total - 1)];

  // Am ersten Bildschirm führt Zurück hinaus, wenn es ein Draußen gibt (Umfrage im Profil).
  function back() { Haptics.selectionAsync(); if (step === 0 && onExit) { onExit(); return; } setStep((s: number) => Math.max(0, s - 1)); }
  function next() { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep((s: number) => s + 1); }
  function finish() { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDone(a); }

  /* Das eigene Foto: Bibliothek oder Kamera, quadratisch beschnitten,
     nativ auf 1600 px verkleinert (wie compactDataUrl im Web) und als
     JPEG-Data-URL an die Brücke — dort wird es `me.img`. */
  async function pickPhoto(camera: boolean) {
    Haptics.selectionAsync();
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.9 };
    const r = camera ? await ImagePicker.launchCameraAsync(opts).catch(() => null) : await ImagePicker.launchImageLibraryAsync(opts).catch(() => null);
    const asset = r && !r.canceled ? r.assets[0] : null;
    if (!asset) return;
    const small = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 1600 } }], { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true });
    setPhoto(small.uri);
    if (small.base64) onPhoto?.(`data:image/jpeg;base64,${small.base64}`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function askMic() {
    Haptics.selectionAsync();
    const r = await requestRecordingPermissionsAsync();
    setMic(r.granted);
  }
  async function askPhotos() {
    Haptics.selectionAsync();
    const r = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // Die Kamera gleich mit: beide gehören zum Anlegen einer Figur.
    await ImagePicker.requestCameraPermissionsAsync().catch(() => {});
    setPhotos(r.granted);
  }

  // ── Intro mit App-Namen (Platzhalter für Antons Video)
  if (jetzt.kind === "intro") return <Intro O={O} onNext={next} />;

  // ── Was die App macht, als Glas-Kacheln mit laufenden Filmen
  if (jetzt.kind === "features") {
    return (
      <Shell insets={insets} step={step} total={total} title={O.featuresTitle} lede={O.featuresLede} onBack={step > 0 || onExit ? back : undefined}>
        {/* Vier Kacheln im Glas, in denen die Traum-Clips laufen — Antons
            Vorbild (Moonly). Die Filme sind erst mal die Vorschau-Clips der
            Stile; jede Kachel trägt ihr Etikett wie dort. */}
        {/* Zwei Spalten, versetzt wie beim Vorbild (Moonly): links kurz
            über lang, rechts lang über kurz. Die Kachel trägt NUR ihr
            Etikett — der Satz dazu ist der Untertitel oben (Antons Befund
            13.09.: „aufgeräumter"). Etiketten der oberen Reihe sitzen am
            oberen Rand, die der unteren am unteren. */}
        <View style={styles.tiles}>
          {[[0, 2], [1, 3]].map((spalte, c) => (
            <View key={c} style={styles.tileCol}>
              {spalte.map((i, r) => {
                const f = O.features[i];
                if (!f) return null;
                const lang = (c === 0) === (r === 1);
                return (
                  <FeatureTile key={f.title} i={i} title={f.title} clip={O.clips[i % Math.max(1, O.clips.length)] ?? null} tall={lang} labelBottom={r === 1} />
                );
              })}
            </View>
          ))}
        </View>
        {/* ⚠ PLATZHALTER: die Proof-Zeile (Antons Ansage 13.09.: „erst mal
            fake, technisch") — Lorbeer, Sterne, „folgt". Wird gegen echte
            Auszeichnungen getauscht. */}
        <View style={styles.proofRow}>
          {O.proof.map((pr, i) => (
            <View key={i} style={styles.proof}>
              <SymbolView name="laurel.leading" size={30} tintColor={colors.muted} />
              <View style={{ alignItems: "center", gap: 1 }}>
                <Text style={styles.proofBig}>{pr.big}</Text>
                <Text style={styles.proofSmall}>{pr.small}</Text>
              </View>
              <SymbolView name="laurel.trailing" size={30} tintColor={colors.muted} />
            </View>
          ))}
        </View>
        <PrimaryButton label={O.next} heavy onPress={next} style={{ flex: 0 }} />
      </Shell>
    );
  }

  // ── Die Berechtigungen, ganz am Anfang (Antons Regel)
  if (jetzt.kind === "permits") {
    const row = (title: string, why: string, state: boolean | null, ask: () => void, icon: SFSymbol) => (
      <Glass style={styles.permit}>
        <View style={styles.cardIcon}><SymbolView name={icon} size={20} tintColor={state === true ? colors.ok : colors.accentSoft} /></View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardText}>{state === null ? why : state ? O.askGranted : O.askDenied}</Text>
        </View>
        {state === null ? (
          <Pressable onPress={ask}><Glass style={styles.permitBtn} interactive><Text style={styles.permitBtnText}>{O.askGo}</Text></Glass></Pressable>
        ) : (
          <SymbolView name={state ? "checkmark.circle.fill" : "xmark.circle"} size={24} tintColor={state ? colors.ok : colors.faint} />
        )}
      </Glass>
    );
    return (
      <Shell insets={insets} step={step} total={total} title={O.askTitle} lede={O.askText} onBack={step > 0 || onExit ? back : undefined}>
        <View style={{ gap: 10, width: "100%" }}>
          {row(O.askMic, O.askMicWhy, mic, askMic, "mic.fill")}
          {row(O.askPhotos, O.askPhotosWhy, photos, askPhotos, "photo.on.rectangle")}
        </View>
        <PrimaryButton label={O.next} onPress={next} style={{ flex: 0 }} />
      </Shell>
    );
  }

  // ── Der Name
  if (jetzt.kind === "name") {
    return (
      <Shell insets={insets} step={step} total={total} title={O.formName} onBack={step > 0 || onExit ? back : undefined}>
        <TextInput
          style={styles.input} value={a.name} onChangeText={(v) => set("name", v.slice(0, 40))}
          placeholder={O.formNamePlaceholder} placeholderTextColor={colors.faint}
          autoCapitalize="words" keyboardAppearance="dark" returnKeyType="done" onSubmitEditing={() => { if (a.name.trim()) next(); }} autoFocus
        />
        <PrimaryButton label={O.next} onPress={next} disabled={!a.name.trim()} style={{ flex: 0 }} />
      </Shell>
    );
  }

  // ── Eine Frage je Bildschirm
  if (jetzt.kind === "question") {
    const f = fragen[jetzt.at];
    return (
      <Shell key={f.key} insets={insets} step={step} total={total} title={f.title} onBack={step > 0 || onExit ? back : undefined}>
        {f.body}
        {/* Ohne Antwort kein Weiter (Antons Befund 13.09.) — wer nicht
            antworten will, nimmt „Überspringen" oben rechts. */}
        <PrimaryButton label={O.next} onPress={next} disabled={!f.answered} style={{ flex: 0 }} />
      </Shell>
    );
  }

  // ── Das Zwischenbild mit Film (Antons Wunsch 13.09.)
  if (jetzt.kind === "showcase") {
    const sc = O.showcase[jetzt.at % Math.max(1, O.showcase.length)];
    /* Das erste Zwischenbild („Neunzehn Blicke") schneidet im Sekundentakt
       durch ALLE Stile (Antons Wunsch 13.09.); die anderen zeigen einen. */
    const clip = jetzt.at === 0 && O.reel.length ? O.reel : jetzt.at === 1 ? O.peopleClip : O.clips.length ? O.clips[(jetzt.at + 1) % O.clips.length] : null;
    return <Showcase O={O} title={sc?.title ?? ""} text={sc?.text ?? ""} clip={clip} insets={insets} step={step} total={total} onNext={next} onBack={back} />;
  }

  // ── Die Jahre im Schlaf (Antons Opal-Vorbild) — direkt nach der Schlaf-Frage
  if (jetzt.kind === "sleepYears") {
    return <SleepYears O={O} answer={a.sleepHours} insets={insets} step={step} total={total} onNext={next} onBack={back} />;
  }

  // ── Wer bist du? Das eigene Foto (nach dem Zwischenbild „du kommst drin vor")
  if (jetzt.kind === "me") {
    return (
      <Shell insets={insets} step={step} total={total} title={O.meTitle} lede={O.meText} onBack={back}>
        <View style={{ alignItems: "center", gap: 18, width: "100%" }}>
          <View style={styles.face}>
            {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : <SymbolView name="person.crop.circle.badge.plus" size={64} tintColor={colors.accentSoft} />}
          </View>
          {photo ? <Animated.Text entering={FadeIn.duration(260)} style={styles.faceDone}>{O.meDone}</Animated.Text> : null}
          <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
            <GlassButton label={photo ? O.meChange : O.mePick} onPress={() => pickPhoto(false)} />
            <GlassButton label={O.meCamera} onPress={() => pickPhoto(true)} />
          </View>
        </View>
        <View style={{ gap: 6 }}>
          <PrimaryButton label={O.next} heavy onPress={next} disabled={!photo} style={{ flex: 0 }} />
          <Pressable onPress={() => { Haptics.selectionAsync(); next(); }} hitSlop={10} style={{ alignSelf: "center", paddingVertical: 10 }}>
            <Text style={styles.later}>{O.meLater}</Text>
          </Pressable>
        </View>
      </Shell>
    );
  }

  /* ── Die Maskottchen-Wahl. ⚠ Zwei von drei sind Platzhalter (mascots.js);
     die Kachel sagt das auch, damit niemand eine Zeichnung erwartet, die
     es noch nicht gibt (Antons Ansage 13.09.). */
  if (jetzt.kind === "mascot") {
    const gewaehlt = a.mascot || O.mascot;
    return (
      <Shell insets={insets} step={step} total={total} title={O.mascotTitle} lede={O.mascotText} onBack={back}>
        <View style={styles.grid}>
          {O.mascots.map((m) => {
            const on = gewaehlt === m.id;
            return (
              <Pressable key={m.id} onPress={() => { Haptics.selectionAsync(); set("mascot", m.id); }} style={styles.gridCell}>
                <Glass style={[styles.mascotTile, on && styles.tileOn]} tint={on ? "rgba(140,192,255,0.3)" : undefined} interactive>
                  <View style={styles.mascotFace}>
                    <MascotFace id={m.id} />
                  </View>
                  <Text style={[styles.tileText, on && styles.tileTextOn]}>{m.name}</Text>
                  {m.placeholder ? <Text style={styles.mascotSoon}>{O.mascotSoon}</Text> : null}
                </Glass>
              </Pressable>
            );
          })}
        </View>
        <PrimaryButton label={O.next} onPress={next} style={{ flex: 0 }} />
      </Shell>
    );
  }

  // ── Die wiederkehrenden Themen
  if (jetzt.kind === "themes") {
    const add = () => {
      const clean = themeDraft.trim();
      if (!clean || a.themes.includes(clean) || a.themes.length >= 12) { setThemeDraft(""); return; }
      Haptics.selectionAsync();
      set("themes", [...a.themes, clean.slice(0, 60)]);
      setThemeDraft("");
    };
    return (
      <Shell insets={insets} step={step} total={total} title={O.formThemes} onBack={step > 0 || onExit ? back : undefined}>
        <View style={{ width: "100%", gap: 10 }}>
          <View style={styles.themeRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]} value={themeDraft} onChangeText={setThemeDraft}
              placeholder={O.formThemesPlaceholder} placeholderTextColor={colors.faint}
              keyboardAppearance="dark" returnKeyType="done" onSubmitEditing={add}
            />
            <Pressable onPress={add}><Glass style={styles.themeAdd} interactive><SymbolView name="plus" size={18} tintColor={colors.text} weight="semibold" /></Glass></Pressable>
          </View>
          {a.themes.length ? (
            <View style={styles.chips}>
              {a.themes.map((th) => (
                <Pressable key={th} onPress={() => { Haptics.selectionAsync(); set("themes", a.themes.filter((x) => x !== th)); }}>
                  <Glass style={styles.chip} interactive><Text style={styles.chipText}>{th}  ×</Text></Glass>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
        <PrimaryButton label={O.next} onPress={next} style={{ flex: 0 }} />
      </Shell>
    );
  }

  // ── Die Anmeldung (Hannis Backend, Übergabe 12.09.)
  if (jetzt.kind === "account") {
    return <Account O={O} insets={insets} step={step} total={total} onNext={next} onBack={back} />;
  }

  // ── Schluss
  return (
    <Shell insets={insets} step={step} total={total} title={O.doneTitle} lede={O.doneText} onBack={back}>
      <View style={{ alignItems: "center", paddingVertical: 20 }}>
        <SymbolView name="moon.stars.fill" size={72} tintColor={colors.gold} />
      </View>
      <PrimaryButton label={O.doneCta} heavy onPress={finish} style={{ flex: 0 }} />
    </Shell>
  );
}

/* Die Anmeldung: E-Mail, Passwort, „Anmelden" — mehr nicht (Hannis
   Übergabe: kein Registrieren, kein Passwort-Vergessen; beides kommt mit
   „Mit Apple anmelden", für das unten schon der Platz steht). Ohne Konto
   geht es mit „Später" weiter — das Tagebuch lebt auf dem Gerät, das
   Konto ist die Sicherung, nicht die Bedingung.
   Die Token gehen in den Schlüsselbund (lib/auth.ts), nie in den Zustand. */
function Account({ O, insets, step, total, onNext, onBack }: { O: OnboardData; insets: { top: number; bottom: number }; step: number; total: number; onNext: () => void; onBack: () => void }) {
  const signedIn = useAccountEmail();
  const [mail, setMail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<LoginFailure | null>(null);
  const pwRef = useRef<TextInput>(null);
  const ready = /\S+@\S+\.\S+/.test(mail.trim()) && pw.length >= 6 && !busy;

  async function go() {
    if (!ready) return;
    setBusy(true); setFail(null);
    const r = await login(mail, pw);
    setBusy(false);
    if (r.ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setPw(""); }
    else { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); setFail(r.why); }
  }
  const reason: Record<LoginFailure, string> = { wrong: O.accountWrong, busy: O.accountBusy, unavailable: O.accountUnavailable, offline: O.accountOffline };

  return (
    <Shell insets={insets} step={step} total={total} title={O.accountTitle} lede={O.accountText} onBack={onBack}>
      {signedIn ? (
        <Animated.View entering={FadeIn.duration(260)} style={{ width: "100%", gap: 14 }}>
          <Glass style={styles.signedIn}>
            <SymbolView name="checkmark.seal.fill" size={26} tintColor={colors.ok} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.cardText}>{O.accountSignedIn}</Text>
              <Text style={styles.cardTitle} numberOfLines={1}>{signedIn}</Text>
            </View>
          </Glass>
          <PrimaryButton label={O.next} heavy onPress={onNext} style={{ flex: 0 }} />
        </Animated.View>
      ) : (
        <View style={{ width: "100%", gap: 10 }}>
          {/* Die Felder im Glas, wie die Antwort-Kacheln — ein Bildschirm,
              ein Material. Fehler stehen UNTER den Feldern, in Worten. */}
          <Glass style={styles.field} interactive>
            <SymbolView name="envelope" size={17} tintColor={colors.faint} />
            <TextInput
              style={styles.fieldInput} value={mail} onChangeText={(v) => { setMail(v); setFail(null); }}
              placeholder={O.accountEmail} placeholderTextColor={colors.faint}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email"
              keyboardAppearance="dark" returnKeyType="next" onSubmitEditing={() => pwRef.current?.focus()} editable={!busy}
            />
          </Glass>
          <Glass style={styles.field} interactive>
            <SymbolView name="key" size={17} tintColor={colors.faint} />
            <TextInput
              ref={pwRef} style={styles.fieldInput} value={pw} onChangeText={(v) => { setPw(v); setFail(null); }}
              placeholder={O.accountPassword} placeholderTextColor={colors.faint}
              secureTextEntry textContentType="password" autoComplete="password"
              keyboardAppearance="dark" returnKeyType="go" onSubmitEditing={go} editable={!busy}
            />
          </Glass>
          {fail ? <Animated.Text entering={FadeIn.duration(200)} style={styles.fail}>{reason[fail]}</Animated.Text> : null}
          <View style={{ marginTop: 6 }}>
            {busy ? (
              <Glass style={styles.busy}><ActivityIndicator color={colors.text} /></Glass>
            ) : (
              <PrimaryButton label={O.accountCta} heavy onPress={go} disabled={!ready} style={{ flex: 0 }} />
            )}
          </View>
          {/* Der Platz für den zweiten Knopf (Sign in with Apple, ADR-0005) —
              heute noch stumm, damit die Anordnung später nicht springt. */}
          <View style={[styles.apple, { opacity: 0.45 }]} pointerEvents="none">
            <SymbolView name="apple.logo" size={16} tintColor={colors.text} />
            <Text style={styles.appleText}>{O.accountApple}</Text>
          </View>
          <Pressable onPress={() => { Haptics.selectionAsync(); onNext(); }} hitSlop={10} disabled={busy} style={{ alignSelf: "center", paddingVertical: 10 }}>
            <Text style={styles.later}>{O.accountLater}</Text>
          </Pressable>
        </View>
      )}
    </Shell>
  );
}

/* Eine Feature-Kachel: der Clip hinter einer weichen Rundung, um die ein
   Schein läuft — der ATMET (langsam auf und ab, jede Kachel versetzt), das
   ist die „Animation am Rand", die Anton am Vorbild gesehen hat. Der Rand
   selbst ist ein Verlauf, der als 1,5-Punkt-Saum um die Kachel liegt. */
function FeatureTile({ i, title, clip, tall, labelBottom }: { i: number; title: string; clip: string | null; tall: boolean; labelBottom: boolean }) {
  /* Die leuchtende Kante (Antons Befund 13.09.: „Rand viel zu dick — schmal,
     mehr Farbe, und das Licht soll drum herum fahren"): ein SCHMALER Ring
     (1,5 pt), hinter dem ein großes Farbquadrat langsam ROTIERT — der Clip
     deckt die Mitte ab, sichtbar bleibt nur die Kante, und weil das
     Quadrat sich dreht, wandern die Farben um die Kachel. Zwei weitere,
     fast durchsichtige Ringe außen sind der Schein. Kein breiter Halo mehr. */
  const spin = useSharedValue(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    spin.value = withDelay(300 * i, withRepeat(withTiming(1, { duration: 7000 + 900 * i, easing: Easing.linear }), -1, false));
  }, [spin, i]);
  const rot = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const d = Math.hypot(box.w, box.h) + 24;                // das Quadrat deckt die Kachel in jeder Drehung
  const ring = (inset: number, opacity: number) => (
    <View key={inset} style={[StyleSheet.absoluteFill, { margin: -inset, borderRadius: 32 + inset, overflow: "hidden", opacity }]} pointerEvents="none">
      <Animated.View style={[{ position: "absolute", width: d, height: d, left: (box.w + 2 * inset - d) / 2, top: (box.h + 2 * inset - d) / 2 }, rot]}>
        <LinearGradient colors={["#8cc0ff", "#f2a765", "#ff7ab6", "#4fd6e6", "#8cc0ff"]} locations={[0, 0.3, 0.55, 0.8, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
  const badge = (
    <View style={[styles.tileBadge, labelBottom ? { bottom: -6 } : { top: -6 }]}>
      <Glass style={styles.tileBadgeGlass}>
        <SymbolView name={ICONS[i] ?? "sparkles"} size={12} tintColor={colors.accentSoft} />
        <Text style={styles.tileBadgeText} numberOfLines={1}>{title}</Text>
      </Glass>
    </View>
  );
  return (
    <Animated.View entering={FadeInDown.delay(70 * i).duration(320)} style={[styles.tileCell, tall && styles.tileTall]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {box.w ? [ring(7, 0.10), ring(4, 0.22), ring(1.5, 1)] : null}
      <View style={styles.tileClip}>
        {clip ? <Clip url={clip} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]} />}
        <LinearGradient colors={["rgba(5,10,20,0.35)", "rgba(5,10,20,0)", "rgba(5,10,20,0.45)"]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      </View>
      {badge}
    </Animated.View>
  );
}

/* Der Rahmen jeder Frage: Fortschritt oben, Überspringen rechts, Titel in
   der Serife, darunter der Inhalt, unten der Knopf. */
function Shell({ insets, step, total, title, lede, children, onBack }: { insets: { top: number; bottom: number }; step: number; total: number; title: string; lede?: string; children: React.ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.screen}>
      <LinearGradient colors={["rgba(42,98,208,0.28)", "rgba(5,10,20,0)"]} style={styles.glow} pointerEvents="none" />
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        {/* Nur der Zurück-Pfeil, kein Text, kein „Überspringen" mehr
            (Antons Ansage 13.09.: „komplett weglassen"). */}
        <View style={styles.skipRow}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Back">
              <SymbolView name="chevron.left" size={17} tintColor={colors.text} weight="semibold" />
            </Pressable>
          ) : <View style={{ width: 17 }} />}
        </View>
        <View style={styles.progress}>
          {Array.from({ length: total }, (_, i) => <View key={i} style={[styles.pip, i <= step && styles.pipOn]} />)}
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(260)} style={{ gap: 10 }}>
          <Text style={styles.title}>{title}</Text>
          {lede ? <Text style={styles.lede}>{lede}</Text> : null}
        </Animated.View>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </View>
  );
}

/* Der Anfang: das Intro-Video vollflächig, der Name blendet auf.
   ⚠ Platzhalter — Anton ersetzt die Datei durch seine Animation. */
function Intro({ O, onNext }: { O: OnboardData; onNext: () => void }) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(intro, (p) => { p.loop = true; p.muted = true; p.play(); });
  const k = useSharedValue(0);
  useEffect(() => { player.loop = true; player.muted = true; player.play(); k.value = withDelay(350, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })); }, [player, k]);
  const name = useAnimatedStyle(() => ({ opacity: k.value, transform: [{ translateY: (1 - k.value) * 14 }] }));
  return (
    <Animated.View exiting={FadeOut.duration(200)} style={styles.screen}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <LinearGradient colors={["rgba(5,10,20,0.55)", "rgba(5,10,20,0.15)", "rgba(5,10,20,0.95)"]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {/* Name und Knopf UNTEN beieinander: oben soll das Bild wirken
          (Antons Opal-/Moonly-Vorbild), nicht der Text. */}
      <View style={[styles.introBody, { paddingBottom: insets.bottom + 28, paddingTop: insets.top + 20 }]}>
        <View />
        <Animated.View style={[{ alignItems: "center", gap: 10, width: "100%" }, name]}>
          <Text style={styles.kicker}>{O.introKicker}</Text>
          <Text style={styles.brand}>Dream Rushes</Text>
          <Text style={styles.introText}>{O.introText}</Text>
          <View style={{ width: "100%", marginTop: 14 }}>
            <PrimaryButton label={O.introCta} heavy onPress={onNext} style={{ flex: 0 }} />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/* Die Gesichter der drei Maskottchen. Der Frosch ist weiße Kreide auf
   Schwarz (deshalb der schwarze Grund), das Faultier hat seinen eigenen
   Hintergrund, die Eule hat noch nichts — sie bekommt ein Zeichen.
   ⚠ Platzhalter, bis Antons Zeichnungen da sind. */
const MASCOT_CLIPS: Record<string, ReturnType<typeof require> | undefined> = {
  frog: require("../../../src/assets/mascot-frog-idle.mp4"),
  sloth: require("../../../src/assets/home-faultier.mp4"),
};
function MascotFace({ id }: { id: string }) {
  /* ⚠ Der Player wird IMMER angelegt, auch wenn es kein Video gibt — ein
     Haken hinter einer Abfrage bricht die Regel der festen Reihenfolge
     (react-hooks/rules-of-hooks). Ohne Quelle bleibt er einfach leer. */
  const quelle = MASCOT_CLIPS[id] ?? null;
  const player = useVideoPlayer(quelle, (p) => { p.loop = true; p.muted = true; if (quelle) p.play(); });
  if (!quelle) {
    return <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: colors.sky }]}><SymbolView name="moon.stars" size={26} tintColor={colors.accentSoft} /></View>;
  }
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

/* Das Zwischenbild: ein Film über die ganze Fläche, ein Satz darüber,
   weiter. Nach jeder Frage eines — es macht Lust auf die App, statt nur zu
   fragen (Antons Wunsch 13.09.). Die Clips sind vorerst die Vorschau-Filme
   der Stile; eigene kommen später. */
function Showcase({ O, title, text, clip, insets, step, total, onNext, onBack }: { O: OnboardData; title: string; text: string; clip: string | string[] | null; insets: { top: number; bottom: number }; step: number; total: number; onNext: () => void; onBack: () => void }) {
  return (
    <View style={styles.screen}>
      {Array.isArray(clip) ? <StyleReel urls={clip} /> : clip ? <Clip url={clip} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]} />}
      <LinearGradient colors={["rgba(5,10,20,0.8)", "rgba(5,10,20,0.25)", "rgba(5,10,20,0.9)"]} locations={[0, 0.42, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <View style={styles.skipRow}>
          <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Back">
            <SymbolView name="chevron.left" size={17} tintColor={colors.text} weight="semibold" />
          </Pressable>
        </View>
        <View style={styles.progress}>
          {Array.from({ length: total }, (_, i) => <View key={i} style={[styles.pip, i <= step && styles.pipOn]} />)}
        </View>
      </View>
      <View style={[styles.showBody, { paddingBottom: insets.bottom + 26 }]}>
        <Animated.View entering={FadeInDown.duration(340)} style={{ gap: 8 }}>
          <Text style={styles.showTitle}>{title}</Text>
          <Text style={styles.showText}>{text}</Text>
        </Animated.View>
        <PrimaryButton label={O.next} heavy onPress={onNext} style={{ flex: 0 }} />
      </View>
    </View>
  );
}

/* Der Schnellschnitt durch alle Stile: EIN Player, dessen Quelle jede
   Sekunde wechselt (`replaceAsync`) — neunzehn Player gleichzeitig wären
   zu viel für den Renderer (Falle in STAND: „neun laufende Videos blockieren
   ihn"). Die Clips kommen aus dem Bündel, der Wechsel ist deshalb sofort.
   ⚠ Kein Player-Zugriff im Aufräumer — nur der Takt wird gestoppt. */
function StyleReel({ urls }: { urls: string[] }) {
  const player = useVideoPlayer(clipSource(urls[0]), (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % urls.length;
      player.replaceAsync(clipSource(urls[i])).then(() => { player.loop = true; player.muted = true; player.play(); }).catch(() => {});
    }, 1000);
    return () => clearInterval(t);
  }, [player, urls]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

/* Die Jahre im Schlaf als Kreis (Antons Wunsch 13.09.): erst zeichnet
   sich der Ring des ganzen Lebens (80 Jahre), dann läuft der warme Bogen
   des Schlafs hinein, dann darin der goldene der Träume — die Zahl in
   der Mitte zählt mit dem Bogen hoch. Der Satz darunter sagt, wofür das
   alles ist: die Jahre nicht vorbeiziehen lassen.
   ⚠ Bögen mit react-native-svg (seit 13.09. installiert, Pods + Rebuild):
   strokeDashoffset über Reanimated — kein setState je Frame. */
const RING = 220;
const STROKE = 18;
const R = (RING - STROKE) / 2;
const UMFANG = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
function Bogen({ anteil, k, farbe }: { anteil: number; k: SharedValue<number>; farbe: string }) {
  const props = useAnimatedProps(() => ({ strokeDashoffset: UMFANG * (1 - anteil * k.value) }));
  return <AnimatedCircle cx={RING / 2} cy={RING / 2} r={R} stroke={farbe} strokeWidth={STROKE} strokeLinecap="round" fill="none" strokeDasharray={`${UMFANG} ${UMFANG}`} animatedProps={props} />;
}
function SleepYears({ O, answer, insets, step, total, onNext, onBack }: { O: OnboardData; answer: string; insets: { top: number; bottom: number }; step: number; total: number; onNext: () => void; onBack: () => void }) {
  const schlaf = sleepYears(answer);
  const traum = dreamYears(answer);
  const leben = useSharedValue(0), s = useSharedValue(0), d = useSharedValue(0);
  const [n, setN] = useState(0);
  const [zeigTraum, setZeigTraum] = useState(false);
  useEffect(() => {
    leben.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    s.value = withDelay(900, withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) }));
    d.value = withDelay(2100, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
    // Die Zahl läuft mit dem Schlaf-Bogen (900 ms Start, 1100 ms Dauer).
    const start = Date.now() + 900;
    const t = setInterval(() => {
      const p = Math.min(1, Math.max(0, (Date.now() - start) / 1100));
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(schlaf * e));
      if (p >= 1) { clearInterval(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    }, 40);
    const t2 = setTimeout(() => { setZeigTraum(true); Haptics.selectionAsync(); }, 2300);
    return () => { clearInterval(t); clearTimeout(t2); };
  }, [schlaf, leben, s, d]);
  return (
    <Shell insets={insets} step={step} total={total} title={O.sleepTitle} onBack={onBack}>
      <View style={{ alignItems: "center", gap: 16, paddingTop: 6 }}>
        <View style={{ width: RING, height: RING, alignItems: "center", justifyContent: "center" }}>
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            <G rotation={-90} origin={`${RING / 2}, ${RING / 2}`}>
              <Bogen anteil={1} k={leben} farbe="rgba(255,255,255,0.10)" />
              <Bogen anteil={schlaf / LIFE_YEARS} k={s} farbe={colors.warm} />
              {/* Träume GRÜN, nicht gold: gold lag zu nah am warmen Schlaf-Bogen
                  (Antons Befund 13.09.). */}
              <Bogen anteil={traum / LIFE_YEARS} k={d} farbe={colors.ok} />
            </G>
          </Svg>
          <Text style={styles.ringYears}>{O.sleepYears(n)}</Text>
          <Text style={styles.ringLabel}>{O.sleepAsleep}</Text>
        </View>
        <View style={styles.legend}>
          {[["rgba(255,255,255,0.18)", O.sleepLegend.life], [colors.warm, O.sleepLegend.sleep], [colors.ok, O.sleepLegend.dream]].map(([c, l]) => (
            <View key={l} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: c }]} /><Text style={styles.legendText}>{l}</Text></View>
          ))}
        </View>
        {zeigTraum ? <Animated.Text entering={FadeInDown.duration(420)} style={styles.sleepDream}>{O.sleepDream(traum)}</Animated.Text> : <Text style={[styles.sleepDream, { opacity: 0 }]}>{O.sleepDream(traum)}</Text>}
        <Text style={styles.sleepNote}>{O.sleepNote}</Text>
      </View>
      <PrimaryButton label={O.next} onPress={onNext} style={{ flex: 0 }} />
    </Shell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  glow: { position: "absolute", left: -40, right: -40, top: -60, height: 360 },
  top: { paddingHorizontal: 20, paddingBottom: 6, gap: 8 },
  skipRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 22 },
  progress: { flex: 1, flexDirection: "row", gap: 4 },
  pip: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)" },
  pipOn: { backgroundColor: colors.accentSoft },
  body: { paddingHorizontal: 22, paddingTop: 18, gap: 18, flexGrow: 1 },
  /* Überschrift und Untertitel MITTIG (Antons Vorbild 13.09.: Moonly) —
     und mit etwas Luft zum Rand, damit sie über dem Raster stehen statt
     an ihm zu kleben. */
  title: { fontFamily: fonts.serif, fontSize: 31, lineHeight: 37, color: colors.text, textAlign: "center", paddingHorizontal: 8 },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center", paddingHorizontal: 10 },
  content: { flex: 1, justifyContent: "space-between", gap: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCell: { width: "48%", flexGrow: 1 },
  mascotTile: { minHeight: 150, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", gap: 8 },
  mascotFace: { width: 74, height: 74, borderRadius: 37, overflow: "hidden", backgroundColor: "#000" },
  mascotSoon: { color: colors.faint, fontSize: 10.5, letterSpacing: 0.5, textTransform: "uppercase" },
  tile: { minHeight: 84, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", gap: 8 },
  tileOn: {},
  tileText: { color: colors.text, fontSize: 15, lineHeight: 20, textAlign: "center" },
  tileTextOn: { color: colors.accentSoft, fontWeight: "600" },
  tiles: { flexDirection: "row", gap: 14, width: "100%", paddingTop: 8, paddingBottom: 6 },
  tileCol: { flex: 1, gap: 22 },
  tileCell: { height: 150 },
  tileTall: { height: 206 },
  tileClip: { flex: 1, borderRadius: 32, overflow: "hidden", backgroundColor: colors.bg2 },
  tileBadge: { position: "absolute", left: -4, right: 8 },
  tileBadgeGlass: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 7, paddingHorizontal: 11, borderRadius: 999, alignSelf: "flex-start", maxWidth: "100%" },
  tileBadgeText: { color: colors.text, fontSize: 12.5, fontWeight: "600" },
  proofRow: { flexDirection: "row", justifyContent: "center", gap: 18, paddingTop: 4 },
  proof: { flexDirection: "row", alignItems: "center", gap: 4 },
  proofBig: { color: colors.text, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  proofSmall: { color: colors.faint, fontSize: 9.5, letterSpacing: 1.2, textTransform: "uppercase" },
  cards: { gap: 10, width: "100%" },
  card: { flexDirection: "row", gap: 14, padding: 16, borderRadius: radius.card, alignItems: "flex-start" },
  cardIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(140,192,255,0.12)" },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  cardText: { color: colors.muted, fontSize: 13.5, lineHeight: 19 },
  permit: { flexDirection: "row", gap: 14, padding: 16, borderRadius: radius.card, alignItems: "center" },
  permitBtn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999 },
  permitBtnText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  field: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 18, borderRadius: 18 },
  fieldInput: { flex: 1, color: colors.text, fontSize: 17, paddingVertical: 14 },
  fail: { color: colors.warm, fontSize: 14, lineHeight: 19, paddingHorizontal: 6 },
  busy: { minHeight: 50, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  apple: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 50, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  appleText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  later: { color: colors.faint, fontSize: 15 },
  signedIn: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 18 },
  face: { width: 168, height: 168, borderRadius: 84, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(140,192,255,0.10)", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  faceDone: { color: colors.ok, fontSize: 15, fontWeight: "600" },
  input: { minHeight: 56, color: colors.text, fontSize: 19, paddingHorizontal: 18, borderRadius: 18, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, marginBottom: 8 },
  themeRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  themeAdd: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  chipText: { color: colors.text, fontSize: 14 },
  introBody: { flex: 1, justifyContent: "space-between", alignItems: "center", paddingHorizontal: 26, gap: 20 },
  kicker: { color: colors.accentSoft, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" },
  brand: { fontFamily: fonts.serif, fontSize: 42, color: colors.text, textAlign: "center" },
  introText: { color: colors.muted, fontSize: 16, textAlign: "center", lineHeight: 23 },
  showBody: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 24, gap: 22 },
  showTitle: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.text },
  showText: { color: colors.muted, fontSize: 15.5, lineHeight: 22 },
  ringYears: { fontFamily: fonts.serif, fontSize: 40, color: colors.text, fontVariant: ["tabular-nums"] },
  ringLabel: { color: colors.muted, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", marginTop: 2 },
  legend: { flexDirection: "row", gap: 16, flexWrap: "wrap", justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { color: colors.muted, fontSize: 12.5 },
  sleepDream: { color: colors.text, fontSize: 16, lineHeight: 24, textAlign: "center", paddingHorizontal: 4 },
  sleepNote: { color: colors.faint, fontSize: 12.5, textAlign: "center" },
});
