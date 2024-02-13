import { useFavoriteMarkets } from "lib/hooks/queries/useFavoriteMarkets";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";
import { MdFavorite } from "react-icons/md";
import MarketCard from "./market-card/index";

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
          const stat = stats?.find((s) => s.marketId === market.marketId);
          return (
            <MarketCard
              key={market.marketId}
              market={market}
              numParticipants={stat?.participants}
              liquidity={stat?.liquidity}
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
