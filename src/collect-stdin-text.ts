import { Buffer } from "node:buffer";

const DEFAULT_MAX_STDIN_BYTES = 10 * 1024 * 1024;

export async function collectStdinText(
  input: AsyncIterable<string>,
  maxBytes: number = DEFAULT_MAX_STDIN_BYTES,
): Promise<string> {
  const chunks: string[] = [];
  let totalBytes = 0;

  for await (const chunk of input) {
    totalBytes += Buffer.byteLength(chunk, "utf8");
    if (totalBytes > maxBytes) {
      throw new Error("Input too large: exceeds 10MB limit");
    }
    chunks.push(chunk);
  }

  return chunks.join("");
}
