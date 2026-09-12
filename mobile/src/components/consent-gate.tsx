import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useCallback, useRef, useState } from "react";
import { LayoutAnimation, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glass, GlassButton, PrimaryButton } from "@/components/glass";
import JournalBridge from "@/legacy/journal-bridge";
import { setJournal, useJournalStore, type BridgeCommand, type JournalSnapshot, type LegalDoc } from "@/store/journal-store";
import { colors, fonts } from "@/theme";

/* Das Einwilligungs-Tor, nativ — ConsentGate.jsx: VOR allem, was Daten
   an KI-Anbieter schickt. Drei eigene Häkchen (AGB/Datenschutz ·
   Datenverarbeitung · 18+), keins vorangekreuzt; „Wohin gehen meine
   Daten?" aufklappbar; die Rechtstexte lesbar dahinter. Vollbild über den
   Tabs, solange `consent.needed` — bis dahin nur lesen, nichts senden.
   Eigene Brücke: das Wurzel-Layout hat keinen Bildschirm-Fokus. */
export function ConsentGate() {
  const data = useJournalStore();
  const insets = useSafeAreaInsets();
  const [terms, setTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adult, setAdult] = useState(false);
  const [more, setMore] = useState(false);
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [command, setCommand] = useState<BridgeCommand | null>(null);
  const n = useRef(0);
  const onJournal = useCallback(async (snap: JournalSnapshot) => { setJournal(snap); }, []);
  const C = data?.consent;
  const L = data?.profile?.settingsPage?.legal;
  const open = !!C?.needed;
  const all = terms && processing && adult;

  const Row = ({ on, set, children }: { on: boolean; set: (v: boolean) => void; children: React.ReactNode }) => (
    <Pressable onPress={() => { Haptics.selectionAsync(); set(!on); }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
      <Glass style={styles.row} interactive>
        <SymbolView name={on ? "checkmark.circle.fill" : "circle"} size={24} tintColor={on ? colors.ok : colors.faint} />
        <Text style={styles.rowText}>{children}</Text>
      </Glass>
    </Pressable>
  );

  return (
    <Modal visible={open} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => {}}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}>
          {C ? (
            <>
              <Text style={styles.title}>{C.title}</Text>
              <Text style={styles.intro}>{C.intro}</Text>
              <View style={styles.rows}>
                <Row on={terms} set={setTerms}>
                  {C.termsPre}<Text style={styles.link} onPress={() => L && setDoc(L.terms)}>{C.termsLink}</Text>
                  {C.termsMid}<Text style={styles.link} onPress={() => L && setDoc(L.privacy)}>{C.privacyLink}</Text>{C.termsPost}
                </Row>
                <Row on={processing} set={setProcessing}>{C.processing}</Row>
                <Row on={adult} set={setAdult}>{C.adult}</Row>
              </View>
              <Pressable onPress={() => { LayoutAnimation.easeInEaseOut(); setMore((v) => !v); }} accessibilityState={{ expanded: more }} style={styles.more}>
                <Text style={styles.moreText}>{C.more}</Text>
                <SymbolView name={more ? "chevron.up" : "chevron.down"} size={12} tintColor={colors.accentSoft} />
              </Pressable>
              {more ? <View style={styles.details}>{C.details.map((d, i) => <Text key={i} style={styles.detail}>• {d}</Text>)}</View> : null}
              <PrimaryButton label={C.cta} heavy disabled={!all} style={{ flex: 0, marginTop: 8 }}
                onPress={() => { n.current += 1; setCommand({ type: "consent", n: n.current }); }} />
            </>
          ) : null}
        </ScrollView>
        <View style={styles.bridge}>
          <JournalBridge onJournal={onJournal} onResult={async () => {}} refreshTick={0} command={command} dom={{ matchContents: true, style: { height: 0, opacity: 0 } }} />
        </View>

        {/* Die Rechtstexte, lesbar hinter den Links — wie LegalPage.jsx. */}
        <Modal visible={!!doc} presentationStyle="pageSheet" animationType="slide" onRequestClose={() => setDoc(null)}>
          <ScrollView style={{ backgroundColor: colors.bg2 }} contentContainerStyle={styles.doc}>
            {doc && L ? (
              <>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.docMeta}>{L.updated}</Text>
                <Text style={styles.docDraft}>{L.draftNote}</Text>
                {doc.sections.map((s, i) => (
                  <View key={i} style={{ gap: 6, marginTop: 8 }}>
                    <Text style={styles.docH}>{s.h}</Text>
                    <Text style={styles.docP}>{s.p}</Text>
                  </View>
                ))}
                <GlassButton label={L.close} onPress={() => setDoc(null)} style={{ flex: 0, marginTop: 12 }} />
              </>
            ) : null}
          </ScrollView>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 32, color: colors.text, lineHeight: 38 },
  intro: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  rows: { gap: 10, marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18 },
  rowText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 21 },
  link: { color: colors.accentSoft, textDecorationLine: "underline" },
  more: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 6 },
  moreText: { color: colors.accentSoft, fontSize: 14, fontWeight: "600" },
  details: { gap: 8, paddingLeft: 4 },
  detail: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  bridge: { height: 0, overflow: "hidden" },
  doc: { padding: 22, paddingTop: 28, gap: 8 },
  docTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.text },
  docMeta: { color: colors.faint, fontSize: 13 },
  docDraft: { color: colors.warm, fontSize: 13, lineHeight: 18 },
  docH: { color: colors.text, fontSize: 17, fontWeight: "600" },
  docP: { color: colors.muted, fontSize: 15, lineHeight: 23 },
});
