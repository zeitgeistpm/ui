import { getCmsMarketMetadataFormMarket } from "lib/cms/get-market-metadata";
import { NextApiRequest, NextApiResponse } from "next";

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

  const metadata = await getCmsMarketMetadataFormMarket(Number(marketid));

  return response.status(200).json(metadata);
}
