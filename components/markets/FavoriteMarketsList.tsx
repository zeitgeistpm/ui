import { ScalarRangeType } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useFavoriteMarkets } from "lib/hooks/queries/useFavoriteMarkets";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";
import Loader from "react-spinners/PulseLoader";
import MarketCard from "./market-card/index";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";

export type FavoriteMarketsListProps = {
  className?: string;
};

const FavoriteMarketsList = ({ className = "" }: FavoriteMarketsListProps) => {
  const {
    data: markets,
    isFetching: isFetchingMarkets,
    isLoading,
  } = useFavoriteMarkets();

  const count = markets?.length ?? 0;

  const { data: stats } = useMarketsStats(
    markets?.map((m) => m.marketId) ?? [],
  );

  return (
    <div
      className={"mb-[38px] scroll-mt-[40px] " + className}
      data-testid="marketsList"
      id={"market-list"}
    >
      <div className="mb-8 mt-8 flex items-center gap-3">
        <MdFavorite className=" text-red-600" size={28} />
        <h3 className="text-2xl">Favorite Markets</h3>
      </div>
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
        {markets?.map((market) => {
          const volume = market.volume;
          const scalarType = market.scalarType as ScalarRangeType;
          const stat = stats?.find((s) => s.marketId === market.marketId);
          const question = market.question ?? "";
          const image = market.img ?? "";
          //check if market is categorical or scalar
          let { categorical, scalar } = market.marketType ?? {};
          if (categorical === null) {
            categorical = "";
          }
          const filteredScalar =
            scalar?.filter((item): item is string => item !== null) ?? [];
          const marketType = { categorical, scalar: filteredScalar };
          const pool = market.pool ?? null;
          const tags =
            market.tags?.filter((tag): tag is string => tag !== null) ?? [];

          return (
            <MarketCard
              marketId={market.marketId}
              outcomes={market.outcomes}
              question={question}
              creation={market.creation}
              creator={market.creator}
              img={image}
              prediction={market.prediction}
              endDate={market.period.end}
              marketType={marketType}
              scalarType={scalarType}
              pool={pool}
              neoPool={market.neoPool}
              status={market.status}
              baseAsset={market.baseAsset}
              volume={new Decimal(volume).div(ZTG).toNumber()}
              tags={tags}
              numParticipants={stat?.participants}
              liquidity={stat?.liquidity}
              key={`market-${market.marketId}`}
            />
          );
        })}
      </div>
      {!(isFetchingMarkets || isLoading) && count === 0 && (
        <div className="text-center">You have no favorite markets.</div>
      )}
    </div>
  );
};

export default FavoriteMarketsList;
