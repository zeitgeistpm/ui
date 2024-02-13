import { IndexedMarketCardData } from "components/markets/market-card";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";

const TrendingMarketsCompact = ({
  markets,
}: {
  markets: IndexedMarketCardData[];
}) => {
  return (
    <div>
      <div className="flex w-full flex-col divide-y divide-solid rounded-lg bg-white text-sm">
        {markets.map((market) => (
          <div className="flex p-4">
            <div className="mr-4 flex h-[45px] w-[45px] rounded-md bg-blue-500"></div>
            <div className="flex flex-col justify-center">
              <div className="text-sm">{market.question}</div>
              <div className="flex text-sm text-ztg-blue">
                <div>Outcome</div>
                <div className="ml-2 font-bold">50%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingMarketsCompact;
