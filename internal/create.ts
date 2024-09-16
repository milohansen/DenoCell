import { ScriptMeta } from "./parse.ts";
import { ulid } from "jsr:@std/ulid";

export async function create(name: string, type: string) {
  const dir = Deno.readDir(`internal/templates/${type}`);

  await Deno.mkdir(`scripts/${name}`, { recursive: true });

  for await (const entry of dir) {
    // console.log("entry", entry);
    if (entry.isFile) {
      if (entry.name === "meta.json") {
        const content = JSON.parse(
          await Deno.readTextFile(`internal/templates/${type}/${entry.name}`),
        ) as ScriptMeta;
        content.id = ulid();
        content.name = name;
        await Deno.writeTextFile(
          `scripts/${name}/${entry.name}`,
          JSON.stringify(content, null, 2),
        );
      } else {
        await Deno.copyFile(
          `internal/templates/${type}/${entry.name}`,
          `scripts/${name}/${entry.name}`,
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
  await create("sample", "script");
}
