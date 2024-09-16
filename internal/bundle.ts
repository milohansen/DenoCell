import * as esbuild from "npm:esbuild";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";

export async function bundle(entryPoints: string[], outdir: string) {
  await esbuild.build({
    plugins: [...denoPlugins()],
    entryPoints,
    chunkNames: 'chunks/[name]-[hash]',
    splitting: true,
    bundle: true,
    outdir,
    jsx: "transform",
    format: "esm",
  });

  esbuild.stop();
}
export async function transform(contents: string) {
  return await esbuild.transform(contents, {
    loader: "tsx",
    format: "esm",
    sourcemap: true
  });
}

if (import.meta.main) {
  await bundle(["./std/storage.ts"], "./dist/std/storage.js");
}
