import * as log from "@std/log";
import { format } from "@std/datetime/format";
import { parse } from "@std/path";

export const lineBreakSymbol = Symbol("lineBreak");
const timestampFormat = "yyyy-MM-dd HH:mm:ss.SSS";

export function createLogger(filename = "./log.txt") {
  try {
    const parsedPath = parse(filename);
    Deno.mkdirSync(parsedPath.dir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      console.log("error", error);
      throw error;
    }
  }
  try {
    using _f = Deno.openSync(filename, {
      create: true,
      append: true,
    });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      console.log("error", error);
      throw error;
    }
  }
  // console.log("getLogger", filename);
  log.setup({
    handlers: {
      console: new log.ConsoleHandler("INFO", {
        formatter: (record) => {
          if (record.args[0] === lineBreakSymbol) {
            return "";
          }
          return record.levelName +
            formatMessage(record.msg, record.args).join();
        },
      }),
      file: new log.FileHandler("DEBUG", {
        filename,
        formatter: (record) => {
          if (record.args[0] === lineBreakSymbol) {
            if (!record.msg) {
              return "".padEnd(80, "-");
            } else {
              return "\n" + centerMessage(record.msg, 80, "/");
            }
          }

          const timestamp = format(record.datetime, timestampFormat, {
            timeZone: "UTC",
          });
          // "CRITICAL" is longer but "ERROR" is more common
          const header = `[${record.levelName.padEnd(5)} @ ${timestamp}]`;

          const { parts, join } = formatMessage(record.msg, record.args);

          if (record.levelName === "ERROR") {
            parts.unshift(
              centerMessage("ERROR", 80 - header.length - 1) + "\n",
            );
          }

          return header + join();
        },
      }),
    },
    loggers: {
      default: {
        level: "DEBUG",
        handlers: ["console", "file"],
      },
    },
  });

  return log.getLogger();
}

function centerMessage(message: string, width: number, fill = "-"): string {
  const messageLength = message.length + 2;
  const leftPad = Math.floor((width - messageLength) / 2);
  const rightPad = width - messageLength - leftPad;
  return "".padEnd(leftPad, fill) + " " + message + " " +
    "".padEnd(rightPad, fill);
}

function formatMessage(msg: string, args: unknown[]) {
  const parts: string[] = [msg];

  for (const arg of args) {
    if (arg instanceof Error) {
      parts.push(arg.message + "\n" + arg.stack);
    } else if (typeof arg === "string") {
      parts.push(arg);
    } else {
      try {
        parts.push(JSON.stringify(arg));
      } catch (error) {
        console.log("unable to stringify arg", arg, error);
      }
    }
  }

  return {
    parts,
    join: () =>
      parts.reduce(
        (a, c) => a + (a.endsWith("\n") ? "" : " ") + c,
        "",
      ),
  };
}
