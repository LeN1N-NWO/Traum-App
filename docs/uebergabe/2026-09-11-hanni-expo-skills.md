für: Hanni, H4nn40x

Hallo Hanni — Anton hat am Abend des 11.09. entschieden: Die Oberfläche
wird nativ, mit React Native und Expo. Web ist kein Ziel mehr, Android
kommt später aus derselben Codebasis. Warum und was bleibt, steht in
docs/decisions/ADR-0006-expo-react-native-statt-capacitor.md (mit Messungen).
Dein Server, Supabase und die Least-Privilege-Rolle bleiben genau so —
die native App ist nur ein weiterer Client von server.js.

ZWEI SKILL-SAMMLUNGEN SIND DAFÜR EINGERICHTET — bitte einmal bei dir installieren:

  1. Expo (offiziell, 23 Skills: natives Aussehen, Router mit NativeTabs,
     Designsystem, Umzug einer Web-App nach nativ, EAS für die Stores):

         claude plugin install expo@claude-plugins-official

     ⚠ Das Plugin bringt einen MCP-Server mit, der sich einmal anmelden
       will (OAuth). Das geht nur in einer interaktiven Sitzung mit /mcp.
       Die Skills selbst funktionieren auch OHNE die Anmeldung — der
       MCP-Teil ist nur für EAS-Dienste (Builds, Updates) nötig.

  2. Software Mansion (Reanimated 4, Gesten, Haptik — die Leute hinter
     den Animationsbibliotheken). Liegt als skills-lock.json im Repo:

         npx skills add software-mansion-labs/skills

     Die Kopien landen in .agents/skills und .claude/skills und sind per
     .gitignore ausgenommen — nur die Sperrdatei ist versioniert. Von den
     elf Skills brauchen wir react-native-best-practices und pulsar-haptics;
     der Rest (Fishjam, MoQ, Quest, Detour) kam mit und stört nicht.

WAS DAS FÜR DEINE ARBEIT HEISST
  · Punkte 2–6 der Credits-Abbuchung, die Anmeldung und RevenueCat laufen
    unverändert weiter — alles serverseitig bzw. hinter derselben API.
  · Bezahlung bleibt Store-IAP über RevenueCat (ADR-0006, Konsequenzen).
  · PR #40 (natives Gefühl in Capacitor) ist nur noch Zwischenlösung.
  · Wer als Nächstes die Expo-Hülle anlegt, liest zuerst den Skill
    expo-web-to-native: Würgefeigen-Umzug, die alte Oberfläche läuft am
    ersten Tag als DOM-Komponente in der neuen Hülle, dann Bildschirm für
    Bildschirm nativ.

WENN DU FERTIG BIST
  Diese Datei löschen (docs/uebergabe/…) — dann hört der Hinweis auf.
