#!/usr/bin/env node
// Ende-zu-Ende-Prüfung für Anmeldung, Konto und Träume (ADR-0005).
//
//   TESTUSER=... TESTPASS=... node scripts/test-konto.mjs
//
// Läuft gegen einen LAUFENDEN Server (bun server.js) mit echten Werten in
// .env: SUPABASE_URL, SUPABASE_ANON_KEY und ein erreichbares DATABASE_URL.
// Ohne die drei kann dieses Skript nichts beweisen und sagt das, statt grün
// zu werden — eine Prüfung, die nicht fehlschlagen kann, beweist nichts.
//
// ⚠ Zugangsdaten kommen aus der Umgebung, nie aus einer Datei im Repo und
//   nie als Argument (Argumente stehen in der Prozessliste).
//
// Was geprüft wird, und warum genau das:
//   1. Anmelden ergibt eine Sitzung                — ohne die geht nichts.
//   2. Falsches Passwort ergibt 401, nicht 200     — die Tür schließt wirklich.
//   3. Konto ohne Token ergibt 401                 — die Tür ist nicht nur zu, sie ist verschlossen.
//   4. Konto mit Token zeigt Profil und Guthaben   — RLS lässt die eigene Zeile durch.
//   5. Ein Traum lässt sich speichern und lesen    — der Weg in die Datenbank steht.
//   6. Derselbe Traum ein zweites Mal verdoppelt   — unique(user_id, client_id) hält.
//      ihn nicht, sondern aktualisiert ihn
//   7. Ein Foto als Medienpfad kommt NICHT an      — dreamRow.js hält es auf.
//   8. Löschen entfernt genau diesen Traum         — das Löschrecht ist erfüllbar.
//   9. Sitzung erneuern ergibt eine neue Sitzung   — die App muss nicht stündlich fragen.

const BASIS = process.env.API_BASIS || "http://localhost:8100";
const EMAIL = process.env.TESTUSER;
const PASSWORT = process.env.TESTPASS;

if (!EMAIL || !PASSWORT) {
  console.error("FEHLT: TESTUSER und TESTPASS in der Umgebung.\n"
    + "  TESTUSER='...' TESTPASS='...' node scripts/test-konto.mjs");
  process.exit(2);
}

let gruen = 0, rot = 0;
const pruefe = (name, bedingung, detail = "") => {
  if (bedingung) { gruen++; console.log(`  ok    ${name}`); }
  else { rot++; console.log(`  FEHLER ${name}${detail ? " — " + detail : ""}`); }
};

