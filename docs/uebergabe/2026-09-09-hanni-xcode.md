für: Hanni, Hanna, H4nn40x

Hallo Hanni, für Xcode sind schon Vorkehrungen getroffen, du kannst loslegen.

WAS SCHON DA IST (09.09.2026, Anton + Claude)
  · Capacitor 8 ist installiert (@capacitor/core, /ios, /cli), das
    iOS-Projekt liegt unter ios/App/App.xcodeproj — per Swift Package
    Manager, KEIN CocoaPods nötig.
  · Der Simulator-Build lief bereits durch (xcodebuild, ohne Signierung).
  · capacitor.config.ts: appId app.dreamrushes, Name „Dream Rushes",
    webDir dist. Die Begründungen stehen als Kommentar in der Datei.
  · Die App selbst war schon vorbereitet: HashRouter, VITE_API_BASE für
    den Server, Medien als relative /media/-Pfade, viewport-fit=cover.

SO LEGST DU LOS
  1. git pull --rebase · bun install
  2. bun run build            → baut dist/
  3. bunx cap sync ios        → kopiert dist/ in die iOS-Hülle
  4. bunx cap open ios        → öffnet Xcode (oder: open ios/App/App.xcodeproj)
  5. In Xcode: Ziel „App", ein Simulator, ▶. Für ein echtes Gerät brauchst
     du unter Signing & Capabilities dein Team — das ist das Einzige, was
     nicht im Repo liegen kann.

WAS DU WISSEN MUSST
  · Die App braucht einen laufenden server.js (dort liegen die Schlüssel).
    Im Simulator reicht `bun run dev` auf dem Mac, wenn VITE_API_BASE beim
    Build auf http://localhost:8100 zeigt:
        VITE_API_BASE=http://localhost:8100 bun run build && bunx cap sync ios
    Auf dem Gerät muss dort die IP deines Macs im WLAN stehen
    (http://192.168.x.x:8100). Ohne API_BASE geht jeder /api-Aufruf ins Leere.
  · Deine .env mit FAL_KEY, DEEPSEEK_KEY, GEMINI_KEY brauchst du lokal —
    sie ist nicht im Repo und gehört da nie hin.
  · ios/App/App/public und capacitor.config.json in ios/ sind erzeugt und
    ignoriert — nach jedem `bun run build` wieder `bunx cap sync ios`.
  · Erzeugte Bilder und Filme liegen unter media/ (ignoriert) und nie in
    einem Worktree — AGENTS.md sagt, warum.
  · Der Sitzungsablauf gilt wie immer: /start, eigener Zweig
    session/2026-09-09-hanni, Entwurfs-PR, am Ende /wrap.

WENN DU FERTIG BIST
  Diese Datei löschen (docs/uebergabe/…) — dann hört der Gruß auf.

Kussi von einem 1337 User
