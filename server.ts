import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getCellPaths, loadCellMetadata } from "./internal/load.ts";
import { lookup } from "./internal/lookup.ts";
import { runCell } from "./internal/runCell.ts";

const app = new Hono();

app.get("/", (c) => c.text("Hello Deno!"));

app.get("/greet/:name", (c) => {
  const name = c.req.param("name");
  return c.text(`Hello ${name}!`);
});
app.get("/run/:name", async (c) => {
  const name = c.req.param("name");
  const id = lookup(name);
  if (!id) {
    throw new HTTPException(404);
  }

  const paths = getCellPaths(id);
  const metadata = await loadCellMetadata(id);

  const subprocessUrl = await new Promise<string>((resolve) =>
    runCell(metadata, paths, (line) => {
      console.log("got line", line);
      if (line.startsWith("deno serve: Listening on http://")) {
        const url = line.split("Listening on ")[1];
        resolve(url);
      }
    })
  );

  const { search } = new URL(c.req.url);
  const url = new URL(subprocessUrl);
  url.search = search;

  const headers = new Headers(c.req.header());
  headers.set("Host", url.host);

  return fetch(url, {
    method: c.req.method,
    headers,
    body: c.req.raw.body,
    redirect: "manual",
  });
});

export default app satisfies Deno.ServeDefaultExport;

const now = Temporal.Now;
const timestamp = now.instant().toLocaleString("en-US");
console.log(
  "Started at: ",
  timestamp,
);
