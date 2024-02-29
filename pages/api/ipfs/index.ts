import * as IPFSHTTPClient from "ipfs-http-client";
import { extractBody } from "lib/edge/extract-body";
import type { PageConfig } from "next";
import type { NextRequest } from "next/server";
//import { fromZodError } from "zod-validation-error";
import { IOMarketMetadata } from "./types";

const node = IPFSHTTPClient.create({
  url: process.env.NEXT_PUBLIC_IPFS_NODE_URL,
  // headers: {
  //   Authorization: `Basic ${Buffer.from(
  //     process.env.IPFS_NODE_BASIC_AUTH_USERNAME +
  //       ":" +
  //       process.env.IPFS_NODE_BASIC_AUTH_PASSWORD,
  //   ).toString("base64")}`,
  // },
});

export const config: PageConfig = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  if (req.method === "POST") {
    return POST(req);
  }
}

const POST = async (req: NextRequest) => {
  const body = await extractBody(req);

  let rawJSon: object;

  try {
    rawJSon = JSON.parse(body);
  } catch {
    return new Response(
      JSON.stringify({ message: "Request body must be valid json." }),
      {
        status: 400,
      },
    );
  }

  const parsed = IOMarketMetadata.safeParse(rawJSon);
  //const parsed = { success: true, data: rawJSon };

  const { searchParams } = new URL(req.url);

  const onlyHash = searchParams.get("only-hash") === "true" ? true : false;

  if (!parsed.success) {
    return new Response(JSON.stringify({ message: "error" }), {
      status: 400,
    });
  }
  const metadata = {
    __meta: "markets",
    ...parsed.data,
  };

  const content = JSON.stringify(metadata);
  const kbSize = Buffer.byteLength(content) / 1024;

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
  try {
    const { cid } = await node.add(
      { content },
      {
        hashAlg: "sha3-384",
        pin: !onlyHash,
        onlyHash,
      },
    );
    // if (!onlyHash) {
    //   await node.pin.add(cid);
    // }
    return new Response(
      JSON.stringify({
        message: `Market metadata ${
          onlyHash ? "hashed" : "pinned"
        } successfully.`,
        cid: cid.toString(),
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: error.message,
      }),
      {
        status: 500,
      },
    );
  }
};

// const DELETE = async (req: NextRequest) => {
//   const { cid } = JSON.parse(await extractBody(req));

//   try {
//     await node.pin.rm(IPFSHTTPClient.CID.parse(cid));

//     return new Response(
//       JSON.stringify({
//         message: `Market metadata(cid: ${cid}) unpinned successfully.`,
//       }),
//       {
//         status: 200,
//       },
//     );
//   } catch (error) {
//     return new Response(
//       JSON.stringify({
//         message: error.message,
//       }),
//       {
//         status: 500,
//       },
//     );
//   }
// };
