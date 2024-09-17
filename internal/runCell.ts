import { slugify } from "@std/text/unstable-slugify";
import { ulid } from "@std/ulid";

import { LineSplitter } from "./LineSplitter.ts";
import { CellPaths } from "./load.ts";
import { createLogger, lineBreakSymbol } from "./logger.ts";
import { CellMeta } from "./parse.ts";
import { readString } from "./streams.ts";
import { Logger } from "@std/log/logger";

/** Execute a script */
export function runCell(
  metadata: CellMeta,
  paths: CellPaths,
  onLog: (line: string) => void,
) {
  const runId = ulid();
  const { type } = metadata;

  console.log("val.type", type);
  console.log("Deno.pid", Deno.pid);

  const baseArgs = [];
  if (type === "http") {
    baseArgs.push(
      "serve",
      "-A",
      "--allow-env",
      "--allow-net",
      "--port",
      "0",
    );
  } else {
    baseArgs.push("run");
  }

  const command = new Deno.Command(Deno.execPath(), {
    args: [...baseArgs, paths.scriptPath],

    stdout: "piped",
    stderr: "piped",
    // try to prevent the subprocess from inheriting the environment
    // clearEnv: true,
    env: {
      RUN_ID: runId,
      // prevent coloring the output so we can write it to a file
      NO_COLOR: "true",
    },
  });

  const child = command.spawn();

  sendLogs(metadata, paths.logsPath, child, runId, onLog).then(() => {
    console.log("done");
  });

  return child;
}

async function sendLogs(
  metadata: CellMeta,
  logsPath: string,
  child: Deno.ChildProcess,
  runId: string,
  onLog: (line: string) => void,
) {
  const { id, version, type, name } = metadata;
  const logger = createLogger(logsPath);

  const valInfo = `${id} v${version} (${type})`;
  logger.debug(valInfo, lineBreakSymbol);
  logger.info("STARTING EXECUTION", runId);

  const ls = new LineSplitter();
  for await (
    const line of child.stdout.pipeThrough(ls).pipeThrough(
      new TextDecoderStream(),
    )
  ) {
    onLog(line);
    logger.info(">", line.trimEnd());
  }

  const [errString, status] = await Promise.all([
    readString(child.stderr),
    child.status,
  ]);

  if (errString) {
    const fixedErrorString = errString.replaceAll(
      /file:.*?(?=:\d+:\d+)/g,
      slugify(name),
    );

    logger.error(fixedErrorString.trimEnd());
  }

  if (status.success) {
    logger.info("SUCCEEDED", "code", status.code);
  } else {
    logger.info("FAILED", "code", status.code);
  }
}
