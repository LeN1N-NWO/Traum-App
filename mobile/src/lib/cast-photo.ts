import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { ActionSheetIOS } from "react-native";

/* Das Foto einer Figur — geteilt von Dialog (components/avatar-editor.tsx)
 * und den Besetzungs-Seiten (journal/cast.tsx, dream/cast.tsx).
 *
 * Antons Wunsch 10.10. („weniger Schritte"): Wer eine Figur ANLEGT, wird
 * sofort gefragt — Foto aufnehmen, aus der Mediathek oder ohne Foto —, und
 * erst danach öffnet sich der Dialog, mit dem Foto schon darin. Vorher:
 * Dialog auf, oben aufs Foto tippen, dann erst die Frage. Das Foto ist zu
 * groß für einen Navigations-Parameter (data:-Adresse, einige hundert KB);
 * es wartet deshalb hier, bis der Dialog es abholt (`takePendingPhoto`). */

/** Ein Foto aus Kamera oder Mediathek, verkleinert, als data:-Adresse — oder null (abgebrochen). */
export async function pickPhoto(camera: boolean, square: boolean): Promise<string | null> {
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

let pending: string | null = null;

/** Das Foto für den Dialog, der gleich aufgeht — einmal abholbar. */
export function takePendingPhoto(): string | null {
  const p = pending;
  pending = null;
  return p;
}

export type PhotoLabels = { take: string; library: string; none: string; cancel: string };

/** Erst fragen, dann den Dialog öffnen (`go`). Abbrechen = nichts passiert;
 *  „ohne Foto" öffnet den Dialog leer (beschreiben oder zeichnen lassen). */
export function askPhotoThenOpen(labels: PhotoLabels | undefined, category: string | undefined, go: () => void) {
  Haptics.selectionAsync();
  const L = labels ?? { take: "Take a photo", library: "Choose from library", none: "Without a photo", cancel: "Cancel" };
  const options = [L.take, L.library, L.none, L.cancel];
  ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 3, userInterfaceStyle: "dark" }, async (i) => {
    if (i === 3) return;
    if (i === 2) { pending = null; go(); return; }
    const url = await pickPhoto(i === 0, category !== "place");
    if (!url) return;
    pending = url;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    go();
  });
}
