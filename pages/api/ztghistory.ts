import { NextApiRequest, NextApiResponse } from "next";

export default async function getIPLocation(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const coingeckoResponse = await fetch(
    `https://api.coingecko.com/api/v3/coins/zeitgeist/market_chart?vs_currency=usd&days=7`,
  );
  const data = await coingeckoResponse.json();

  response.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate");

  response.status(200).json({
    body: data,
  });
}
