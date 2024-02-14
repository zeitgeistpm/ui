import { IOMarketMetadata } from "@zeitgeistpm/sdk";
import type { PageConfig } from "next";
import { NextRequest } from "next/server";

const CLUSTER_ENDPOINT = process.env.IPFS_CLUSTER_URL;

const headers = {
  Authorization: `Basic ${Buffer.from(
    `${process.env.IPFS_CLUSTER_USERNAME}:${process.env.IPFS_CLUSTER_PASSWORD}`,
  ).toString("base64")}`,
};

export const config: PageConfig = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  if (req.method === "POST") {
    const rawJson = JSON.parse(await extractBody(req));

    const [error, parsed] = IOMarketMetadata.validate(rawJson);

    if (error) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 400,
      });
    }

    const { searchParams } = new URL(req.url);
    const onlyHash = searchParams.get("only-hash") ?? "false";

    const json = JSON.stringify(parsed);
    const kbSize = Buffer.byteLength(json) / 1024;

    if (kbSize > 10) {
      return new Response(
        JSON.stringify({
          message: "Market metadata is too large. Please keep it under 10kb.",
        }),
        {
          status: 400,
        },
      );
    }

    const formData = new FormData();

    formData.append("file", json);

    const response = await fetch(
      new URL(
        `/add?hash=sha3-384&cid-version=1&only-hash=${onlyHash}`,
        CLUSTER_ENDPOINT,
      ).href,
      {
        headers,
        method: `POST`,
        body: formData,
      },
    );

    if (!response.ok) {
      const data = await response.json();
      return new Response(
        JSON.stringify({
          message: data?.message ?? "Unknown cluster api error.",
        }),
        {
          status: 500,
        },
      );
    }

    const { cid } = await response.json();

    return new Response(
      JSON.stringify({
        message: `Market metadata ${
          onlyHash === "true" ? "hashed" : "pinned"
        } successfully.`,
        onlyHash: onlyHash === "true",
        cid: cid,
      }),
      {
        status: response.status,
      },
    );
  }

  if (req.method === "DELETE") {
    const { cid } = JSON.parse(await extractBody(req));
    const response = await fetch(
      new URL(`/pins/${cid}`, CLUSTER_ENDPOINT).href,
      {
        headers,
        method: `DELETE`,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          message: data?.message ?? "Unknown cluster api error.",
        }),
        {
          status: response.status,
        },
      );
    }

    return new Response(
      JSON.stringify({
        message: "Market metadata unpinned successfully.",
      }),
      {
        status: 200,
      },
    );
  }
}

async function extractBody(request: NextRequest) {
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