const ruf = async (pfad, { methode = "GET", token, koerper } = {}) => {
  const res = await fetch(`${BASIS}${pfad}`, {
    method: methode,
    headers: {
      ...(koerper ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: koerper ? JSON.stringify(koerper) : undefined,
  });
  return { status: res.status, daten: await res.json().catch(() => null) };
};

/* Eine Kennung je Lauf: sonst prüft der zweite Lauf gegen die Reste des
   ersten und „aktualisiert statt verdoppelt" wäre nicht mehr aussagekräftig. */
const clientId = `e_test_${Date.now().toString(36)}`;
const traum = (text) => ({
  id: clientId,
  createdAt: new Date().toISOString(),
  kind: "dream",
  title: "Prüf-Traum",
  text,
  references: [{ tag: "@Anna", category: "person", bild: "data:image/png;base64,AAAA" }],
  medien: { bilder: ["/media/echt.png", "data:image/png;base64,BBBB"], film: [] },
});

console.log(`\nKonto-Prüfung gegen ${BASIS}\n`);

/* ⚠ Aufräumen am ANFANG, nicht nur am Ende. Bricht ein Lauf mitten in einer
   Prüfung ab, bleiben seine Träume sonst in der echten Datenbank stehen —
   am 12.09.2026 genau so passiert. Der nächste Lauf kehrt sie weg, und zwar
   bevor gezählt wird, damit alte Reste keine Ergebnisse verfälschen. */
async function kehreAus(token) {
  let weg = 0, cursor = null;
  do {
    const p = await ruf(`/api/dreams?limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, { token });
    if (p.status !== 200) break;
    for (const d of p.daten.dreams) {
      if (String(d.id).startsWith("e_test_")) {
        await ruf(`/api/dreams?client_id=${encodeURIComponent(d.id)}`, { methode: "DELETE", token });
        weg++;
      }
    }
    cursor = p.daten.next;
  } while (cursor);
  return weg;
}

// 1 + 2 + 3: die Tür
const anmeldung = await ruf("/api/auth/login", { methode: "POST", koerper: { email: EMAIL, password: PASSWORT } });
pruefe("anmelden ergibt eine Sitzung", anmeldung.status === 200 && !!anmeldung.daten?.access_token,
  `Status ${anmeldung.status}: ${anmeldung.daten?.error || ""}`);

if (anmeldung.status !== 200) {
  console.error("\nOhne Anmeldung sind die übrigen Prüfungen bedeutungslos — Abbruch.");
  console.error("Prüfe: SUPABASE_URL/SUPABASE_ANON_KEY in .env, Server neu gestartet, Zugangsdaten richtig.");
  process.exit(1);
}
const token = anmeldung.daten.access_token;
const reste = await kehreAus(token);
if (reste) console.log(`        (${reste} Rest-Traum/Träume aus einem früheren Lauf entfernt)`);

const falsch = await ruf("/api/auth/login", { methode: "POST", koerper: { email: EMAIL, password: `${PASSWORT}-falsch` } });
pruefe("falsches Passwort wird abgewiesen (401)", falsch.status === 401, `Status ${falsch.status}`);

const ohne = await ruf("/api/account");
pruefe("Konto ohne Token ist verschlossen (401)", ohne.status === 401, `Status ${ohne.status}`);

// 4: das Konto
const konto = await ruf("/api/account", { token });
pruefe("Konto mit Token zeigt Profil und Guthaben",
  konto.status === 200 && konto.daten?.user?.id && konto.daten?.credits != null,
  `Status ${konto.status}: ${konto.daten?.error || JSON.stringify(konto.daten).slice(0, 120)}`);
if (konto.status === 200) {
  console.log(`        → ${konto.daten.user.email}, Guthaben ${konto.daten.credits?.total} `
    + `(gekauft ${konto.daten.credits?.purchased}, Abo ${konto.daten.credits?.allowance})`);
}

// 5: speichern und lesen
const hoch = await ruf("/api/dreams/sync", { methode: "POST", token, koerper: { dreams: [traum("Erste Fassung.")] } });
pruefe("ein Traum lässt sich speichern", hoch.status === 200 && hoch.daten?.gespeichert === 1,
  `Status ${hoch.status}: ${hoch.daten?.error || ""}`);

const liste1 = await ruf("/api/dreams", { token });
const meiner = () => (liste1.daten?.dreams || []).filter((d) => d.id === clientId);
pruefe("der gespeicherte Traum kommt zurück", liste1.status === 200 && meiner().length === 1,
  `Status ${liste1.status}, ${meiner().length} Treffer`);
pruefe("mit dem Text, der geschickt wurde", meiner()[0]?.text === "Erste Fassung.");

// 6: wiederholbar
await ruf("/api/dreams/sync", { methode: "POST", token, koerper: { dreams: [traum("Zweite Fassung.")] } });
const liste2 = await ruf("/api/dreams", { token });
const jetzt = (liste2.daten?.dreams || []).filter((d) => d.id === clientId);
pruefe("derselbe Traum wird aktualisiert, nicht verdoppelt", jetzt.length === 1, `${jetzt.length} Zeilen`);
pruefe("und trägt die neue Fassung", jetzt[0]?.text === "Zweite Fassung.", jetzt[0]?.text);

// 7: ⚠⚠ das Foto, das nicht durchkommen darf
const alsText = JSON.stringify(jetzt[0] || {});
pruefe("kein `data:`-Foto in der Datenbank gelandet", !alsText.includes("data:"),
  "ein Referenzfoto ist durchgerutscht");
pruefe("die Referenz behielt Tag und Kategorie",
  JSON.stringify(jetzt[0]?.references) === JSON.stringify([{ tag: "@Anna", category: "person" }]),
  JSON.stringify(jetzt[0]?.references));
pruefe("der echte Medienpfad blieb erhalten",
  JSON.stringify(jetzt[0]?.medien?.bilder) === JSON.stringify(["/media/echt.png"]),
  JSON.stringify(jetzt[0]?.medien?.bilder));

// 7b: seitenweise lesen. Drei Träume in DERSELBEN Sekunde — genau der Fall,
// an dem ein Cursor nur auf der Zeit lautlos einen verlöre.
const stempel = new Date().toISOString();
const drei = ["a", "b", "c"].map((s) => ({
  id: `${clientId}_${s}`, createdAt: stempel, kind: "dream", title: `Seite ${s}`, text: `Traum ${s}`,
}));
const hoch3 = await ruf("/api/dreams/sync", { methode: "POST", token, koerper: { dreams: drei } });
pruefe("drei Träume auf einmal gespeichert", hoch3.daten?.gespeichert === 3, JSON.stringify(hoch3.daten));

const gesehen = [];
let cursor = null, seiten = 0;
do {
  const p = await ruf(`/api/dreams?limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, { token });
  if (p.status !== 200) { pruefe("blättern liefert Seiten", false, `Status ${p.status}`); break; }
  pruefe(`Seite ${seiten + 1} hält die Grenze ein (≤2)`, p.daten.dreams.length <= 2, `${p.daten.dreams.length} Einträge`);
  gesehen.push(...p.daten.dreams.map((d) => d.id));
  cursor = p.daten.next;
  seiten++;
} while (cursor && seiten < 20);

const meineDrei = gesehen.filter((id) => id.startsWith(`${clientId}_`));
pruefe("alle drei Träume beim Blättern gefunden", meineDrei.length === 3, `${meineDrei.length} von 3`);
pruefe("keiner doppelt geliefert", new Set(gesehen).size === gesehen.length,
  `${gesehen.length} geliefert, ${new Set(gesehen).size} verschieden`);
pruefe("mehr als eine Seite gebraucht (sonst prüft das nichts)", seiten > 1, `${seiten} Seite(n)`);

const ohneCursor = await ruf("/api/dreams?limit=99999", { token });
pruefe("ein absurdes limit wird gedeckelt, nicht abgelehnt",
  ohneCursor.status === 200 && ohneCursor.daten.limit === 200, `limit=${ohneCursor.daten?.limit}`);
const kaputt = await ruf("/api/dreams?cursor=voelliger-unsinn", { token });
pruefe("ein kaputter Cursor ergibt die erste Seite, keinen Fehler", kaputt.status === 200, `Status ${kaputt.status}`);

const zuViele = await ruf("/api/dreams/sync", { methode: "POST", token,
  koerper: { dreams: Array.from({ length: 201 }, (_, i) => ({ id: `${clientId}_ueber_${i}`, text: "x" })) } });
pruefe("ein zu großer Stapel wird abgelehnt (413)", zuViele.status === 413, `Status ${zuViele.status}`);

for (const d of drei) await ruf(`/api/dreams?client_id=${encodeURIComponent(d.id)}`, { methode: "DELETE", token });

// 7c: das Profil — die Erlaubnisliste und die Größengrenze.
// ⚠ Das Profil ist echt und gehört dem Testuser: vorher merken, hinterher
//    zurückstellen. Ein Prüfskript, das fremde Einstellungen behält, ist ein
//    Prüfskript, das man irgendwann nicht mehr laufen lässt.
const vorher = (await ruf("/api/account", { token })).daten?.profile || {};
const patch = await ruf("/api/account", { methode: "PATCH", token,
  koerper: { voice: "Kore", onboarded: true, streak: 9999, id: "fremde-id" } });
pruefe("Profil ändern nimmt die erlaubten Felder", patch.status === 200 && patch.daten?.profile?.voice === "Kore",
  `Status ${patch.status}: ${patch.daten?.error || ""}`);
pruefe("⚠ `streak` lässt sich NICHT vom Client setzen", patch.daten?.profile?.streak !== 9999,
  `streak = ${patch.daten?.profile?.streak}`);
const teilweise = await ruf("/api/account", { methode: "PATCH", token, koerper: { language: "de" } });
pruefe("nicht mitgeschickte Felder bleiben unverändert",
  teilweise.daten?.profile?.voice === "Kore" && teilweise.daten?.profile?.language === "de",
  JSON.stringify({ voice: teilweise.daten?.profile?.voice, language: teilweise.daten?.profile?.language }));
const nichts = await ruf("/api/account", { methode: "PATCH", token, koerper: { unbekannt: 1 } });
pruefe("ein Aufruf ohne bekanntes Feld sagt das (400)", nichts.status === 400, `Status ${nichts.status}`);
const riesig = await ruf("/api/account", { methode: "PATCH", token,
  koerper: { survey: { fuellung: "x".repeat(70_000) } } });
pruefe("eine übergroße Umfrage wird abgelehnt (413), nicht still gekürzt", riesig.status === 413,
  `Status ${riesig.status}`);
const grenzeOk = await ruf("/api/account", { methode: "PATCH", token,
  koerper: { survey: { fuellung: "x".repeat(1000) } } });
pruefe("eine normale Umfrage geht durch und kommt als Objekt zurück",
  grenzeOk.status === 200 && typeof grenzeOk.daten?.profile?.survey === "object"
    && grenzeOk.daten.profile.survey?.fuellung?.length === 1000,
  `Status ${grenzeOk.status}, typeof survey = ${typeof grenzeOk.daten?.profile?.survey}`);

// Ein falscher Typ wird benannt, nicht still verschluckt.
const falscherTyp = await ruf("/api/account", { methode: "PATCH", token, koerper: { voice: 42 } });
pruefe("ein falscher Typ wird benannt (400)", falscherTyp.status === 400, `Status ${falscherTyp.status}`);

/* ⚠ Der Fall, der bis zum 12.09. unmöglich war: ein Feld wieder LEEREN.
   `null` heißt „leeren", ein fehlender Schlüssel heißt „unverändert" —
   sonst wird man einen einmal gesetzten Anzeigenamen nie wieder los. */
const geleert = await ruf("/api/account", { methode: "PATCH", token, koerper: { voice: null } });
pruefe("ein Feld lässt sich wieder leeren (null)", geleert.status === 200 && geleert.daten?.profile?.voice === null,
  `voice = ${JSON.stringify(geleert.daten?.profile?.voice)}`);
const unberuehrt = await ruf("/api/account", { methode: "PATCH", token, koerper: { language: "en" } });
pruefe("und ein fehlender Schlüssel leert eben NICHT",
  unberuehrt.daten?.profile?.voice === null && unberuehrt.daten?.profile?.language === "en");

// Zurückstellen — jetzt vollständig möglich, auch auf leer.
const zurueck = { survey: vorher.survey ?? null };
for (const f of ["voice", "language"]) zurueck[f] = vorher[f] ?? null;
for (const f of ["onboarded", "survey_done"]) zurueck[f] = vorher[f] ?? false;
await ruf("/api/account", { methode: "PATCH", token, koerper: zurueck });
const danach = (await ruf("/api/account", { token })).daten?.profile || {};
const abweichend = ["voice", "language", "onboarded", "survey_done", "survey"]
  .filter((f) => JSON.stringify(danach[f] ?? null) !== JSON.stringify(vorher[f] ?? null));
pruefe("Profil wieder wie vorgefunden", abweichend.length === 0,
  abweichend.map((f) => `${f}: ${JSON.stringify(vorher[f])} → ${JSON.stringify(danach[f])}`).join(", "));

// 8: das Löschrecht
const weg = await ruf(`/api/dreams?client_id=${encodeURIComponent(clientId)}`, { methode: "DELETE", token });
pruefe("löschen entfernt den Traum", weg.status === 200, `Status ${weg.status}`);
const liste3 = await ruf("/api/dreams", { token });
pruefe("und er ist wirklich weg",
  (liste3.daten?.dreams || []).every((d) => d.id !== clientId));
const nochmal = await ruf(`/api/dreams?client_id=${encodeURIComponent(clientId)}`, { methode: "DELETE", token });
pruefe("ein zweites Löschen sagt 404 statt so zu tun", nochmal.status === 404, `Status ${nochmal.status}`);

// 9: die Sitzung erneuern
const neu = await ruf("/api/auth/refresh", { methode: "POST", koerper: { refresh_token: anmeldung.daten.refresh_token } });
pruefe("Sitzung erneuern ergibt eine neue Sitzung", neu.status === 200 && !!neu.daten?.access_token,
  `Status ${neu.status}: ${neu.daten?.error || ""}`);

console.log(`\n${rot === 0 ? "✓" : "✗"} ${gruen} ok, ${rot} Fehler\n`);
process.exit(rot === 0 ? 0 : 1);
