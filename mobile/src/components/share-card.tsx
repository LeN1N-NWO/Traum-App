import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Share, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassButton, PrimaryButton } from "@/components/glass";
import { useThumbnail } from "@/components/dream-poster";
import { Moon } from "@/components/moon-strip";
import type { DreamItem } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Die Teilen-Karte (13.09.2026, Gratis-Feature §10 der Antworten): ein Traum
 * als Bild zum Weiterschicken — auch ohne Film. Titel, Mond der Nacht, das
 * Standbild aus dem Film (oder ein Nachthimmel), ein Satz aus dem Traum und
 * der Absender. Das ist der Wachstumskanal, solange wir keine Werbung
 * bezahlen: Jede geteilte Karte trägt den Namen der App.
 *
 * Aufgenommen wird die Karte selbst (react-native-view-shot, neu → Pods +
 * Rebuild), geteilt als PNG-Datei — dann bietet iOS „Bild sichern",
 * Nachrichten und AirDrop an. Die Karte ist 9:16, das Format der Stories. */

function firstSentence(text: string, max = 150) {
  const s = (String(text || "").match(/[^.!?…]+[.!?…]*/) || [""])[0].trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

export function ShareCard({ item, visible, onClose, labels, locale }: { item: DreamItem; visible: boolean; onClose: () => void; labels: Record<string, string>; locale: string }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const card = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const still = useThumbnail(item.media);
  // So groß wie möglich, aber mit Platz für die Knöpfe: 9:16 in den Bildschirm.
  const cardH = Math.min(height - insets.top - insets.bottom - 170, (width - 48) * (16 / 9));
  const cardW = cardH * (9 / 16);
  const date = new Date(item.createdAt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

  async function share() {
    if (!card.current || busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const uri = await captureRef(card, { format: "png", quality: 1, result: "tmpfile", width: 1080, height: 1920 });
      await Share.share({ url: uri });
    } catch (e) {
      console.warn("[share-card]", e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.stage}>
          <View ref={card} collapsable={false} style={[styles.card, { width: cardW, height: cardH }]}>
            {still ? <Image source={{ uri: still }} style={StyleSheet.absoluteFill} contentFit="cover" /> : (
              <LinearGradient colors={[colors.sky, "#0b1a33", colors.bg]} style={StyleSheet.absoluteFill} />
            )}
            <LinearGradient colors={["rgba(5,10,20,0.55)", "rgba(5,10,20,0)", "rgba(5,10,20,0.35)", "rgba(5,10,20,0.95)"]} locations={[0, 0.28, 0.55, 1]} style={StyleSheet.absoluteFill} />
            <View style={[styles.top, { padding: cardW * 0.07 }]}>
              {item.moon ? <Moon illum={item.moon.illum} waxing={item.moon.waxing} size={cardW * 0.075} /> : null}
              <Text style={[styles.date, { fontSize: cardW * 0.036 }]} numberOfLines={2}>{date}{item.moon?.label ? ` · ${item.moon.label}` : ""}</Text>
            </View>
            <View style={[styles.bottom, { padding: cardW * 0.07, gap: cardW * 0.025 }]}>
              <Text style={[styles.title, { fontSize: cardW * 0.1, lineHeight: cardW * 0.115 }]} numberOfLines={3}>{item.title || labels.untitled}</Text>
              {item.tagline ? <Text style={[styles.tagline, { fontSize: cardW * 0.045 }]} numberOfLines={2}>{item.tagline}</Text> : null}
              <Text style={[styles.quote, { fontSize: cardW * 0.042, lineHeight: cardW * 0.062 }]} numberOfLines={4}>„{firstSentence(item.text)}“</Text>
              <View style={[styles.rule, { marginTop: cardW * 0.03 }]} />
              <Text style={[styles.brand, { fontSize: cardW * 0.034 }]}>{labels.shareCardFooter ?? "Dreamt with Dream Rushes"}</Text>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <GlassButton label={labels.cancel ?? "Cancel"} onPress={onClose} />
          <Pressable style={{ flex: 1 }} disabled={busy}>
            {busy ? <View style={styles.busy}><ActivityIndicator color={colors.text} /></View> : <PrimaryButton label={labels.shareCardCta ?? labels.share ?? "Share"} heavy onPress={share} />}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg2, paddingTop: 24, paddingHorizontal: 20, gap: 18 },
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 22, overflow: "hidden", backgroundColor: colors.bg, justifyContent: "space-between" },
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  date: { flexShrink: 1, color: "rgba(234,240,251,0.85)", letterSpacing: 0.4 },
  bottom: {},
  title: { fontFamily: fonts.serif, color: colors.text },
  tagline: { fontFamily: fonts.serif, fontStyle: "italic", color: colors.muted },
  quote: { color: "rgba(234,240,251,0.92)" },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.35)" },
  brand: { color: colors.gold, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10 },
  busy: { height: 52, alignItems: "center", justifyContent: "center" },
});
