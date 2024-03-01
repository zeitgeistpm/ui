import ZeitgeistIcon from "components/icons/ZeitgeistIcon";
import { getColour } from "components/ui/TableChart";
import { GenericChainProperties } from "@polkadot/types";
import { ZtgPriceHistory } from "lib/hooks/queries/useAssetUsdPrice";
import Image from "next/image";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import Link from "next/link";

export const HeroBanner = ({
  ztgHistory,
  chainProperties,
  bannerPlaceholder,
}: {
  ztgHistory: ZtgPriceHistory;
  bannerPlaceholder: string;
  chainProperties: GenericChainProperties;
}) => {
  return (
    <div className="main-container md:mt-18 z-2 relative mb-14 mt-12">
      <div className="flex h-[220px] flex-col-reverse md:flex-row md:gap-8">
        <div className="mb-8 flex w-2/3 overflow-hidden rounded-lg md:mb-0">
          <div className="flex h-full w-1/2 flex-col gap-y-8 bg-black px-[30px] py-[20px]">
            <div className="text-3xl font-bold leading-8 text-white">
              Welcome to the Future of Betting
            </div>
            <PriceWidget
              ztgHistory={ztgHistory}
              chainProperties={chainProperties}
            />
          </div>
          <div className="relative mb-8 h-64 w-1/2 overflow-hidden md:mb-0 md:h-auto">
            <Image
              alt="Futuristic City Image"
              fill={true}
              sizes="100vw"
              priority
              className="w-1/2 object-cover"
              blurDataURL={bannerPlaceholder}
              placeholder="blur"
              src="/banner.png"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const PriceWidget = ({
  ztgHistory,
  chainProperties,
}: {
  ztgHistory: ZtgPriceHistory;
  chainProperties: GenericChainProperties;
}) => {
  const chartData = ztgHistory.prices.map(([timestamp, price]) => {
    return { v: price, t: 1 };
  });

  const firstPrice = ztgHistory.prices[0][1];
  const latestPrice = ztgHistory.prices[ztgHistory.prices.length - 1][1];
  const prctChange = ((latestPrice - firstPrice) / firstPrice) * 100;
  return (
    <a
      href="https://www.coingecko.com/en/coins/zeitgeist"
      target="_blank"
      className="flex w-full gap-2 rounded-md border-1 border-sky-700 px-4 py-3"
      style={{ backgroundColor: "rgba(28, 100, 242, 0.2)" }}
    >
      <div className="flex w-1/3 items-center justify-start gap-3">
        <div>
          <ZeitgeistIcon variant="light" height={30} width={30} />
        </div>
        <div>
          <div className="font-medium text-white">Zeitgeist</div>
          <div className="text-sm text-white">
            {chainProperties.tokenSymbol.toString()}
          </div>
        </div>
      </div>
      <div className="center flex w-1/3">
        <ResponsiveContainer width={"100%"} height="65%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="v"
              dot={false}
              strokeWidth={2}
              stroke={getColour(
                chartData[0].v,
                chartData[chartData.length - 1].v,
              )}
            />
            <YAxis hide={true} domain={["dataMin", "dataMax"]} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex w-full items-center justify-center gap-2">
        <div>
          <div className="text-center text-white">
            ${latestPrice.toFixed(3)}
          </div>
          <div className="text-center text-sm text-white">
            {!isNaN(prctChange) ? prctChange.toFixed(1) : 0}%
          </div>
        </div>
      </div>
    </a>
  );
};
