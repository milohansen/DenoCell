console.log("starting server");

console.log("Deno.pid", Deno.pid);
console.log("Deno.ppid", Deno.ppid);
console.log("Deno.gid", Deno.gid());

export default {
  fetch(_req: Request) {
    console.log("hello, marcelle");
    return new Response("Hello, World!");
  },
};
