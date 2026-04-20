import { build } from "esbuild";

build({
  entryPoints: ["widget/src/widget.ts"],
  bundle: true,
  minify: true,
  outfile: "public/widget.js",
  format: "iife",
  target: ["es2020"],
}).then(() => {
  console.log("Widget built → public/widget.js");
});
