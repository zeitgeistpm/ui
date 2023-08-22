import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const asset = request.query["asset"];

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${asset}&vs_currencies=usd`,
  );
  const json = await res.json();

  const price = asset
    ? json[Array.isArray(asset) ? asset[0] : asset]?.usd
    : null;

  response.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=300"); //Vercel's Edge Cache to have a TTL (Time To Live) of 300 seconds
  response.setHeader("CDN-Cache-Control", "public, s-maxage=60"); //Downstream CDNs to have a TTL of 60 seconds
  response.setHeader(
    "Cache-Control",
    "public, s-maxage=10, stale-while-revalidate=10", //Clients to have a TTL of 10 seconds
  );
  return response.status(200).json({
    body: {
      price,
    },
  });
}
