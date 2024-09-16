export async function readString(
  stream: ReadableStream<Uint8Array>,
): Promise<string> {
  const rStream = stream.pipeThrough(new TextDecoderStream());
  let output = "";

  for await (const chunk of rStream) {
    output += chunk;
  }

  return output;
}
