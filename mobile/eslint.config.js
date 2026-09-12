// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    /* Die React-Compiler-Regeln melden unsere Reanimated-Muster
       (`shared.value = …` in Handlern) und `player.loop = true` in Effekten
       als Fehler — das sind die dokumentierten Wege dieser Bibliotheken.
       Als Warnung behalten, damit echte Fälle sichtbar bleiben (12.09.2026). */
    rules: {
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);
