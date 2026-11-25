// Plays the text adventure in a terminal, without the browser.
//
//   node scripts/play-text-adventure.mjs            interactive, in French
//   node scripts/play-text-adventure.mjs en         interactive, in English
//   node scripts/play-text-adventure.mjs fr "n|i"   runs commands separated by |
//
// The run seed is fixed, so the same commands always give the same text.

import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = `${root}node_modules/.tmp/text-adventure.mjs`;
mkdirSync(`${root}node_modules/.tmp`, { recursive: true });

await build({
  stdin: {
    contents: `
      export { content } from "./src/pages/games/text/content/index";
      export { newGame, play } from "./src/pages/games/text/engine/game";
      export { render } from "./src/pages/games/text/engine/lang";
    `,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: out,
  logLevel: "warning",
});

const { content, newGame, play, render } = await import(
  pathToFileURL(out).href
);
const lang = process.argv[2] === "en" ? "en" : "fr";
const L = content.langs[lang];
const g = newGame(content, 12345);
const show = (msgs) => msgs.forEach((msg) => console.log(render(L, msg)));
show(g.st.journal[0].out);

const script = process.argv[3];
if (script) {
  for (const command of script.split("|")) {
    console.log(`\n> ${command}`);
    show(play(g, lang, command).turn.out);
  }
} else {
  // Reading line by line also works when commands are piped in.
  const input = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY,
  });
  input.setPrompt("\n> ");
  input.prompt();
  for await (const command of input) {
    if (["quit", "quitter", "exit"].includes(command.trim())) break;
    if (!process.stdin.isTTY) console.log(command);
    show(play(g, lang, command).turn.out);
    input.prompt();
  }
  input.close();
}
