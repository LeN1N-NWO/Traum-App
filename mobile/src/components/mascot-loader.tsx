import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

/* Die Ladeanzeige: das Maskottchen, das sich hinlegt und schläft — in
   Schleife (MascotLoader.jsx, Antons Ansage 03.09.), nicht ein drehender
   Ring.

   ⚠ Transparenz (Antons Befund 23.09.: „der Hintergrund ist schwarz"):
   Bis heute lief hier dieselbe mp4 wie im Web in einem fest schwarzen
   Kreis — der Web-Trick (mix-blend-mode: screen) existiert in React
   Native nicht, und die Quelle hat keinen Alphakanal. Jetzt spielt iOS
   eine echte HEVC-Alpha-Fassung (wie mascot-tap.tsx), erzeugt aus der
   Web-Datei — die weiße Zeichnung liegt direkt auf dem Seitenhintergrund:

     ffmpeg -i src/assets/mascot-frog-idle.mp4 \
       -filter_complex "[0:v]format=gray[a];[0:v][a]alphamerge,format=bgra" \
       -c:v hevc_videotoolbox -alpha_quality 0.6 -q:v 35 -allow_sw 1 \
       -tag:v hvc1 mobile/assets/mascots/frog-idle.mov

   Der Alphakanal kommt aus der LUMINANZ (weiß auf Reinschwarz → Helligkeit
   ist die Maske) — das geht nur, solange die Idle-Regel „helle Zeichnung
   auf Reinschwarz" gilt (Begleiter-Animationsplan §2A). ⚠ Android kann
   HEVC-Alpha nicht (siehe mascot-tap.tsx) — dort bräuchte es VP9/WebM. */
const idle = require("../../assets/mascots/frog-idle.mov");

export function MascotLoader({ size = 180 }: { size?: number }) {
  const player = useVideoPlayer(idle, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { player.loop = true; player.muted = true; player.play(); }, [player]);
  return (
    <View style={{ width: size, height: size }}>
      <VideoView player={player} style={[StyleSheet.absoluteFill, styles.clear]} contentFit="contain" nativeControls={false} />
    </View>
  );
}

/* Ausdrücklich durchsichtig, damit die Videoschicht nicht schwarz hinter
   den Alphakanal malt — genau der Kasten, der weg soll. (mascot-tap.tsx
   kommt ohne die Zeile aus, weil seine Ebene ohnehin über allem schwebt;
   hier sitzt das Video IN einer Bildschirmfläche.) */
const styles = StyleSheet.create({ clear: { backgroundColor: "transparent" } });
