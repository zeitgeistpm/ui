import { getCmsMarketMetadataForMarket } from "lib/cms/get-market-metadata";
import { NextApiRequest, NextApiResponse, PageConfig } from "next";

export const config: PageConfig = {
  runtime: "edge",
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const { marketid } = request.query;

  if (!marketid) {
    return response
      .status(404)
      .json({ error: `Request needs market id in params` });
  }

  const metadata = await getCmsMarketMetadataForMarket(Number(marketid));

  return response
    .setHeader(
      "Cache-Control",
      "public, s-maxage=180, stale-while-revalidate=21600",
    )
    .status(200)
    .json(metadata);
}
