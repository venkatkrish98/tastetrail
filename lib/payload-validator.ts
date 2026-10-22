/**
 * Streaming Payload Validator with early abort
 * Protects server memory against large streamed/chunked uploads.
 */

export const MAX_PAYLOAD_BYTES = 32 * 1024; // 32 KB

export async function readBoundedJsonPayload<T>(
  request: Request,
  maxBytes: number = MAX_PAYLOAD_BYTES
): Promise<{ data?: T; error?: string; status?: number }> {
  // 1. Fast header check if Content-Length is present
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > maxBytes) {
    return {
      error: `Payload too large. Maximum request size is ${Math.round(maxBytes / 1024)} KB.`,
      status: 413,
    };
  }

  // 2. Stream reading with incremental byte counter
  if (!request.body) {
    return { error: 'Request body is required.', status: 400 };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        // Immediate stream abort before reading additional chunks into memory
        if (totalBytes > maxBytes) {
          await reader.cancel('Payload exceeded maximum byte limit');
          return {
            error: `Payload too large. Stream exceeded ${Math.round(maxBytes / 1024)} KB limit.`,
            status: 413,
          };
        }
        chunks.push(value);
      }
    }
  } catch (err: unknown) {
    return {
      error: `Failed to read request stream: ${err instanceof Error ? err.message : String(err)}`,
      status: 400,
    };
  }

  // 3. Assemble and parse JSON
  const totalBuffer = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    totalBuffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const rawText = new TextDecoder('utf-8').decode(totalBuffer);
  if (!rawText.trim()) {
    return { error: 'Request body is empty.', status: 400 };
  }

  try {
    const parsed = JSON.parse(rawText) as T;
    return { data: parsed };
  } catch {
    return { error: 'Malformed JSON payload.', status: 400 };
  }
}
