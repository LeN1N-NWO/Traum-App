import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { Glass } from "@/components/glass";
import { useToasts } from "@/store/toast-store";
import { colors } from "@/theme";

/* Die Toast-Zeile über allem: Glas, gleitet von oben herein, geht von
   selbst. Sitzt im Wurzel-Layout über der Tab-Leiste. */
export function Toasts() {
  const toasts = useToasts();
  const insets = useSafeAreaInsets();
  if (!toasts.length) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8 }]}>
      {toasts.map((t) => (
        <Animated.View key={t.id} entering={FadeInUp.springify().damping(16)} exiting={FadeOutUp.duration(220)}>
          <Glass style={styles.toast}><Text style={styles.text}>{t.text}</Text></Glass>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, gap: 8, zIndex: 50 },
  toast: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16 },
  text: { color: colors.text, fontSize: 14, textAlign: "center" },
});
