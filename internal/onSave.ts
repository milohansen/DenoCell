import { join } from "jsr:@std/path";
import { equal } from "@std/assert";

import { transform } from "npm:oxc-transform";

import { generateMetadata, ScriptMeta } from "./parse.ts";
import { bundle, transform as esTransform } from "./bundle.ts";

function getItemPaths(id: string) {
  const filePath = join("scripts", id);

  return {
    metadataPath: join(filePath, "meta.json"),
    scriptPath: join(filePath, "script.tsx"),
    // bundlePath: join(filePath, "bundle.js"),
    bundlePath: join(filePath, "bundle"),
  };
}

export async function onSave(
  id: string,
  contents: string,
  bundleIfPossible = true,
) {
  const { metadataPath, scriptPath, bundlePath } = getItemPaths(id);
  const { metadata: newMetadata, staticMemberExpressionSet } =
    await generateMetadata(contents, scriptPath);
  // get existing metadata
  let existingMeta: ScriptMeta | undefined;
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
