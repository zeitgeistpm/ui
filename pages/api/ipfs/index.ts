import { IOMarketMetadata } from "@zeitgeistpm/sdk";
import { create as createIPFSClient } from "ipfs-http-client";
import type { PageConfig } from "next";
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

const MAX_METADATA_SIZE_KB = 10;

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

  const [error, metadata] = IOMarketMetadata.validate(req.body);

  const onlyHash = req.query["only-hash"] === "true" ? true : false;

  if (error) {
    return res
      .status(400)
      .setHeader("Content-Type", "application/problem+json; charset=utf-8")
      .send(
        JSON.stringify({
          title: "Invalid Market Metadata",
          detail: "The market metadata provided is invalid.",
          message: "The market metadata provided is invalid.",
          context: {
            failures: error.failures(),
          },
        }),
      );
  }

  const content = JSON.stringify(metadata);
  const kbSize = Buffer.byteLength(content) / 1024;

  if (kbSize > MAX_METADATA_SIZE_KB) {
    return res
      .status(400)
      .setHeader("Content-Type", "application/problem+json; charset=utf-8")
      .send(
        JSON.stringify({
          title: "Invalid Market Metadata",
          detail: `Market metadata is too large. Please keep it under ${MAX_METADATA_SIZE_KB}kb.`,
          message: `Market metadata is too large. Please keep it under ${MAX_METADATA_SIZE_KB}kb.`,
          context: {
            maxKb: MAX_METADATA_SIZE_KB,
            metadataSizeKb: kbSize,
          },
        }),
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