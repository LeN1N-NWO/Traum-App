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
import { Clip } from "@/components/preset-tile";
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

export function OnboardingFlow({ O, onDone }: { O: OnboardData; onDone: (answers: Answers) => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(() => (__DEV__ && typeof (globalThis as any).__ONB_STEP__ === "number" ? (globalThis as any).__ONB_STEP__ : 0));
  const [a, setA] = useState<Answers>(EMPTY);
  const [mic, setMic] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<boolean | null>(null);
  const [themeDraft, setThemeDraft] = useState("");

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
    | { kind: "sleepYears" } | { kind: "mascot" } | { kind: "themes" } | { kind: "done" };
  const screens: Screen[] = [{ kind: "intro" }, { kind: "features" }, { kind: "permits" }, { kind: "name" }];
  fragen.forEach((f, i) => {
    screens.push({ kind: "question", at: i });
    if (f.key === "sleepHours") screens.push({ kind: "sleepYears" });
    else screens.push({ kind: "showcase", at: i > 3 ? i - 1 : i });
  });
  screens.push({ kind: "mascot" }, { kind: "themes" }, { kind: "done" });
  const total = screens.length;
  const jetzt = screens[Math.min(step, total - 1)];

  function back() { Haptics.selectionAsync(); setStep((s: number) => Math.max(0, s - 1)); }
  function next() { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep((s: number) => s + 1); }
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

  // ── Intro mit App-Namen (Platzhalter für Antons Video)
  if (jetzt.kind === "intro") return <Intro O={O} onNext={next} />;

  // ── Was die App macht, als Glas-Kacheln mit laufenden Filmen
  if (jetzt.kind === "features") {
    return (
      <Shell insets={insets} step={step} total={total} title={O.featuresTitle} onSkip={finish} skipLabel={O.skip} onBack={step > 0 ? back : undefined}>
        {/* Vier Kacheln im Glas, in denen die Traum-Clips laufen — Antons
            Vorbild (Moonly). Die Filme sind erst mal die Vorschau-Clips der
            Stile; jede Kachel trägt ihr Etikett wie dort. */}
        <View style={styles.tiles}>
          {O.features.map((f, i) => (
            <Animated.View key={f.title} entering={FadeInDown.delay(70 * i).duration(320)} style={[styles.tileCell, i % 3 === 1 && styles.tileTall]}>
              <View style={styles.tileClip}>
                {O.clips[i % Math.max(1, O.clips.length)] ? <Clip url={O.clips[i % O.clips.length]} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]} />}
                <LinearGradient colors={["rgba(5,10,20,0.45)", "rgba(5,10,20,0)", "rgba(5,10,20,0.8)"]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
                <View style={styles.tileBadge}>
                  <Glass style={styles.tileBadgeGlass}>
                    <SymbolView name={ICONS[i] ?? "sparkles"} size={12} tintColor={colors.accentSoft} />
                    <Text style={styles.tileBadgeText} numberOfLines={1}>{f.title}</Text>
                  </Glass>
                </View>
                <Text style={styles.tileFoot} numberOfLines={3}>{f.text}</Text>
              </View>
            </Animated.View>
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
      <Shell insets={insets} step={step} total={total} title={O.askTitle} lede={O.askText} onSkip={finish} skipLabel={O.skip} onBack={step > 0 ? back : undefined}>
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
      <Shell insets={insets} step={step} total={total} title={O.formName} onSkip={finish} skipLabel={O.skip} onBack={step > 0 ? back : undefined}>
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
      <Shell key={f.key} insets={insets} step={step} total={total} title={f.title} onSkip={finish} skipLabel={O.skip} onBack={step > 0 ? back : undefined}>
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
    const clip = O.clips.length ? O.clips[(jetzt.at + 1) % O.clips.length] : null;
    return <Showcase O={O} title={sc?.title ?? ""} text={sc?.text ?? ""} clip={clip} insets={insets} step={step} total={total} onNext={next} onBack={back} onSkip={finish} />;
  }

  // ── Die Jahre im Schlaf (Antons Opal-Vorbild) — direkt nach der Schlaf-Frage
  if (jetzt.kind === "sleepYears") {
    return <SleepYears O={O} answer={a.sleepHours} insets={insets} step={step} total={total} onNext={next} onSkip={finish} onBack={back} />;
  }

  /* ── Die Maskottchen-Wahl. ⚠ Zwei von drei sind Platzhalter (mascots.js);
     die Kachel sagt das auch, damit niemand eine Zeichnung erwartet, die
     es noch nicht gibt (Antons Ansage 13.09.). */
  if (jetzt.kind === "mascot") {
    const gewaehlt = a.mascot || O.mascot;
    return (
      <Shell insets={insets} step={step} total={total} title={O.mascotTitle} lede={O.mascotText} onSkip={finish} skipLabel={O.skip} onBack={back}>
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
      <Shell insets={insets} step={step} total={total} title={O.formThemes} onSkip={finish} skipLabel={O.skip} onBack={step > 0 ? back : undefined}>
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

/* Der Rahmen jeder Frage: Fortschritt oben, Überspringen rechts, Titel in
   der Serife, darunter der Inhalt, unten der Knopf. */
function Shell({ insets, step, total, title, lede, children, onSkip, skipLabel, onBack }: { insets: { top: number; bottom: number }; step: number; total: number; title: string; lede?: string; children: React.ReactNode; onSkip?: () => void; skipLabel?: string; onBack?: () => void }) {
  return (
    <View style={styles.screen}>
      <LinearGradient colors={["rgba(42,98,208,0.28)", "rgba(5,10,20,0)"]} style={styles.glow} pointerEvents="none" />
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        {/* Überspringen ÜBER dem Fortschritt: neben ihm brach das Wort um
            (Befund 13.09. am Screenshot). */}
        <View style={styles.skipRow}>
          {/* Zurück: nur ein Pfeil, kein Text (Antons Wunsch 13.09.). */}
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Back">
              <SymbolView name="chevron.left" size={17} tintColor={colors.text} weight="semibold" />
            </Pressable>
          ) : <View style={{ width: 17 }} />}
          {/* „Überspringen" bleibt vorerst — Antons Ansage: in der
              Dev-Fassung noch drin, später raus. */}
          {onSkip ? <Pressable onPress={onSkip} hitSlop={12}><Text style={styles.skip}>{skipLabel}</Text></Pressable> : null}
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
function MascotFace({ id }: { id: string }) {
  if (id === "sloth") {
    const player = useVideoPlayer(require("../../../src/assets/home-faultier.mp4"), (p) => { p.loop = true; p.muted = true; p.play(); });
    return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
  }
  if (id === "frog") {
    const player = useVideoPlayer(require("../../../src/assets/mascot-frog-idle.mp4"), (p) => { p.loop = true; p.muted = true; p.play(); });
    return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
  }
  return <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: colors.sky }]}><SymbolView name="moon.stars" size={26} tintColor={colors.accentSoft} /></View>;
}

/* Das Zwischenbild: ein Film über die ganze Fläche, ein Satz darüber,
   weiter. Nach jeder Frage eines — es macht Lust auf die App, statt nur zu
   fragen (Antons Wunsch 13.09.). Die Clips sind vorerst die Vorschau-Filme
   der Stile; eigene kommen später. */
function Showcase({ O, title, text, clip, insets, step, total, onNext, onBack, onSkip }: { O: OnboardData; title: string; text: string; clip: string | null; insets: { top: number; bottom: number }; step: number; total: number; onNext: () => void; onBack: () => void; onSkip: () => void }) {
  return (
    <View style={styles.screen}>
      {clip ? <Clip url={clip} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]} />}
      <LinearGradient colors={["rgba(5,10,20,0.8)", "rgba(5,10,20,0.25)", "rgba(5,10,20,0.9)"]} locations={[0, 0.42, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <View style={styles.skipRow}>
          <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Back">
            <SymbolView name="chevron.left" size={17} tintColor={colors.text} weight="semibold" />
          </Pressable>
          <Pressable onPress={onSkip} hitSlop={12}><Text style={styles.skip}>{O.skip}</Text></Pressable>
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

/* Die Jahre im Schlaf: die Zahl zählt hoch, dann steht der Satz darunter. */
function SleepYears({ O, answer, insets, step, total, onNext, onSkip, onBack }: { O: OnboardData; answer: string; insets: { top: number; bottom: number }; step: number; total: number; onNext: () => void; onSkip: () => void; onBack: () => void }) {
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
    <Shell insets={insets} step={step} total={total} title={O.sleepTitle} onSkip={onSkip} skipLabel={O.skip} onBack={onBack}>
      <View style={{ alignItems: "center", gap: 4, paddingTop: 30 }}>
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
  top: { paddingHorizontal: 20, paddingBottom: 6, gap: 8 },
  skipRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 22 },
  progress: { flex: 1, flexDirection: "row", gap: 4 },
  pip: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)" },
  pipOn: { backgroundColor: colors.accentSoft },
  skip: { color: colors.faint, fontSize: 14 },
  body: { paddingHorizontal: 22, paddingTop: 18, gap: 18, flexGrow: 1 },
  title: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 38, color: colors.text },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 22 },
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
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10, width: "100%" },
  tileCell: { width: "48%", flexGrow: 1, height: 190 },
  tileTall: { height: 230 },
  tileClip: { flex: 1, borderRadius: 22, overflow: "hidden", backgroundColor: colors.bg2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  tileBadge: { position: "absolute", top: 8, left: 8, right: 8 },
  tileBadgeGlass: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999, alignSelf: "flex-start", maxWidth: "100%" },
  tileBadgeText: { color: colors.text, fontSize: 11.5, fontWeight: "600" },
  tileFoot: { position: "absolute", left: 10, right: 10, bottom: 9, color: colors.text, fontSize: 11.5, lineHeight: 15 },
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
  showBody: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 24, gap: 22 },
  showTitle: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.text },
  showText: { color: colors.muted, fontSize: 15.5, lineHeight: 22 },
  bigYears: { fontFamily: fonts.serif, fontSize: 64, color: colors.gold, fontVariant: ["tabular-nums"] },
  bigAsleep: { color: colors.text, fontSize: 22, letterSpacing: 1, textTransform: "uppercase" },
  sleepDream: { color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: "center", marginTop: 14 },
  sleepNote: { color: colors.faint, fontSize: 12.5, textAlign: "center", marginTop: 6 },
});
