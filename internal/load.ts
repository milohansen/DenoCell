import { join } from "jsr:@std/path";

import { CellMeta } from "./parse.ts";

export async function loadCell(id: string) {
  const { metadataPath, scriptPath } = getCellPaths(id);

  const metadata: CellMeta = JSON.parse(
    await Deno.readTextFile(metadataPath),
  );

  const script = await Deno.readTextFile(scriptPath);

  return { metadata, script };
}

export async function loadCellMetadata(id: string): Promise<CellMeta> {
  const { metadataPath } = getCellPaths(id);

  return JSON.parse(
    await Deno.readTextFile(metadataPath),
  );
}

export function getCellPaths(id: string) {
  const filePath = join("scripts", id);

  return {
    base: filePath,
    metadataPath: join(filePath, "meta.json"),
    scriptPath: join(filePath, "script.tsx"),
    // bundlePath: join(filePath, "bundle.js"),
    bundlePath: join(filePath, "bundle"),
    logsPath: join(filePath, "logs.txt"),
  };
}

export type LoadedCell = Awaited<ReturnType<typeof loadCell>>;
export type CellPaths = ReturnType<typeof getCellPaths>;
