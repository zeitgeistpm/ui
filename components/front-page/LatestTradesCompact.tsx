import { useLatestTrades } from "lib/hooks/queries/useLatestTrades";
import moment from "moment";
import Avatar from "components/ui/Avatar";
import { formatNumberLocalized } from "lib/util";

const LatestTradesCompact = () => {
  const { data: trades } = useLatestTrades(4);
  const now = moment();

  return (
    <div>
      <div className="flex w-full flex-col divide-y divide-solid rounded-lg bg-white">
        {trades?.map((trade) => (
          <div className="flex p-4">
            <div className="mr-4 flex h-[45px] w-[45px] rounded-md bg-blue-500"></div>
            <div className="flex flex-col">
              <div>{trade.question}</div>
              <div className="flex items-center gap-x-1 text-ztg-blue">
                <Avatar size={15} address={trade.traderAddress} />
                {trade.type === "buy" ? "Bought" : "Sold"}
                <span className="font-bold">{trade.outcomeName}</span>
                at {formatNumberLocalized(trade.outcomePrice.toNumber())}{" "}
                {trade.costSymbol}
                <span className="font-bold">
                  {moment.duration(now.diff(trade.time)).humanize()} ago
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatestTradesCompact;
