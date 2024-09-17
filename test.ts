import { lookup } from "./internal/lookup.ts";
import { onSave } from "./internal/onSave.ts";
import { generateMetadata } from "./internal/parse.ts";

async function loadScriptContents(path: string) {
  return await Deno.readTextFile(path);
}

if (import.meta.main) {
  const toRun = Deno.args[0];
  const id = lookup(toRun);

  if (!id) {
    throw new Error(`"${toRun}" does not exist in the cache`);
  }

  const contents = await loadScriptContents(`test/${toRun}.tsx`);
  // const filePath = join("scripts", sampleId, "script.tsx");

  // await generateMetadata(contents, `test/${toRun}.tsx`);

  await onSave(id, contents, Deno.args[1] as any);
}
