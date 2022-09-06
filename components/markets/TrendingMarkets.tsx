import { Skeleton } from "@material-ui/lab";
import Decimal from "decimal.js";
import { gql } from "graphql-request";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { useMarketsStore } from "lib/stores/MarketsStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import TrendingMarketCard, { TrendingMarketInfo } from "./TrendingMarketCard";

const TrendingMarkets = observer(
  ({ markets }: { markets: TrendingMarketInfo[] }) => {
    return (
      <div>
        <h5 className="font-space font-bold text-[24px] my-ztg-30">
          Trending Markets
        </h5>
        <div className="flex flex-col sm:flex-row gap-6">
          {markets == null ? (
            <Skeleton
              height={200}
              className="flex w-full !rounded-ztg-10 !transform-none"
            />
          ) : (
            markets.map((info, index) => (
              <TrendingMarketCard key={index} {...info} />
            ))
          )}
        </div>
      </div>
    );
  },
);

export default TrendingMarkets;
