import { fromString } from "@zeitgeistpm/sdk-next";
import BuySellButtons from "components/trade-slip/BuySellButtons";
import { MarketOutcome, MarketOutcomes } from "lib/types/markets";
import { useMarketCardContext } from "./context";

export type MarketCardOverlayOutcomeProps = {
  marketId: number;
  outcome: MarketOutcome;
  className?: string;
};

const MarketCardOverlayOutcome = ({
  marketId,
  outcome,
  className = "",
}: MarketCardOverlayOutcomeProps) => {
  const context = useMarketCardContext();
  return (
    <div className={"flex flex-row items-center flex-shrink-0 " + className}>
      <div
        className="w-[20px] h-[20px] rounded-full border-sky-600 border-[2px] flex-shrink-0"
        style={{ backgroundColor: `${outcome.color}` }}
      ></div>
      <div className="flex flex-col w-[95px] flex-shrink-0 ml-[7px]">
        <div className=" font-bold uppercase text-ztg-14-110 truncate h-[17px] flex-shrink-0">
          {outcome.name}
        </div>
        <div className="h-full flex flex-row items-center">
          {outcome.price && (
            <>
              <div className="font-mono text-ztg-10-150">
                {outcome.price.toFixed(3)} {context.baseAsset.toUpperCase()}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="ml-auto">
        {outcome.assetId && (
          <BuySellButtons
            assetId={fromString(outcome.assetId).unwrap()}
            disabled={outcome.assetId == null}
          />
        )}
      </div>
    </div>
  );
};

const MarketCardOverlayCategories = ({
  marketId,
  outcomes,
}: {
  marketId: number;
  outcomes: MarketOutcomes;
}) => {
  const numCategories = outcomes.length;
  return (
    <div className="flex flex-col overflow-y-scroll">
      {outcomes.map((cat, idx) => {
        const botMargin = idx === numCategories - 1 ? "mb-0" : "mb-[25px]";
        return (
          <MarketCardOverlayOutcome
            key={`cat-${idx}`}
            marketId={marketId}
            outcome={cat}
            className={botMargin}
          />
        );
      })}
    </div>
  );
};

export default MarketCardOverlayCategories;
