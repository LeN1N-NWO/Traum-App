// Metro für die Expo-Hülle (ADR-0006, 11.09.2026).
//
// Die alte Web-Oberfläche liegt eine Ebene höher (../src) und läuft hier
// als DOM-Komponente aus demselben Quelltext — kein Kopieren, kein Fork.
// Dafür muss Metro zwei Dinge wissen, die es von allein nicht tut:
//
//  1. watchFolders: das Hauptrepo gehört zum beobachteten Baum, sonst sind
//     Importe über die Projektgrenze „not found".
//  2. Auflösung NUR aus mobile/node_modules: Wer ../src/App.jsx importiert,
//     würde `react` sonst hierarchisch im Hauptrepo finden (React 18, für
//     Vite) — zwei React-Kopien in einem Bündel sind der klassische
//     „Invalid hook call". Hier gibt es genau eines (19.2, das React
//     Native 0.86 verlangt).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const mobile = __dirname;
const repo = path.resolve(mobile, "..");

const config = getDefaultConfig(mobile);
config.watchFolders = [repo];
config.resolver.nodeModulesPaths = [path.join(mobile, "node_modules")];
config.resolver.disableHierarchicalLookup = true;
// Das Hauptrepo trägt eigene node_modules (Vite, Capacitor-CLI) — die
// dürfen nie ins Bündel: ausschließen, damit Metro sie nicht einmal liest.
config.resolver.blockList = [new RegExp(path.join(repo, "node_modules").replace(/[/\\]/g, "[/\\\\]") + "[/\\\\].*")];
module.exports = config;
