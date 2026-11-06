import * as esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

/** @type {esbuild.BuildOptions} */
const buildOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node22",
  sourcemap: true,
  minify: false,
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("[esbuild] Watching for changes...");
} else {
  const result = await esbuild.build(buildOptions);
  if (result.errors.length > 0) {
    console.error("[esbuild] Build failed:", result.errors);
    process.exit(1);
  }
  console.log("[esbuild] Build complete: dist/extension.js");
}

