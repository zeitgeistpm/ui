import Avatar from "components/ui/Avatar";
import { useMarketCmsMetadata } from "lib/hooks/queries/cms/useMarketCmsMetadata";
import { TradeItem, useLatestTrades } from "lib/hooks/queries/useLatestTrades";
import { useMarketImage } from "lib/hooks/useMarketImage";
import { formatNumberLocalized } from "lib/util";
import moment from "moment";
import Image from "next/image";
import Link from "next/link";

const LatestTradesCompact = () => {
  const { data: trades } = useLatestTrades(100);

  return (
    <div>
      <div className="flex w-full flex-col divide-y divide-solid overflow-hidden rounded-lg bg-white">
        {trades?.map((trade) => <LatestTradeRow trade={trade} />)}
      </div>
    </div>
  );
};

const LatestTradeRow = ({ trade }: { trade: TradeItem }) => {
  const now = moment();

  const { data: image } = useMarketImage({ marketId: trade.marketId });

  const { data: cmsMetadata } = useMarketCmsMetadata(trade.marketId);

  return (
    <Link
      href={`/markets/${trade.marketId}`}
      className="flex h-[70px] items-center p-4 hover:bg-[#D4E7F4]"
    >
      <div className="flex h-[30px] w-[30px] flex-none rounded-md">
        <Image
          priority
          alt="Market image"
          src={image}
          width={30}
          height={30}
          className="overflow-hidden rounded-md"
          sizes={"30px"}
          style={{
            objectFit: "cover",
            objectPosition: "50% 50%",
          }}
        />
      </div>
      <div className="ml-4 flex flex-col">
        <div className="line-clamp-1 overflow-ellipsis text-sm">
          {cmsMetadata?.question ?? trade.question}
        </div>
        <div className="flex items-center gap-x-1 text-sm text-ztg-blue">
          <Avatar size={15} address={trade.traderAddress} />
          {trade.type === "buy" ? "Bought" : "Sold"}
          <span className="font-bold">{trade.outcomeName}</span>
          <span className="hidden sm:inline">
            at {formatNumberLocalized(trade.outcomePrice.toNumber())}{" "}
            {trade.costSymbol}
          </span>
          <span className="hidden font-bold sm:inline">
            {moment.duration(now.diff(trade.time)).humanize()} ago
          </span>
        </div>
      </div>
    </Link>
  );
};

export default LatestTradesCompact;
