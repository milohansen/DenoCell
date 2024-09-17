import { CellMeta } from "./parse.ts";
import { ulid } from "@std/ulid";

export async function create(name: string, type: string) {
  const dir = Deno.readDir(`internal/templates/${type}`);

  const id = ulid();

  await Deno.mkdir(`scripts/${id}`, { recursive: true });

  for await (const entry of dir) {
    // console.log("entry", entry);
    if (entry.isFile) {
      if (entry.name === "meta.json") {
        const meta = JSON.parse(
          await Deno.readTextFile(`internal/templates/${type}/${entry.name}`),
        ) as CellMeta;
        meta.id = id;
        meta.name = name;
        await Deno.writeTextFile(
          `scripts/${id}/${entry.name}`,
          JSON.stringify(meta, null, 2),
        );
      } else {
        await Deno.copyFile(
          `internal/templates/${type}/${entry.name}`,
          `scripts/${id}/${entry.name}`,
        );
      }
    }
    // return;
  }

  // const template = await Deno.readTextFile(`internal/templates/${type}`);
  // const path = `internal/${name}.ts`;
  // await Deno.writeTextFile(path, template);
  // console.log(`Created new ${type} at ${path}`);
}

if (import.meta.main) {
  await create("server", "http");
}
