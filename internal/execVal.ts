import { slugify } from "@std/text/unstable-slugify";

import { LineSplitter } from "./LineSplitter.ts";
import { createLogger, lineBreakSymbol } from "./logger.ts";
import { readString } from "./streams.ts";

/** Execute a script */
export async function execVal(
  val: Val,
) {
  const nameSlug = slugify(val.name);

  const logger = createLogger(`logs/${nameSlug}/log.txt`);

  const valInfo = `${val.id} v${val.version} (${val.type})`;
  // add a new line to separate logs
  logger.debug(valInfo, lineBreakSymbol);
  logger.info("STARTING EXECUTION", valInfo);

  let command: Deno.Command;
  let child: Deno.ChildProcess;

  console.log("val", val);
  console.log("Deno.pid", Deno.pid);
  console.log("Deno.gid", Deno.gid());

  const baseArgs = [];
  if (val.type === "http") {
    baseArgs.push("serve", "-A", "--allow-env", "--allow-net", "--inspect-brk");
  } else {
    baseArgs.push("run");
  }

  if ("content" in val) {
    command = new Deno.Command(Deno.execPath(), {
      ...commandOptions,
      args: [...baseArgs, "-"],
      stdin: "piped",
    });
    child = command.spawn();

    const tes = new TextEncoderStream();
    const contentStream = ReadableStream.from(val.content);

    await contentStream.pipeThrough(tes).pipeTo(child.stdin);
  } else {
    command = new Deno.Command(Deno.execPath(), {
      ...commandOptions,
      args: [...baseArgs, val.path],
    });
    child = command.spawn();
  }

  const ls = new LineSplitter();
  for await (
    const line of child.stdout.pipeThrough(ls).pipeThrough(
      new TextDecoderStream(),
    )
  ) {
    logger.info(">", line.trimEnd());
  }

  const [errString, status] = await Promise.all([
    readString(child.stderr),
    child.status,
  ]);

  if (errString) {
    const fixedErrorString = errString.replaceAll(
      /file:.*?(?=:\d+:\d+)/g,
      nameSlug,
    );

    logger.error(fixedErrorString.trimEnd());
  }

  if (status.success) {
    logger.info("SUCCEEDED", "code", status.code);
  } else {
    logger.info("FAILED", "code", status.code);
  }
}

const commandOptions = {
  stdout: "piped",
  stderr: "piped",
  // try to prevent the subprocess from inheriting the environment
  clearEnv: true,
  env: {
    // prevent coloring the output so we can write it to a file
    NO_COLOR: "true",
  },
} as const;

type ValType = "script" | "http" | "cron" | "message";

type Val =
  & {
    id: string; // [name-slug]-[random]
    type: ValType;
    name: string;
    version: number; // increment on change
  }
  & ({
    content: string;
  } | {
    path: string;
  });
