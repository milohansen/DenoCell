import { execVal } from "./internal/execVal.ts";

export function add(a: number, b: number): number {
  return a + b;
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {

  // console.log("Add 2 + 3 =", add(2, 3));

  // await run({
  //   name: "inline script",
  //   content: "console.log('Hello World')",
  //   // content: "console.log('Hello World'); console.log('inline script'); --foo",
  // });

  // await run({ name: "file script", path: "./scripts/script.ts" });
  // await execVal({ type: "script", id: "script-1234", name: "script", version: 0, path: "./scripts/script.tsx" });
  await execVal({ type: "cron", id: "cron", name: "cron", version: 0, path: "./internal/templates/cron/script.tsx" });
}
