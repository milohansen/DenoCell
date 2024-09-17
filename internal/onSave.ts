import { equal } from "@std/assert";

import { transform } from "npm:oxc-transform";

import { bundle } from "./bundle.ts";
import { getCellPaths } from "./load.ts";
import { CellMeta, generateMetadata } from "./parse.ts";

export async function onSave(
  id: string,
  contents: string,
  type?: CellType,
  bundleIfPossible = true,
) {
  const { metadataPath, scriptPath, bundlePath } = getCellPaths(id);
  const { metadata: newMetadata, staticMemberExpressionSet } =
    await generateMetadata(contents, scriptPath);
  // get existing metadata
  let existingMeta: CellMeta | undefined;
  try {
    existingMeta = JSON.parse(
      await Deno.readTextFile(metadataPath),
    );
  } catch {
    // ignore
  }

  // store new contents
  await Deno.writeTextFile(scriptPath, contents);

  if (
    existingMeta && equal(newMetadata.imports, existingMeta.imports) &&
    equal(newMetadata.exports, existingMeta.exports) &&
    equal(newMetadata.program, existingMeta.program)
  ) {
    newMetadata.version = existingMeta?.version ?? 0;
    // console.log("No changes detected, skipping");
    // return;
  } else {
    newMetadata.version = (existingMeta?.version ?? -1) + 1;
  }

  // newMetadata.version = (existingMeta?.version ?? -1) + 1;
  newMetadata.id = existingMeta?.id ?? "UNKNOWN";
  newMetadata.name = existingMeta?.name ?? "UNKNOWN";
  newMetadata.type = type ?? existingMeta?.type ?? "script";

  await Deno.writeTextFile(
    metadataPath,
    JSON.stringify(newMetadata, null, 2),
  );

  // TODO: check if the file can be bundled
  if (bundleIfPossible) {
    if (!serverOnlyModules.some((m) => staticMemberExpressionSet.has(m))) {
      await bundle([scriptPath], bundlePath);

      const out = transform(scriptPath, contents, {
        sourceType: "module",
        sourcemap: true,
        typescript: { rewriteImportExtensions: "remove" },
      });
      console.log("transform result", out);
    } else {
      console.log("Server only module detected, skipping bundle");
    }
  }
}

const serverOnlyModules = [
  "http",
  "Deno",
];

if (import.meta.main) {
  // const paths = getPaths("internal/templates/script");
  // await processItem(paths, false);
  // await onSave("sample");
  // await onSave("scripts/server.tsx");
}
