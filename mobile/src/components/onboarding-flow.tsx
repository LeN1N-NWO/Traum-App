import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import { requestRecordingPermissionsAsync } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Moon } from "@/components/moon-strip";
import { Clip } from "@/components/preset-tile";
import { clipSource } from "@/lib/style-clips";
import { Glass, GlassButton, PrimaryButton } from "@/components/glass";
import { login, loginWithApple, register, requestReset, resetPassword, useAccount, type LoginResult, type ResetFailure, type ResetResult, type SignupResult } from "@/lib/auth";
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

/* Die Erinnerungs-Antworten als Mondphasen: fast nie = Neumond-Sichel,
   jede Nacht = Vollmond. */
const RECALL_MOON: Record<string, number> = { nightly: 1, weekly: 0.62, rarely: 0.3, "almost-never": 0.07 };

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

  /* Die Fragen, seit 27.09. je mit eigener Form (Antons Wahl aus dem
     Variantenbuch; vorher ein Raster gleicher Glas-Kacheln für alles):
       · Warum hier — „Große Worte": die Antworten als Serifen-Zeilen, blass
         bis man sie antippt, ein goldener Punkt markiert die Wahl;
       · Erinnerung — „Mondphasen": eine Zeile je Antwort, vorn der echte
         Mond (derselbe wie im Mond-Streifen), der mit der Antwort zunimmt;
       · Schlafdauer — „Nachtskala": eigener Bildschirm, siehe SleepScale.
     Klarträume, Zeitbudget und die Begleiter-Wahl sind raus (Antons Ansage
     27.09.: „sinnlos", das Onboarding war zu lang). Die Profilfelder
     bleiben — wer sie früher beantwortet hat, behält sie. */
  const fragen = [
    {
      key: "goals" as const, title: O.formGoal, answered: a.goals.length > 0,
      body: (
        <View style={styles.words}>
          {O.values.goal.order.map((v) => {
            const on = a.goals.includes(v);
            return (
              <Pressable key={v} onPress={() => toggleGoal(v)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={styles.wordRow}>
                <View style={[styles.wordDot, on && styles.wordDotOn]} />
                <Text style={[styles.word, on && styles.wordOn]}>{O.goalWords?.[v] ?? O.values.goal.labels[v] ?? v}</Text>
              </Pressable>
            );
          })}
          <Text style={styles.wordHint}>{O.goalHint}</Text>
        </View>
      ),
    },
    {
      key: "recall" as const, title: O.formRecall, answered: !!a.recall,
      body: (
        <View style={{ gap: 10 }}>
          {O.values.recall.order.map((v) => {
            const on = a.recall === v;
            return (
              <Pressable key={v} onPress={() => pick("recall", v)} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                <View style={[styles.phaseRow, on && styles.phaseRowOn]}>
                  <View style={{ opacity: on ? 1 : 0.6 }}><Moon illum={RECALL_MOON[v] ?? 0.5} waxing size={30} /></View>
                  <Text style={[styles.phaseText, on && { color: colors.text }]}>{O.values.recall.labels[v] ?? v}</Text>
                  {on ? <SymbolView name="checkmark" size={15} tintColor={colors.gold} weight="semibold" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ),
    },
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
  fragen.forEach((_, i) => {
    screens.push({ kind: "question", at: i }, { kind: "showcase", at: i });
    /* Nach dem Zwischenbild „Die Menschen darin sind deine" (at 1) das
       eigene Foto (Antons Platzwahl 13.09.): erst sehen, dass man
       mitspielt, dann das Gesicht geben. */
    if (i === 1) screens.push({ kind: "me" });
  });
  /* Schlafdauer und Jahre-Rechnung auf EINEM Bildschirm (Antons Wunsch
     27.09.): Der Mond ist ein Regler, die Zahlen darunter rechnen live mit. */
  screens.push({ kind: "sleepYears" });
  /* Die Anmeldung GANZ AM ENDE (Antons Platzwahl 13.09.): Wer bis hierher
     geantwortet hat, sichert das Ergebnis — nicht umgekehrt. Am Anfang
     schreckt sie ab, beim Kauf ist sie zu spät.
     Die Begleiter-Wahl ist raus (Antons Ansage 27.09.): In der ersten
     Fassung gibt es nur den Frosch (DEFAULT_MASCOT); die Wahl kommt später
     wieder, der Bildschirm „mascot" unten bleibt dafür stehen. */
  /* „Anything that keeps coming back?" ist raus (Antons Ansage 27.09.) —
     die Themen erkennt der Atlas später von selbst aus den Träumen. */
  screens.push({ kind: "account" }, { kind: "done" });
  /* Nur die Fragen (Profil → „Umfrage", seit 13.09. nativ statt der
     Web-Umfrage): Name, die drei Fragen samt Jahre-Kreis, Themen, Schluss —
     ohne Intro, Berechtigungen, Zwischenbilder, Foto, Begleiter, Anmeldung. */
  const shown = questionsOnly ? screens.filter((x) => ["name", "question", "sleepYears", "themes", "done"].includes(x.kind)) : screens;
  const total = shown.length;
  const jetzt = shown[Math.min(step, total - 1)];
  // Nur Entwicklung: DevSkip (unten) springt von hier zum Anmelde-Schritt.
  // Im Effekt, nicht beim Rendern — sonst ließe der React Compiler die ganze
  // Komponente unoptimiert, auch im Release-Bau. Die Profil-Umfrage
  // (questionsOnly) hat keinen Anmelde-Schritt: dort weder Sprung noch Knopf.
  const accountAt = shown.findIndex((x) => x.kind === "account");
  useEffect(() => {
    if (!__DEV__ || accountAt < 0) return;
    (globalThis as any).__onbSkipToAccount = () => setStep(accountAt);
    return () => { delete (globalThis as any).__onbSkipToAccount; };
  }, [accountAt]);

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
        {/* Die Proof-Zeile (Antons Ansage 13.09.: „erst mal fake, technisch")
            ist seit 23.09. LEER — Platzhalter wie „Reviews to come" und eine
            Auszeichnung, die es nicht gibt, lehnt App Review ab (2.1/2.3,
            docs/plans/2026-09-23-app-store-pruefung.md N2). Echte Bewertungen
            oder Auszeichnungen kommen in `proof` (en/de), dann erscheint sie. */}
        {O.proof.length ? <View style={styles.proofRow}>
          {O.proof.map((pr, i) => (
            <View key={i} style={styles.proof}>
              {/* Kleiner (Antons Befund 13.09. abends: ragten aus dem Bild). */}
              <SymbolView name="laurel.leading" size={20} tintColor={colors.muted} />
              <View style={{ alignItems: "center", gap: 1, flexShrink: 1 }}>
                <Text style={styles.proofBig} numberOfLines={1} adjustsFontSizeToFit>{pr.big}</Text>
                <Text style={styles.proofSmall} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{pr.small}</Text>
              </View>
              <SymbolView name="laurel.trailing" size={20} tintColor={colors.muted} />
            </View>
          ))}
        </View> : null}
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
      <Shell insets={insets} step={step} total={total} title={O.formName} onBack={step > 0 || onExit ? back : undefined} devSkip={!questionsOnly}>
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
      <Shell key={f.key} insets={insets} step={step} total={total} title={f.title} onBack={step > 0 || onExit ? back : undefined} devSkip={!questionsOnly}>
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

  // ── Schlafdauer als Mond-Regler, darunter die Jahre live (27.09.)
  if (jetzt.kind === "sleepYears") {
    return <SleepScale O={O} answer={a.sleepHours} onAnswer={(k) => set("sleepHours", k)} insets={insets} step={step} total={total} onNext={next} onBack={back} devSkip={!questionsOnly} />;
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
          {/* Die Wahl ist die Bestätigung (13.09.2026) — klein, aber da. */}
          <Text style={styles.later}>{O.meConsent}</Text>
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
      <Shell insets={insets} step={step} total={total} title={O.formThemes} onBack={step > 0 || onExit ? back : undefined} devSkip={!questionsOnly}>
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

  /* ── Schluss: ein Film über die ganze Fläche (Antons Ansage 27.09.).
     ⚠ PLATZHALTER — bis Antons eigenes Hintergrundvideo da ist, läuft hier
     der erste Stil-Clip. Tauscht er es, ändert sich nur `DONE_CLIP`. */
  const DONE_CLIP = O.clips[0] ?? null;
  return (
    <View style={styles.screen}>
      {DONE_CLIP ? <Clip url={DONE_CLIP} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]} />}
      <LinearGradient colors={["rgba(5,10,20,0.55)", "rgba(5,10,20,0.1)", "rgba(5,10,20,0.95)"]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <View style={styles.skipRow}>
          <Pressable onPress={back} hitSlop={12} accessibilityLabel="Back">
            <SymbolView name="chevron.left" size={17} tintColor={colors.text} weight="semibold" />
          </Pressable>
        </View>
      </View>
      <View style={[styles.showBody, { paddingBottom: insets.bottom + 26 }]}>
        <Animated.View entering={FadeInDown.duration(420)} style={{ gap: 8, alignItems: "center" }}>
          <Text style={[styles.showTitle, { textAlign: "center" }]}>{O.doneTitle}</Text>
          <Text style={[styles.showText, { textAlign: "center" }]}>{O.doneText}</Text>
        </Animated.View>
        <PrimaryButton label={O.doneCta} heavy onPress={finish} style={{ flex: 0 }} />
      </View>
    </View>
  );
}

/* Die Anmeldung: E-Mail, Passwort, „Anmelden" — oder, umgeschaltet, „Konto
   anlegen" (03.10.2026). Nach dem Anlegen kommt eine Bestätigungsmail von
   Supabase; erst nach dem Klick darauf geht die Anmeldung, deshalb springt
   das Formular dann zurück auf „Anmelden" und zeigt „Schau in dein
   Postfach". „Passwort vergessen?" schickt einen Code per Mail; Code und
   neues Passwort melden dann direkt an (forgot → reset). Ohne Konto
   geht es mit „Später" weiter — das Tagebuch lebt auf dem Gerät, das
   Konto ist die Sicherung, nicht die Bedingung.
   Die Token gehen in den Schlüsselbund (lib/auth.ts), nie in den Zustand. */
export function Account({ O, insets, step, total, onNext, onBack }: { O: OnboardData; insets: { top: number; bottom: number }; step: number; total: number; onNext: () => void; onBack: () => void }) {
  const account = useAccount();
  const [mail, setMail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [fail, setFail] = useState<ResetFailure | null>(null);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "reset">("signin");
  /* The card above the fields: which mail went where (confirmation link or reset code). */
  const [sent, setSent] = useState<{ to: string; text: string } | null>(null);
  /* No button on Android or the web: Apple's sheet is missing there, and a
     button that cannot open anything is worse than none. Starts true on iOS
     (available from iOS 13 on) so the layout does not jump when the check lands. */
  const [appleReady, setAppleReady] = useState(Platform.OS === "ios");
  useEffect(() => { AppleAuthentication.isAvailableAsync().then(setAppleReady).catch(() => setAppleReady(false)); }, []);
  const pwRef = useRef<TextInput>(null);
  const mailOk = /\S+@\S+\.\S+/.test(mail.trim());
  const ready = !busy && mailOk && (mode === "forgot"
    || (pw.length >= 6 && (mode !== "reset" || /^\d{6,10}$/.test(code.trim()))));

  /* Both ways in end here. `busy` is released in `finally`, so no throw can
     leave the form spinning for good. `null` means the person cancelled. */
  async function signIn(attempt: () => Promise<LoginResult | SignupResult | ResetResult | { ok: true } | null>) {
    setBusy(true); setFail(null);
    try {
      const r = await attempt();
      if (!r) return;
      if (r.ok && "confirm" in r) {
        /* Account made, not usable yet: the link in the mail comes first. */
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSent({ to: mail.trim(), text: O.accountCheckMailText }); setMode("signin"); setPw("");
      } else if (r.ok && !("user" in r)) {
        /* Reset code is on its way: now code + new password. */
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSent({ to: mail.trim(), text: O.accountCodeSent }); setMode("reset"); setPw(""); setCode("");
      } else if (r.ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setPw(""); setCode(""); }
      else { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); setFail(r.why); }
    } catch {
      setFail("unavailable");
    } finally {
      setBusy(false);
    }
  }

  const go = () => {
    if (!ready) return;
    signIn(() => (mode === "signup" ? register(mail, pw)
      : mode === "forgot" ? requestReset(mail)
      : mode === "reset" ? resetPassword(mail, code, pw)
      : login(mail, pw)));
  };
  const switchTo = (next: typeof mode) => { setMode(next); setFail(null); setSent(null); setPw(""); setCode(""); };
  const cta = mode === "signup" ? O.accountCreateCta : mode === "forgot" ? O.accountSendCode
    : mode === "reset" ? O.accountSetPassword : O.accountCta;

  /* Sign in with Apple needs no account beforehand — Apple has vouched for the
     person, Supabase creates them if they are new.
     ⚠ Apple gets the HASH of the nonce, our server the raw value: Supabase
     hashes it itself and compares. Two different values on purpose — see
     lib/auth.ts. */
  const goApple = () => signIn(async (): Promise<LoginResult | null> => {
    const nonce = [...Crypto.getRandomBytes(32)].map((b) => b.toString(16).padStart(2, "0")).join("");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce),
      });
      if (!credential.identityToken) return { ok: false, why: "unavailable" };
      return loginWithApple(credential.identityToken, nonce, credential.email);
    } catch (e) {
      if ((e as { code?: string })?.code === "ERR_REQUEST_CANCELED") return null;
      throw e;
    }
  });
  const reason: Record<ResetFailure, string> = {
    wrong: O.accountWrong, busy: O.accountBusy, unavailable: O.accountUnavailable, offline: O.accountOffline,
    weak: O.accountWeak, invalid: O.accountInvalid, exists: O.accountExists, code: O.accountBadCode,
  };

  return (
    <Shell insets={insets} step={step} total={total} title={O.accountTitle} lede={O.accountText} onBack={onBack} devSkip={false}>
      {account ? (
        <Animated.View entering={FadeIn.duration(260)} style={{ width: "100%", gap: 14 }}>
          <Glass style={styles.signedIn}>
            <SymbolView name="checkmark.seal.fill" size={26} tintColor={colors.ok} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.cardText}>{account.email ? O.accountSignedIn : O.accountSignedInNoEmail}</Text>
              {account.email ? <Text style={styles.cardTitle} numberOfLines={1}>{account.email}</Text> : null}
            </View>
          </Glass>
          <PrimaryButton label={O.next} heavy onPress={onNext} style={{ flex: 0 }} />
        </Animated.View>
      ) : (
        <View style={{ width: "100%", gap: 10 }}>
          {sent ? (
            <Animated.View entering={FadeIn.duration(260)}>
              <Glass style={styles.signedIn}>
                <SymbolView name="envelope.badge" size={26} tintColor={colors.ok} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.cardTitle}>{O.accountCheckMail}</Text>
                  <Text style={styles.cardText}>{sent.text}</Text>
                  <Text style={styles.cardText} numberOfLines={1}>{sent.to}</Text>
                </View>
              </Glass>
            </Animated.View>
          ) : null}
          {/* Die Felder im Glas, wie die Antwort-Kacheln — ein Bildschirm,
              ein Material. Fehler stehen UNTER den Feldern, in Worten. */}
          <Glass style={styles.field} interactive>
            <SymbolView name="envelope" size={17} tintColor={colors.faint} />
            <TextInput
              style={styles.fieldInput} value={mail} onChangeText={(v) => { setMail(v); setFail(null); }}
              placeholder={O.accountEmail} placeholderTextColor={colors.faint}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email"
              keyboardAppearance="dark" returnKeyType={mode === "forgot" ? "go" : "next"}
              onSubmitEditing={() => (mode === "forgot" ? go() : pwRef.current?.focus())} editable={!busy}
            />
          </Glass>
          {mode === "reset" ? (
            <Glass style={styles.field} interactive>
              <SymbolView name="number" size={17} tintColor={colors.faint} />
              <TextInput
                style={styles.fieldInput} value={code} onChangeText={(v) => { setCode(v.replace(/\D/g, "")); setFail(null); }}
                placeholder={O.accountCode} placeholderTextColor={colors.faint}
                keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={10}
                keyboardAppearance="dark" editable={!busy}
              />
            </Glass>
          ) : null}
          {mode !== "forgot" ? (
            <Glass style={styles.field} interactive>
              <SymbolView name="key" size={17} tintColor={colors.faint} />
              <TextInput
                ref={pwRef} style={styles.fieldInput} value={pw} onChangeText={(v) => { setPw(v); setFail(null); }}
                placeholder={mode === "reset" ? O.accountNewPassword : O.accountPassword} placeholderTextColor={colors.faint}
                secureTextEntry
                textContentType={mode === "signin" ? "password" : "newPassword"}
                autoComplete={mode === "signin" ? "password" : "new-password"}
                keyboardAppearance="dark" returnKeyType="go" onSubmitEditing={go} editable={!busy}
              />
            </Glass>
          ) : null}
          {fail ? <Animated.Text entering={FadeIn.duration(200)} style={styles.fail}>{reason[fail]}</Animated.Text> : null}
          <View style={{ marginTop: 6 }}>
            {busy ? (
              <Glass style={styles.busy}><ActivityIndicator color={colors.text} /></Glass>
            ) : (
              <PrimaryButton label={cta} heavy onPress={go} disabled={!ready} style={{ flex: 0 }} />
            )}
          </View>
          {mode === "signin" ? (
            <Pressable onPress={() => { Haptics.selectionAsync(); switchTo("forgot"); }} hitSlop={10} disabled={busy} style={{ alignSelf: "center", paddingVertical: 6 }}>
              <Text style={styles.later}>{O.accountForgot}</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => { Haptics.selectionAsync(); switchTo(mode === "signin" ? "signup" : "signin"); }}
            hitSlop={10} disabled={busy} style={{ alignSelf: "center", paddingVertical: 6 }}
          >
            <Text style={styles.later}>{mode === "signin" ? O.accountToSignup : mode === "signup" ? O.accountToSignin : O.accountBackToSignin}</Text>
          </Pressable>
          {/* The second way in (since 15.09.2026): Apple's own sheet. Creates
              the account itself if there is none — no mail to confirm. Not
              while a password is being reset: one task per screen. */}
          {appleReady && (mode === "signin" || mode === "signup") ? (
            <Pressable
              style={({ pressed }) => [styles.apple, { opacity: busy ? 0.45 : pressed ? 0.7 : 1 }]}
              onPress={() => { Haptics.selectionAsync(); goApple(); }}
              disabled={busy}
            >
              <SymbolView name="apple.logo" size={16} tintColor={colors.text} />
              <Text style={styles.appleText}>{O.accountApple}</Text>
            </Pressable>
          ) : null}
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
  /* Das Etikett IN der Kachel, unten links über einem Schleier (Antons
     Befund 13.09. abends: „Textanordnung total out of place" — es saß halb
     auf der Kante). Eine Stelle für alle vier Kacheln. */
  void labelBottom;
  const badge = (
    <View style={styles.tileLabel} pointerEvents="none">
      <SymbolView name={ICONS[i] ?? "sparkles"} size={13} tintColor={colors.accentSoft} />
      <Text style={styles.tileLabelText} numberOfLines={2}>{title}</Text>
    </View>
  );
  return (
    <Animated.View entering={FadeInDown.delay(70 * i).duration(320)} style={[styles.tileCell, tall && styles.tileTall]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {box.w ? [ring(7, 0.10), ring(4, 0.22), ring(1.5, 1)] : null}
      <View style={styles.tileClip}>
        {clip ? <Clip url={clip} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]} />}
        <LinearGradient colors={["rgba(5,10,20,0)", "rgba(5,10,20,0)", "rgba(5,10,20,0.85)"]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
        {badge}
      </View>
    </Animated.View>
  );
}

/* Der Rahmen jeder Frage: Fortschritt oben, Überspringen rechts, Titel in
   der Serife, darunter der Inhalt, unten der Knopf. */
/* Nur in der Entwicklung (__DEV__): direkt unter „Continue" zum
   Anmelde-Schritt springen, statt jedes Mal das ganze Onboarding
   durchzutippen (Hanni, 03.10.2026). Im Release-Bau gibt es ihn nicht. */
function DevSkip() {
  if (!__DEV__) return null;
  return (
    <Pressable onPress={() => (globalThis as any).__onbSkipToAccount?.()} hitSlop={8} style={{ alignSelf: "center", paddingVertical: 8 }}>
      <Text style={{ color: colors.faint, fontSize: 13 }}>Skip to sign-in (dev)</Text>
    </Pressable>
  );
}

function Shell({ insets, step, total, title, lede, children, onBack, devSkip = true }: { insets: { top: number; bottom: number }; step: number; total: number; title: string; lede?: string; children: React.ReactNode; onBack?: () => void; devSkip?: boolean }) {
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
        <View style={styles.content}>{children}{devSkip ? <DevSkip /> : null}</View>
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
            <DevSkip />
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
        <DevSkip />
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

/* Schlafdauer als Nachtskala (Antons Wahl 27.09., Variantenbuch A3): Der
   echte Mond ist der Regler — man schiebt ihn in halben Stunden von 4½ bis
   10½, er nimmt dabei zu. Darunter rechnen vier Zahlen LIVE mit: Stunden
   Schlaf und Traum je Nacht, Jahre Schlaf und Traum in 80 Lebensjahren
   (ein Viertel der Schlafzeit ist REM). Ersetzt die eigene Seite mit dem
   Jahre-Kreis danach. Gespeichert wird wie bisher der Bereich
   (sleepHours: "7-8" …), damit der Traumbogen im Profil nichts merkt. */
const H_MIN = 4.5, H_MAX = 10.5, H_STEP = 0.5;
const STEPS = Math.round((H_MAX - H_MIN) / H_STEP);
const KNOB = 58;
function bucket(h: number) {
  return h < 6 ? "under-6" : h < 7 ? "6-7" : h < 8 ? "7-8" : h < 9 ? "8-9" : "over-9";
}
function SleepScale({ O, answer, onAnswer, insets, step, total, onNext, onBack, devSkip = true }: { O: OnboardData; answer: string; onAnswer: (key: string) => void; insets: { top: number; bottom: number }; step: number; total: number; onNext: () => void; onBack: () => void; devSkip?: boolean }) {
  const S = O.sleepScale;
  const [idx, setIdx] = useState(() => Math.round(((SLEEP_HOURS[answer] ?? 7.5) - H_MIN) / H_STEP));
  const [trackW, setTrackW] = useState(0);
  const span = Math.max(1, trackW - KNOB);
  const x = useSharedValue(0);
  const from = useSharedValue(0);
  const h = H_MIN + idx * H_STEP;
  useEffect(() => { onAnswer(bucket(h)); }, [h]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (trackW) x.value = (idx / STEPS) * span; }, [trackW]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (i: number) => { setIdx((cur) => { if (cur !== i) Haptics.selectionAsync(); return i; }); };
  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6]).failOffsetY([-14, 14])
    .onBegin(() => { from.value = x.value; })
    .onUpdate((e) => {
      x.value = Math.max(0, Math.min(span, from.value + e.translationX));
      runOnJS(choose)(Math.round((x.value / span) * STEPS));
    })
    .onFinalize(() => {
      const i = Math.round((x.value / span) * STEPS);
      x.value = withSpring((i / STEPS) * span, { damping: 18, stiffness: 180 });
    });
  const tap = Gesture.Tap().onEnd((e) => {
    const i = Math.max(0, Math.min(STEPS, Math.round(((e.x - KNOB / 2) / span) * STEPS)));
    x.value = withSpring((i / STEPS) * span, { damping: 18, stiffness: 180 });
    runOnJS(choose)(i);
  });
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fill = useAnimatedStyle(() => ({ width: x.value + KNOB / 2 }));

  const years = Math.round((h / 24) * LIFE_YEARS);
  const dreamY = Math.max(1, Math.round(years * 0.25));
  const num = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", S.decimal));
  const stats: [string, string][] = [
    [S.hours.replace("{n}", num(h)), S.perNight],
    [S.hours.replace("{n}", num(Math.round(h * 0.25 * 10) / 10)), S.dreaming],
    [O.sleepYears(years), S.yearsAsleep],
    [O.sleepYears(dreamY), S.yearsDreaming],
  ];
  return (
    <Shell insets={insets} step={step} total={total} title={O.formSleep} onBack={onBack}>
      <View style={{ gap: 26 }}>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={styles.scaleBig}>{S.hours.replace("{n}", num(h))}</Text>
          <Text style={styles.sleepNote}>{S.hint}</Text>
        </View>
        <GestureDetector gesture={Gesture.Simultaneous(pan, tap)}>
          <View style={styles.track} onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
            <View style={styles.rail} />
            <Animated.View style={[styles.railFill, fill]} />
            {Array.from({ length: STEPS + 1 }, (_, i) => (
              <View key={i} style={[styles.tick, { left: KNOB / 2 + (i / STEPS) * span - 0.5, height: i % 2 === 1 ? 10 : 5, opacity: i <= idx ? 0.8 : 0.3 }]} />
            ))}
            <Animated.View style={[styles.knob, knob]}>
              <Moon illum={0.15 + 0.85 * (idx / STEPS)} waxing size={KNOB} />
            </Animated.View>
          </View>
        </GestureDetector>
        <View style={styles.scaleEnds}><Text style={styles.sleepNote}>{S.short}</Text><Text style={styles.sleepNote}>{S.long}</Text></View>
        <View style={styles.stats}>
          {stats.map(([big, label], i) => (
            <View key={label} style={[styles.stat, i === 3 && { borderColor: "rgba(61,220,151,0.35)" }]}>
              <Text style={[styles.statBig, i % 2 === 1 && { color: colors.ok }]}>{big}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sleepDream}>{O.sleepDream(dreamY)}</Text>
        <Text style={styles.sleepNote}>{O.sleepNote}</Text>
      </View>
      <PrimaryButton label={O.next} onPress={onNext} style={{ flex: 0 }} />
      {devSkip ? <DevSkip /> : null}
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
  tileLabel: { position: "absolute", left: 14, right: 14, bottom: 13, flexDirection: "row", alignItems: "center", gap: 6 },
  tileLabelText: { flexShrink: 1, color: colors.text, fontSize: 13.5, lineHeight: 17, fontWeight: "700", textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  proofRow: { flexDirection: "row", justifyContent: "center", gap: 10, paddingTop: 4, paddingHorizontal: 4 },
  proof: { flexDirection: "row", alignItems: "center", gap: 2, flexShrink: 1 },
  proofBig: { color: colors.text, fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  proofSmall: { color: colors.faint, fontSize: 8, letterSpacing: 0.6, textTransform: "uppercase" },
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
  words: { gap: 4, paddingTop: 4 },
  wordRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  word: { flex: 1, fontFamily: fonts.serif, fontSize: 27, lineHeight: 33, color: "rgba(234,240,251,0.3)" },
  wordOn: { color: colors.text },
  wordDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, opacity: 0, transform: [{ scale: 0.3 }] },
  wordDotOn: { opacity: 1, transform: [{ scale: 1 }], shadowColor: colors.gold, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  wordHint: { color: colors.faint, fontSize: 13, marginTop: 10 },
  phaseRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  phaseRowOn: { borderWidth: 1, borderColor: "rgba(246,198,91,0.75)", backgroundColor: "rgba(246,198,91,0.07)", shadowColor: colors.gold, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  phaseText: { flex: 1, color: colors.muted, fontSize: 16.5 },
  scaleBig: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 46, color: colors.text, fontVariant: ["tabular-nums"] },
  track: { height: KNOB + 24, justifyContent: "center" },
  rail: { position: "absolute", left: KNOB / 2, right: KNOB / 2, height: 2, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  railFill: { position: "absolute", left: 0, height: 2, borderRadius: 1, backgroundColor: "rgba(246,198,91,0.7)" },
  tick: { position: "absolute", bottom: 0, width: 1, backgroundColor: colors.muted },
  knob: { position: "absolute", left: 0, width: KNOB, height: KNOB, borderRadius: KNOB / 2, shadowColor: "#ffd58f", shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  scaleEnds: { flexDirection: "row", justifyContent: "space-between", marginTop: -18 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "48%", flexGrow: 1, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, gap: 2 },
  statBig: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 31, color: colors.text, fontVariant: ["tabular-nums"] },
  statLabel: { color: colors.muted, fontSize: 12.5 },
  sleepDream: { color: colors.text, fontSize: 16, lineHeight: 24, textAlign: "center", paddingHorizontal: 4 },
  sleepNote: { color: colors.faint, fontSize: 12.5, textAlign: "center" },
});
