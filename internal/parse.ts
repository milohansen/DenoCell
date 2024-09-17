import parser from "oxc-parser";

export async function generateMetadata(contents: string, filePath: string) {
  // Load and parse the file
  const parserOptions: parser.ParserOptions = {
    sourceType: "module",
    sourceFilename: filePath,
  };

  const lexerResult = await parser.moduleLexerAsync(contents, parserOptions);
  const parsed = await parser.parseAsync(contents, parserOptions);

  let program: unknown;
  try {
    program = JSON.parse(parsed.program);
  } catch {
    // ignore
    throw new Error("Failed to parse program");
  }

  const staticMemberExpressionSet = new Set<string>();

  const metadata: CellMeta = {
    id: "UNKNOWN",
    name: "UNKNOWN",
    type: "script",
    version: 0,
    imports: lexerResult.imports.map((i) => i.n || "UNKNOWN"),
    exports: lexerResult.exports.map((i) => i.n),
    // remove numbers from the program to make the comparison not whitespace sensitive
    program: walkProgram(program, staticMemberExpressionSet),
  };

  return { metadata, staticMemberExpressionSet };
}

if (import.meta.main) {
  // await generateMetadata("scripts/script");
  // await run("std/storage");
}

export type CellMeta = {
  id: string;
  name: string;

  type: CellType;

  version: number;
  imports: string[];
  exports: string[];

  // TODO: minify this
  // notify and recompile if the minified version changes
  program: unknown;
};

function walkProgram(
  obj: unknown,
  staticMemberExpressionSet: Set<string>,
): unknown {
  if (typeof obj === "object" && obj) {
    if (Array.isArray(obj)) {
      return obj.map((v) => walkProgram(v, staticMemberExpressionSet));
    } else {
      if (isStaticMemberExpression(obj)) {
        staticMemberExpressionSet.add(obj.object?.name);
      }

      const newObj = structuredClone(obj) as Record<string, unknown>;
      for (const key of Object.getOwnPropertyNames(newObj)) {
        if (typeof newObj[key] === "number" && (key === "start" || key === "end")) {
          delete newObj[key];
        } else if (typeof newObj[key] === "object") {
          newObj[key] = walkProgram(newObj[key], staticMemberExpressionSet);
        }
      }
      return newObj;
    }
  }

  return obj;
}

function isStaticMemberExpression(obj: unknown): obj is StaticMemberExpression {
  return typeof obj === "object" && !!obj && "type" in obj &&
    obj.type === "StaticMemberExpression";
}

type StaticMemberExpression = {
  type: "StaticMemberExpression";
  object: {
    name: string;
  };
};
