import { Skeleton } from "@material-ui/lab";
import Decimal from "decimal.js";
import { gql } from "graphql-request";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { useMarketsStore } from "lib/stores/MarketsStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import TrendingMarketCard, { TrendingMarketInfo } from "./TrendingMarketCard";

const TrendingMarkets = observer(() => {
  const { graphQLClient } = useStore();
  const marketsStore = useMarketsStore();
  const [trendingMarkets, setTrendingMarkets] =
    useState<TrendingMarketInfo[]>();

  useEffect(() => {
    if (!graphQLClient) return;
    const fetchTrendingMarkets = async () => {
      const dateTwoWeeksAgo = new Date(
        new Date().getTime() - DAY_SECONDS * 14 * 1000
      ).toISOString();

      const query = gql`
        query TrendingMarkets($dateTwoWeeksAgo: DateTime) {
          pools(
            limit: 3
            orderBy: volume_DESC
            where: { createdAt_gt: $dateTwoWeeksAgo }
          ) {
            volume
            marketId
            createdAt
          }
        }
      `;

      const response = await graphQLClient.request<{
        pools: {
          marketId: number;
          volume: number;
        }[];
      }>(query, {
        dateTwoWeeksAgo,
      });

      const trendingPools = response.pools;

      const trendingMarkets = await Promise.all(
        response.pools.map((pool) => marketsStore.getMarket(pool.marketId))
      );

      const marketPredictions = await Promise.all(
        trendingMarkets.map((market) => market.calcPrediction())
      );

      const trendingMarketsInfo: TrendingMarketInfo[] = trendingMarkets.map(
        (market, index) => ({
          marketId: market.id,
          name: market.slug,
          volume: new Decimal(trendingPools[index].volume).div(ZTG).toFixed(0),
          img: market.img,
          outcomes:
            market.type === "categorical"
              ? (market.marketOutcomes.length - 1).toString()
              : "Long/Short",
          prediction: marketPredictions[index],
        })
      );

      setTrendingMarkets(trendingMarketsInfo);
    };
    fetchTrendingMarkets();
  }, [graphQLClient]);

  return (
    <div>
      <h5 className="font-kanit font-bold text-ztg-28-120 my-ztg-30">
        Trending Markets
      </h5>
      <div className="flex flex-col sm:flex-row gap-6">
        {trendingMarkets == null ? (
          <Skeleton
            height={200}
            className="flex w-full !rounded-ztg-10 !transform-none"
          />
        ) : (
          trendingMarkets.map((info, index) => (
            <TrendingMarketCard key={index} {...info} />
          ))
        )}
      </div>
    </div>
  );
});

export default TrendingMarkets;
