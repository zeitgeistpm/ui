import { NextRequest } from "next/server";

export async function extractBody(request: NextRequest) {
  const dec = new TextDecoder();
  const reader = request.body?.getReader();

  if (!reader) return "";
  let body = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) return body;

    body = body + dec.decode(value);
  }
}
