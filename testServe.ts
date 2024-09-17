const command = new Deno.Command(Deno.execPath(), {
  args: ["serve", "--port", "0", "-A", "test/server.tsx"],
  stdout: "piped",
  stderr: "piped",
  // clearEnv: true,
});
const child = command.spawn();

const { code, stdout, stderr } = await child.output();

console.log("code", code);
console.log("stdout", new TextDecoder().decode(stdout));
console.log("stderr", new TextDecoder().decode(stderr));
