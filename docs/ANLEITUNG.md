# Anleitung für alle — ganz einfach erklärt

So arbeiten wir zusammen am Projekt **<projektname>**, ohne dass etwas kaputtgeht
oder verloren geht. Einmal einrichten dauert ca. 10 Minuten. Danach ist es easy.

---

## Teil 1: Du wirst eingeladen (einmalig)

1. Mach dir einen GitHub-Account (kostenlos): https://github.com/signup
2. Schick deinen GitHub-Namen an den Projekt-Besitzer.
3. Du bekommst eine E-Mail: „Invitation to collaborate".
   Klick dort auf den grünen Knopf **Accept invitation**.
   ⏰ Wichtig: Die Einladung gilt nur 7 Tage!

Fertig. Du darfst jetzt mitmachen.

---

## Teil 2: Deinen Computer vorbereiten (einmalig)

Installiere diese 3 Programme (einfach runterladen, durchklicken):

1. **Git** → https://git-scm.com/downloads
2. **Node.js** (die LTS-Version) → https://nodejs.org
3. **Claude Code** → Terminal öffnen und eintippen:

       npm install -g @anthropic-ai/claude-code

Dann hol dir das Projekt auf deinen Computer. Terminal öffnen und eintippen:

    git clone https://github.com/<dein-github-name>/<projektname>.git
    cd <projektname>

⚠️ **Nicht** in einen Google-Drive-, OneDrive- oder Dropbox-Ordner legen!
Das macht das Projekt kaputt. Einfach ein normaler Ordner auf dem Computer.

Jetzt das Wichtigste — sag Git, wer du bist (mit deinem echten Vornamen):

    git config user.name "DeinVorname"
    git config user.email "deine@email.de"

Ohne Namen darfst du nichts ändern. Das ist Absicht: So sieht jeder,
wer was gemacht hat.

---

## Teil 3: So arbeitest du jeden Tag

**Anfangen:**

1. Terminal öffnen, in den Projekt-Ordner gehen (`cd <projektname>`).
2. `claude` eintippen. Claude startet und zeigt dir sofort:
   wer du bist, wo das Projekt gerade steht, und woran die anderen arbeiten.
3. Im Chat `/start` eintippen. Claude macht dann alles für dich:
   holt den neuesten Stand, legt deinen eigenen Arbeitsbereich an,
   und meldet den anderen: „Ich arbeite gerade hier dran."
4. Sag Claude, was du machen willst. Dann loslegen.

**Aufhören:**

1. Im Chat `/wrap` eintippen. Claude schreibt dann auf, was du gemacht hast
   (damit der Nächste Bescheid weiß), speichert alles und lädt es hoch.
2. Fertig. Computer zuklappen.

**Das war's schon.** `/start` zum Anfangen, `/wrap` zum Aufhören.

---

## Teil 4: Wenn was schiefgeht — keine Panik

Es kann fast nichts für immer kaputtgehen. Merk dir zwei Befehle:

- **`/checkpoint`** — mach das BEVOR du was Großes umbaust.
  Das ist wie ein Speicherpunkt im Videospiel.
- **`/rollback`** — mach das, wenn was schiefgelaufen ist.
  Claude fragt dich, was passiert ist, und holt den alten Stand zurück.

---

## Die 5 goldenen Regeln

1. **Immer mit `/start` anfangen und mit `/wrap` aufhören.** Immer.
2. **Nie ohne Namen arbeiten** (Git fragt dich sonst — Vornamen setzen).
3. **Lieber kurz und oft arbeiten** als einmal 6 Stunden am Stück.
4. **Nie zu zweit gleichzeitig am selben Ding.** Claude warnt dich beim
   Start, woran die anderen gerade sitzen. Dann was anderes nehmen
   oder kurz absprechen.
5. **Keine Passwörter oder Schlüssel ins Projekt.** Niemals.

Fragen? Erst Claude fragen (der kennt das Projekt), dann die anderen.
