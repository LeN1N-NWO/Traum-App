import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

/* Die Ladeanzeige: das Maskottchen, das sich hinlegt und schläft — in
   Schleife auf Schwarz (MascotLoader.jsx, Antons Ansage 03.09.), nicht ein
   drehender Ring. Dieselbe Datei wie im Web (mascot-frog-idle.mp4). */
const idle = require("../../../src/assets/mascot-frog-idle.mp4");

export function MascotLoader({ size = 180 }: { size?: number }) {
  const player = useVideoPlayer(idle, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { player.loop = true; player.muted = true; player.play(); }, [player]);
  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: size / 2 }]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  );
}

const styles = StyleSheet.create({ frame: { overflow: "hidden", backgroundColor: "#000" } });
