import { create } from "@zeitgeistpm/indexer";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { getCurrentPrediction } from "lib/util/assets";
import moment from "moment";
import type { NextApiRequest, NextApiResponse } from "next";

const sdkPromise = create({
  uri: process.env.NEXT_PUBLIC_SSR_INDEXER_URL,
});

export default async function (
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const sdk = await sdkPromise;
  const { marketId } = request.query;

  const { markets } = await sdk.markets({
    where: {
      marketId_eq: Number(marketId),
    },
  });

  const market = markets[0];

  if (!market) {
    return new Response(`no market found by id ${marketId}`, {
      status: 404,
    });
  }

  let prediction: { outcome: string; percentage: number } = {
    outcome: "No Prediction",
    percentage: 0,
  };

  if (market.pool) {
    const { assets } = await sdk.assets({
      where: {
        poolId_eq: market.pool.poolId,
      },
    });

    prediction = getCurrentPrediction(assets as any, market as any);
  }

  const volume = new Decimal(market.pool?.volume).div(ZTG).toFixed(2);

  const ends = moment(Number(market.period.end)).format("MMM Do, YYYY");

  return response.status(200).json({
    market,
    prediction,
    volume,
    ends,
  });
}
