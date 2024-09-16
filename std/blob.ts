
import { assertEquals } from "@std/assert";
import { Buffer } from "node:buffer";
import { brotliCompressSync } from "node:zlib";

import { storage } from "./storage.ts";

export async function getJSON(path: string) {
  return (await getFile(path).get()).json();
}
export async function setJSON(path: string, input: unknown) {
  const stringified = JSON.stringify(input);

  let data: Buffer;

  if (stringified.length > 256) {
    data = brotliCompressSync(stringified);
    console.log("Compressed", stringified.length, data.length);
  } else {
    data = Buffer.from(stringified);
  }

  const file = getFile(path);
  const res = await file.put(data, "application/json");

  return res.ok;
}

function getFile(path: string) {
  const match = /([^/\\]+)(.*?)([^/\\]+)$/g.exec(path);

  if (!match) {
    throw new Error("Invalid path");
  }

  const [, containerName, dir, file] = match;

  const container = storage.container(containerName);

  const fixedDir = dir.replaceAll(/^[//\\]|[//\\]$/g, "");

  if (fixedDir) {
    return container.dir(fixedDir).file(file);
  } else {
    return container.file(file);
  }
}

if (import.meta.main) {
  // const vmSkus = await getJSON("general/vmSkus.json");
  // console.log("vmSkus", Object.keys(vmSkus));

  // const resources = await getJSON("cmdb/resources.br");
  // console.log("resources", resources.length);

  const lockFile = await Deno.readFile("deno.lock");
  const lockFileString = new TextDecoder("utf-8").decode(lockFile);
  console.log("lockFileString", lockFileString.length, lockFileString.slice(0, 100));

  const lockContents = JSON.parse(lockFileString);
  const res = await setJSON("general/test.json", lockContents);
  console.log("setJSON", res);

  const stored = await getJSON("general/test.json");

  assertEquals(stored, lockContents);

}
