import { slugify } from "jsr:@std/text/unstable-slugify";
import { parseArgs } from "jsr:@std/cli/parse-args";
// import isolatedvm from "npm:isolated-vm";

console.log("Hello Marcelle!");
console.log("script.ts");

console.log("slugify", slugify("Hello World"));
console.log("parseArgs", parseArgs(["--help"]));

const element = (<div>Hello, world!</div>);
console.log("element", element);

// throw new Error("This is an error");

// const res = await fetch("https://esm.sh/vite@5.4.3");

export const name = "sample";
export const version = "0.0.4";
