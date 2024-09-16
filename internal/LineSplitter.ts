function concatArrayBuffers(chunks: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export class LineSplitter extends TransformStream<Uint8Array, Uint8Array> {
  #buffer: Uint8Array[] = [];

  constructor() {
    super({
      transform: (chunk, controller) => {
        let index;
        let rest = chunk;
        while ((index = rest.indexOf(0x0a)) !== -1) {
          controller.enqueue(
            concatArrayBuffers([...this.#buffer, rest.slice(0, index + 1)]),
          );
          rest = rest.slice(index + 1);
          this.#buffer = [];
        }

        if (rest.length > 0) {
          this.#buffer.push(rest);
        }
      },
      flush: (controller) => {
        if (this.#buffer.length > 0) {
          controller.enqueue(concatArrayBuffers(this.#buffer));
        }
      },
    });
  }
}
