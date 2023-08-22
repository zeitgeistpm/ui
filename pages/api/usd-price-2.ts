import { NextApiRequest, NextApiResponse } from "next";

export default async function getIPLocation(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const asset = request.query["asset"];
  console.log("asset:", asset);

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${asset}&vs_currencies=usd`,
  );
  console.log(res.status);
  console.log(res.statusText);

  const json = await res.json();
  console.log(json);

  const price = asset
    ? json[Array.isArray(asset) ? asset[0] : asset]?.usd
    : null;
  response.status(200).json({
    body: {
      price,
    },
  });
}
