import { getCmsMarketMetadataForMarkets } from "lib/cms/get-market-metadata";
import { PageConfig } from "next";
import { NextRequest } from "next/server";

export const config: PageConfig = {
  runtime: "edge",
};

export default async function handler(request: NextRequest) {
  try {
    const marketIdsRaw = new URL(request.url).searchParams.get("marketIds");
    const marketIds = marketIdsRaw ? JSON.parse(marketIdsRaw) : null;

    if (!marketIds) {
      return new Response(`Request needs market ids in params`, {
        status: 400,
      });
    }

    if (!Array.isArray(marketIds)) {
      return new Response(`Request market ids needs to be an array`, {
        status: 400,
      });
    }

    const metadata = await getCmsMarketMetadataForMarkets(
      marketIds.map((m) => Number(m)),
    );

    return new Response(JSON.stringify(metadata), {
      headers: {
        "Cache-Control": "public, s-maxage=180, stale-while-revalidate=21600",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
