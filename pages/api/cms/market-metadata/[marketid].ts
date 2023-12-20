import { getCmsMarketMetadataForMarket } from "lib/cms/get-market-metadata";
import { PageConfig } from "next";
import { NextRequest } from "next/server";

export const config: PageConfig = {
  runtime: "edge",
};

export default async function handler(request: NextRequest) {
  const marketId = new URL(request.url).searchParams.get("marketid");

  if (!marketId) {
    return new Response(`Request needs market id in params`, {
      status: 400,
    });
  }

  const metadata = await getCmsMarketMetadataForMarket(Number(marketId));

  return new Response(JSON.stringify(metadata), {
    headers: {
      "Cache-Control": "public, s-maxage=180, stale-while-revalidate=21600",
    },
  });
}
