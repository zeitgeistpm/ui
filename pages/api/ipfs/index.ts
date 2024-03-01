import { create as createIPFSClient } from "ipfs-http-client";
import { extractBody } from "lib/edge/extract-body";
import type { PageConfig } from "next";
import type { NextRequest } from "next/server";
import { fromZodError } from "zod-validation-error";
import { IOMarketMetadata } from "./types";
import { tryCatch } from "@zeitgeistpm/utility/dist/either";
import { NextApiRequest, NextApiResponse } from "next";

export const config: PageConfig = {
  runtime: "nodejs",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    return POST(req, res);
  }
}

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const node = createIPFSClient({
    url: process.env.NEXT_PUBLIC_IPFS_NODE_URL,
    headers: {
      Authorization: `Basic ${Buffer.from(
        process.env.IPFS_NODE_BASIC_AUTH_USERNAME +
          ":" +
          process.env.IPFS_NODE_BASIC_AUTH_PASSWORD,
      ).toString("base64")}`,
    },
  });

  const parsed = IOMarketMetadata.safeParse(req.body);

  const onlyHash = req.query["only-hash"] === "true" ? true : false;

  if (!parsed.success) {
    return res.status(400).json({
      message: fromZodError(parsed.error).toString(),
    });
  }

  const metadata = {
    __meta: "markets",
    ...parsed.data,
  };

  const content = JSON.stringify(metadata);
  const kbSize = Buffer.byteLength(content) / 1024;

  if (kbSize > 10) {
    return res.status(400).json({
      message: "Market metadata is too large. Please keep it under 10kb.",
    });
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

    return res.status(200).json({
      message: `Market metadata ${
        onlyHash ? "hashed" : "pinned"
      } successfully.`,
      cid: cid.toString(),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
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
