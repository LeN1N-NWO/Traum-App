import { Stack, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GlassButton, PrimaryButton } from "@/components/glass";
import { useJournal } from "@/components/journal-data";
import { NightSky } from "@/components/night-sky";
import { connectInvite, loadInvite, pendingCode, savePendingCode, type ConnectError, type InviteState, type Referral } from "@/lib/invites";
import { colors, fonts, radius, TAB_INSET } from "@/theme";
import { inviteLink } from "../../../../src/lib/invites.js";

/* Freunde einladen (Antons Ansage 03.10.2026): „Du willst einen Freund
 * einladen, und wenn der Freund Credits kauft … kriegst du einen Traum
 * geschenkt."
 *
 * Oben der eigene Code und „Einladung teilen" (iOS-Teilen-Blatt — WIR
 * verschicken nie etwas, BGH I ZR 208/12), darunter was es bringt, in
 * Träumen statt Credits, dann die eigenen Einladungen mit Status und unten
 * das Feld für einen fremden Code. Texte aus en.js/de.js über die Brücke,
 * Daten vom Server (lib/invites.ts) — bis Hannis Endpunkte da sind, als
 * markierte Vorschau. */
export default function InviteScreen() {
  const { data, bridge } = useJournal();
  const I = data?.invite;
  const params = useLocalSearchParams<{ code?: string }>();
  const [state, setState] = useState<InviteState | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: true } | { ok: false; why: ConnectError } | null>(null);

  const reload = useCallback(() => { loadInvite().then(setState); }, []);
  useEffect(() => { reload(); }, [reload]);
  // Ein Code aus einem Link steht schon im Feld — auch nach der Anmeldung noch.
  useEffect(() => {
    (async () => {
      const fromLink = params.code ? await savePendingCode(String(params.code)) : null;
      const code = fromLink ?? (await pendingCode());
      if (code) setInput(code);
    })();
  }, [params.code]);

  const d = state && (state.kind === "ready" || state.kind === "preview") ? state.data : null;
  const fill = (tpl: string, v: Record<string, string | number>) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
  const share = () => {
    if (!d || !I) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const link = inviteLink(d.code);
    Share.share({ message: fill(I.shareMessage, { link }), url: link }).catch(() => {});
  };
  const connect = async () => {
    if (!input.trim()) return;
    setBusy(true); setResult(null);
    const r = await connectInvite(input);
    setBusy(false); setResult(r);
    Haptics.notificationAsync(r.ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    if (r.ok) reload();
  };
  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(data?.language === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long" }) : "");
  const statusText = (r: Referral) => {
    if (!I) return "";
    if (r.status === "bought") return fill(I.status.bought, { date: date(r.rewardAt) });
    if (r.status === "rewarded") return fill(I.status.rewarded, { films: r.films === 1 ? I.films.one : fill(I.films.many, { n: r.films }) });
    return I.status[r.status];
  };

  return (
    <>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}><NightSky density={0.6} /></View>
      <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {I ? (
          <>
            <Animated.View entering={FadeInDown.duration(380)} style={styles.hero}>
              <SymbolView name="gift.fill" size={30} tintColor={colors.gold} />
              <Text style={styles.heroTitle}>{I.hero}</Text>
              <Text style={styles.lede}>{I.lede}</Text>
            </Animated.View>

            {/* Der eigene Code */}
            <View style={styles.card}>
              {state?.kind === "preview" ? <Text style={styles.preview}>{I.preview}</Text> : null}
              {!state ? <ActivityIndicator color={colors.gold} /> : null}
              {state?.kind === "signin" ? <Text style={styles.muted}>{I.signin}</Text> : null}
              {state?.kind === "offline" ? <Text style={styles.muted}>{I.errors.offline}</Text> : null}
              {d ? (
                <>
                  <Text style={styles.label}>{I.codeLabel}</Text>
                  <Text style={styles.code} selectable accessibilityLabel={d.code.split("").join(" ")}>{d.code}</Text>
                  <PrimaryButton label={I.share} heavy onPress={share} style={{ alignSelf: "stretch", flex: 0, marginTop: 6 }} />
                </>
              ) : null}
            </View>

            {/* Was es bringt — in Träumen */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{I.rewardsTitle}</Text>
              <View style={styles.rowHead}><Text style={styles.label}>{I.friendBuys}</Text><SymbolView name="gift" size={13} tintColor={colors.faint} /></View>
              {I.rewards.map((r) => (
                <View key={r.id} style={styles.row}>
                  <Text style={styles.rowL}>{r.label}</Text>
                  <Text style={styles.rowR}>🎁 {r.filmsText}</Text>
                </View>
              ))}
            </View>

            {/* Die eigenen Einladungen */}
            {d ? (
              <View style={styles.card}>
                <View style={styles.rowHead}>
                  <Text style={styles.cardTitle}>{I.friendsTitle}</Text>
                  <Text style={styles.cap}>{fill(I.cap, { n: d.rewardsThisMonth, cap: I.monthlyCap })}</Text>
                </View>
                {d.referrals.length === 0 ? <Text style={styles.muted}>{I.empty}</Text> : d.referrals.map((r) => (
                  <View key={r.id} style={styles.friend}>
                    <View style={[styles.dot, r.status === "rewarded" && styles.dotGold, r.status === "rejected" && { opacity: 0.4 }]}>
                      <Text style={styles.dotText}>{(r.name || "?").slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={styles.friendName}>{r.name || "—"}</Text>
                      <Text style={[styles.friendStatus, r.status === "rewarded" && { color: colors.gold }]}>{statusText(r)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Einen fremden Code verbinden */}
            {!d?.connected ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{I.haveCode}</Text>
                <View style={styles.inputRow}>
                  <TextInput value={input} onChangeText={(v) => { setInput(v); setResult(null); }} placeholder={I.codePlaceholder} placeholderTextColor={colors.faint}
                    autoCapitalize="characters" autoCorrect={false} style={styles.input} returnKeyType="done" onSubmitEditing={connect} />
                  {busy ? <ActivityIndicator color={colors.gold} /> : <GlassButton label={I.connect} onPress={connect} disabled={!input.trim()} />}
                </View>
                {result ? <Text style={[styles.result, { color: result.ok ? colors.ok : colors.bad }]}>{result.ok ? I.connected : I.errors[result.why]}</Text> : null}
              </View>
            ) : null}

            {/* Die Regeln, klein */}
            <View style={styles.rules}>
              {I.rules.map((r, i) => (
                <View key={i} style={styles.rule}><Text style={styles.ruleDot}>·</Text><Text style={styles.ruleText}>{r}</Text></View>
              ))}
            </View>
          </>
        ) : <ActivityIndicator color={colors.gold} style={{ marginTop: 80 }} />}
      </ScrollView>
      <Stack.Screen.Title large style={{ color: colors.text, fontFamily: fonts.serif }} largeStyle={{ color: colors.text, fontFamily: fonts.serif, fontSize: 34 }}>
        {I?.title ?? ""}
      </Stack.Screen.Title>
      <View style={{ height: 0, overflow: "hidden" }}>{bridge}</View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: TAB_INSET + 20, gap: 14 },
  hero: { alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 8 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32, color: colors.text, textAlign: "center" },
  lede: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  card: { padding: 16, gap: 10, borderRadius: radius.card, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine },
  cardTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.text },
  label: { color: colors.faint, fontSize: 11, letterSpacing: 1.6, fontWeight: "600", textTransform: "uppercase" },
  preview: { alignSelf: "flex-start", color: colors.bg, backgroundColor: colors.gold, fontSize: 11.5, fontWeight: "700", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, overflow: "hidden" },
  code: { fontSize: 38, letterSpacing: 8, color: colors.gold, fontWeight: "600", fontVariant: ["tabular-nums"], textAlign: "center", paddingVertical: 6 },
  rowHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.panelLine },
  rowL: { color: colors.text, fontSize: 15 },
  rowR: { color: colors.gold, fontSize: 15, fontWeight: "600" },
  cap: { color: colors.faint, fontSize: 12.5 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  friend: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: colors.sky },
  dotGold: { backgroundColor: "rgba(246,198,91,0.25)", borderWidth: 1, borderColor: colors.gold },
  dotText: { color: colors.text, fontFamily: fonts.serif, fontSize: 15 },
  friendName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  friendStatus: { color: colors.muted, fontSize: 13 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: { flex: 1, height: 46, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.panelLine, color: colors.text, fontSize: 17, letterSpacing: 2 },
  result: { fontSize: 14 },
  rules: { gap: 6, paddingHorizontal: 6 },
  rule: { flexDirection: "row", gap: 8 },
  ruleDot: { color: colors.faint, fontSize: 14 },
  ruleText: { flex: 1, color: colors.faint, fontSize: 13, lineHeight: 19 },
});
