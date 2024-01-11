import { create } from "@zeitgeistpm/indexer";
import type { FullMarketFragment, PoolWhereInput } from "@zeitgeistpm/indexer";
import { parseAssetId } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { graphQlEndpoint, ZTG } from "lib/constants";
import {
  CurrencyMetadata,
  getMetadataForCurrencyByAssetId,
} from "lib/constants/supported-currencies";
import { getCurrentPrediction } from "lib/util/assets";
import moment from "moment";
import type { NextApiRequest, NextApiResponse } from "next";

const sdkPromise = create({
  uri: graphQlEndpoint,
});

export type MarketImageData = {
  market: FullMarketFragment;
  prediction: ReturnType<typeof getCurrentPrediction>;
  volume: string;
  ends: string;
  currencyMetadata?: CurrencyMetadata;
};

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

  const assetId = parseAssetId(market.baseAsset).unwrap();
  const currencyMetadata = getMetadataForCurrencyByAssetId(assetId);

  if (!market) {
    return response
      .status(404)
      .json({ error: `No market found by id ${marketId}` });
  }

  let prediction: { name: string; price: number; percentage: number } = {
    name: "",
    percentage: 0,
    price: 0,
  };

  if (market.pool || market.neoPool) {
    prediction = getCurrentPrediction(market.assets as any, market);
  }

  const volume = new Decimal(market.pool?.volume ?? market.neoPool?.volume ?? 0)
    .div(ZTG)
    .toFixed(2);

  const ends = moment(Number(market.period.end)).format("MMM Do, YYYY");

  const data: MarketImageData = {
    market,
    prediction,
    volume,
    ends,
    currencyMetadata,
  };

  return response.status(200).json(data);
}
