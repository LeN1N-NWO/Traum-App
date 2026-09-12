import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { requestRecordingPermissionsAsync } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { Glass, GlassButton, PrimaryButton } from "@/components/glass";
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

type Answers = { name: string; goal: string; recall: string; lucid: string; sleepHours: string; timeBudget: string; themes: string[] };
const EMPTY: Answers = { name: "", goal: "", recall: "", lucid: "", sleepHours: "", timeBudget: "", themes: [] };

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

export function OnboardingFlow({ O, onDone }: { O: OnboardData; onDone: (answers: Answers) => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
  const [mic, setMic] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<boolean | null>(null);
  const [themeDraft, setThemeDraft] = useState("");

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((prev) => ({ ...prev, [k]: v }));
  // Ein zweiter Tipp nimmt die Antwort zurück — wie im Web-Formular.
  const pick = (k: keyof Answers, v: string) => { Haptics.selectionAsync(); set(k, (a[k] === v ? "" : v) as Answers[typeof k]); };

  const frage = (key: keyof Answers, title: string, values: string[], labels: Record<string, string>) => ({
    key, title,
    body: (
      <View style={styles.choices}>
        {values.map((v) => {
          const on = a[key] === v;
          return (
            <Pressable key={v} onPress={() => pick(key, v)} style={{ maxWidth: "100%" }}>
              <Glass style={[styles.choice, on && styles.choiceOn]} tint={on ? "rgba(140,192,255,0.28)" : undefined} interactive>
                <Text style={[styles.choiceText, on && styles.choiceTextOn]}>{labels[v] ?? v}</Text>
              </Glass>
            </Pressable>
          );
        })}
      </View>
    ),
  });

  /* Die Bildschirme in der Reihenfolge, in der sie kommen. Intro und
     Feature-Kacheln tragen ihren eigenen Knopf, die Fragen den gemeinsamen
     „Weiter" unten. */
  const fragen = [
    frage("goal", O.formGoal, O.values.goal.order, O.values.goal.labels),
    frage("recall", O.formRecall, O.values.recall.order, O.values.recall.labels),
    frage("lucid", O.formLucid, O.values.lucid.order, O.values.lucid.labels),
    frage("sleepHours", O.formSleep, O.values.sleepHours.order, O.values.sleepHours.labels),
    frage("timeBudget", O.formTime, O.values.timeBudget.order, O.values.timeBudget.labels),
  ];
  const total = 4 + fragen.length + 2;     // Intro, Features, Fragen, Name, Schlafjahre, Themen, Schluss

  function next() { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep((s) => s + 1); }
  function finish() { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDone(a); }

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

  // ── 0: Intro mit App-Namen (Platzhalter für Antons Video)
  if (step === 0) return <Intro O={O} onNext={next} />;

  // ── 1: Was die App macht, als Glas-Kacheln
  if (step === 1) {
    return (
      <Shell insets={insets} step={step} total={total} title={O.featuresTitle} onSkip={finish} skipLabel={O.skip}>
        <View style={styles.cards}>
          {O.features.map((f, i) => (
            <Animated.View key={f.title} entering={FadeInDown.delay(80 * i).duration(320)} style={{ width: "100%" }}>
              <Glass style={styles.card}>
                <View style={styles.cardIcon}><SymbolView name={ICONS[i] ?? "sparkles"} size={20} tintColor={colors.accentSoft} /></View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.cardTitle}>{f.title}</Text>
                  <Text style={styles.cardText}>{f.text}</Text>
                </View>
              </Glass>
            </Animated.View>
          ))}
        </View>
        <PrimaryButton label={O.next} heavy onPress={next} style={{ flex: 0 }} />
      </Shell>
    );
  }

  // ── 2: Die Berechtigungen, ganz am Anfang (Antons Regel)
  if (step === 2) {
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
      <Shell insets={insets} step={step} total={total} title={O.askTitle} lede={O.askText} onSkip={finish} skipLabel={O.skip}>
        <View style={{ gap: 10, width: "100%" }}>
          {row(O.askMic, O.askMicWhy, mic, askMic, "mic.fill")}
          {row(O.askPhotos, O.askPhotosWhy, photos, askPhotos, "photo.on.rectangle")}
        </View>
        <PrimaryButton label={O.next} onPress={next} style={{ flex: 0 }} />
      </Shell>
    );
  }

  // ── 3: Der Name
  if (step === 3) {
    return (
      <Shell insets={insets} step={step} total={total} title={O.formName} onSkip={finish} skipLabel={O.skip}>
        <TextInput
          style={styles.input} value={a.name} onChangeText={(v) => set("name", v.slice(0, 40))}
          placeholder={O.formNamePlaceholder} placeholderTextColor={colors.faint}
          autoCapitalize="words" keyboardAppearance="dark" returnKeyType="done" onSubmitEditing={next} autoFocus
        />
        <PrimaryButton label={O.next} onPress={next} style={{ flex: 0 }} />
      </Shell>
    );
  }

  // ── 4 … 8: eine Frage je Bildschirm
  const fragenStart = 4;
  if (step >= fragenStart && step < fragenStart + fragen.length) {
    const f = fragen[step - fragenStart];
    /* Nach der Schlaf-Frage kommt der Aufschlag: erst antworten, dann die
       Jahre sehen. Deshalb liegt der Zähler hinter dieser Frage. */
    return (
      <Shell key={f.key} insets={insets} step={step} total={total} title={f.title} onSkip={finish} skipLabel={O.skip}>
        {f.body}
        <PrimaryButton label={O.next} onPress={next} style={{ flex: 0 }} />
      </Shell>
    );
  }

  // ── 9: Die Jahre im Schlaf (Antons Opal-Vorbild)
  if (step === fragenStart + fragen.length) {
    return <SleepYears O={O} answer={a.sleepHours} insets={insets} step={step} total={total} onNext={next} onSkip={finish} />;
  }

  // ── 10: Die wiederkehrenden Themen
  if (step === fragenStart + fragen.length + 1) {
    const add = () => {
      const clean = themeDraft.trim();
      if (!clean || a.themes.includes(clean) || a.themes.length >= 12) { setThemeDraft(""); return; }
      Haptics.selectionAsync();
      set("themes", [...a.themes, clean.slice(0, 60)]);
      setThemeDraft("");
    };
    return (
      <Shell insets={insets} step={step} total={total} title={O.formThemes} onSkip={finish} skipLabel={O.skip}>
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

  // ── 11: Schluss
  return (
    <Shell insets={insets} step={step} total={total} title={O.doneTitle} lede={O.doneText}>
      <View style={{ alignItems: "center", paddingVertical: 20 }}>
        <SymbolView name="moon.stars.fill" size={72} tintColor={colors.gold} />
      </View>
      <PrimaryButton label={O.doneCta} heavy onPress={finish} style={{ flex: 0 }} />
    </Shell>
  );
}

/* Der Rahmen jeder Frage: Fortschritt oben, Überspringen rechts, Titel in
   der Serife, darunter der Inhalt, unten der Knopf. */
function Shell({ insets, step, total, title, lede, children, onSkip, skipLabel }: { insets: { top: number; bottom: number }; step: number; total: number; title: string; lede?: string; children: React.ReactNode; onSkip?: () => void; skipLabel?: string }) {
  return (
    <View style={styles.screen}>
      <LinearGradient colors={["rgba(42,98,208,0.28)", "rgba(5,10,20,0)"]} style={styles.glow} pointerEvents="none" />
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <View style={styles.progress}>
          {Array.from({ length: total }, (_, i) => <View key={i} style={[styles.pip, i <= step && styles.pipOn]} />)}
        </View>
        {onSkip ? <Pressable onPress={onSkip} hitSlop={10}><Text style={styles.skip}>{skipLabel}</Text></Pressable> : <View style={{ width: 60 }} />}
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
      <View style={[styles.introBody, { paddingBottom: insets.bottom + 28, paddingTop: insets.top + 20 }]}>
        <Animated.View style={[{ alignItems: "center", gap: 8 }, name]}>
          <Text style={styles.kicker}>{O.introKicker}</Text>
          <Text style={styles.brand}>Dream Rushes</Text>
          <Text style={styles.introText}>{O.introText}</Text>
        </Animated.View>
        <PrimaryButton label={O.introCta} heavy onPress={onNext} style={{ flex: 0 }} />
      </View>
    </Animated.View>
  );
}

/* Die Jahre im Schlaf: die Zahl zählt hoch, dann steht der Satz darunter. */
function SleepYears({ O, answer, insets, step, total, onNext, onSkip }: { O: OnboardData; answer: string; insets: { top: number; bottom: number }; step: number; total: number; onNext: () => void; onSkip: () => void }) {
  const ziel = sleepYears(answer);
  const [n, setN] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    let i = 0;
    timer.current = setInterval(() => {
      i += Math.max(1, Math.round(ziel / 24));
      if (i >= ziel) { i = ziel; if (timer.current) clearInterval(timer.current); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
      setN(i);
    }, 45);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [ziel]);
  return (
    <Shell insets={insets} step={step} total={total} title={O.sleepTitle} onSkip={onSkip} skipLabel={O.skip}>
      <View style={{ alignItems: "center", gap: 6, paddingVertical: 10 }}>
        <Text style={styles.bigYears}>{O.sleepYears(n)}</Text>
        <Text style={styles.bigAsleep}>{O.sleepAsleep}</Text>
        <Text style={styles.sleepDream}>{O.sleepDream(dreamYears(answer))}</Text>
        <Text style={styles.sleepNote}>{O.sleepNote}</Text>
      </View>
      <PrimaryButton label={O.next} onPress={onNext} style={{ flex: 0 }} />
    </Shell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  glow: { position: "absolute", left: -40, right: -40, top: -60, height: 360 },
  top: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 6 },
  progress: { flex: 1, flexDirection: "row", gap: 4 },
  pip: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)" },
  pipOn: { backgroundColor: colors.accentSoft },
  skip: { color: colors.faint, fontSize: 14, width: 60, textAlign: "right" },
  body: { paddingHorizontal: 22, paddingTop: 18, gap: 18, flexGrow: 1 },
  title: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 38, color: colors.text },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  content: { flex: 1, justifyContent: "space-between", gap: 20 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  choice: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 999 },
  choiceOn: {},
  choiceText: { color: colors.text, fontSize: 15 },
  choiceTextOn: { color: colors.accentSoft, fontWeight: "600" },
  cards: { gap: 10, width: "100%" },
  card: { flexDirection: "row", gap: 14, padding: 16, borderRadius: radius.card, alignItems: "flex-start" },
  cardIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(140,192,255,0.12)" },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  cardText: { color: colors.muted, fontSize: 13.5, lineHeight: 19 },
  permit: { flexDirection: "row", gap: 14, padding: 16, borderRadius: radius.card, alignItems: "center" },
  permitBtn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999 },
  permitBtnText: { color: colors.text, fontSize: 14, fontWeight: "600" },
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
  bigYears: { fontFamily: fonts.serif, fontSize: 64, color: colors.gold, fontVariant: ["tabular-nums"] },
  bigAsleep: { color: colors.text, fontSize: 22, letterSpacing: 1, textTransform: "uppercase" },
  sleepDream: { color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: "center", marginTop: 14 },
  sleepNote: { color: colors.faint, fontSize: 12.5, textAlign: "center", marginTop: 6 },
});
