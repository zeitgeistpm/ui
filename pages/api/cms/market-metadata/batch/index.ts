import { getCmsMarketMetadataForMarkets } from "lib/cms/get-market-metadata";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const marketIds = JSON.parse(request.query.marketIds as string);

    if (!marketIds) {
      return response
        .status(400)
        .json({ error: `Request needs market id in params` });
    }

    if (!Array.isArray(marketIds)) {
      return response
        .status(400)
        .json({ error: `Request market ids needs to be an array` });
    }

    const metadata = await getCmsMarketMetadataForMarkets(
      marketIds.map((m) => Number(m)),
    );

    return response
      .setHeader(
        "Cache-Control",
        "public, s-maxage=180, stale-while-revalidate=21600",
      )
      .status(200)
      .json(metadata);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
