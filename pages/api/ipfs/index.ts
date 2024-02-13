import { ZeitgeistIpfs } from "@zeitgeistpm/sdk";
import type { NextApiRequest, NextApiResponse, PageConfig } from "next";
import * as IPFSHTTPClient from "ipfs-http-client";
import * as z from "zod";
import { fromZodError } from "zod-validation-error";
import { NextRequest } from "next/server";

const IOMarketMetadata = z.object({
  question: z.string(),
  description: z.string(),
  tags: z.optional(z.array(z.string())),
  slug: z.optional(z.string()),
  categories: z.optional(
    z.array(
      z.object({
        name: z.string(),
        ticker: z.optional(z.string()),
        img: z.optional(z.string()),
        color: z.optional(z.string()),
      }),
    ),
  ),
});

const CLUSTER_ENDPOINT = "https://ipfs-cluster.zeitgeist.pm";

const headers = {
  Authorization: `Basic ${Buffer.from(`zeitgeist:5ZpmQl*rWn%Z`).toString(
    "base64",
  )}`,
};

export const config: PageConfig = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  if (req.method === "POST") {
    const parsed = IOMarketMetadata.safeParse(
      JSON.parse(await extractBody(req)),
    );

    const { searchParams } = new URL(req.url);
    const onlyHash = searchParams.get("only-hash") ?? "false";

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ message: fromZodError(parsed.error).toString() }),
        {
          status: 400,
        },
      );
    }

    const metadata = {
      __meta: "markets",
      ...parsed.data,
    };

    const formData = new FormData();

    formData.append("file", JSON.stringify(metadata));

    console.log(
      new URL(
        `/add?hash=sha3-384&cid-version=1&only-hash=${onlyHash}`,
        CLUSTER_ENDPOINT,
      ).href,
    );

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

    const { cid } = await response.json();

    return new Response(
      JSON.stringify({
        message: "Market metadata pinned successfully.",
        cid: cid,
      }),
      {
        status: 200,
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
          status: 500,
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
