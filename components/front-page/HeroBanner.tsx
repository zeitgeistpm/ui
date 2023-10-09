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
  const chartData = ztgHistory.prices.map(([timestamp, price]) => {
    return { v: price, t: 1 };
  });

  const firstPrice = ztgHistory.prices[0][1];
  const latestPrice = ztgHistory.prices[ztgHistory.prices.length - 1][1];
  const prctChange = ((latestPrice - firstPrice) / firstPrice) * 100;

  return (
    <div className="relative main-container mt-12 md:mt-18 mb-20 z-2">
      <div className="relative flex flex-col-reverse md:flex-row md:gap-8">
        <div className="md:w-[890px] lg:w-[690px] md:pt-8">
          <h1 className="text-5xl mb-8 leading-tight">
            Welcome to the Future of Betting
          </h1>
          <h2 className="text-xl mb-8 leading-6">
            Zeitgeist is a new innovative platform for predicting future events
          </h2>
          <div className="flex gap-4 mb-14">
            <Link
              href="https://zeitgeist.pm/"
              target="_blank"
              className="rounded-md flex-1 sm:flex-none bg-vermilion border-2 border-vermilion text-white px-6 py-3"
            >
              Learn More
            </Link>
            <Link
              href="/create-account"
              className="rounded-md flex-1 sm:flex-none bg-transparent border-2 border-black text-black px-6 py-3"
            >
              Get Started
            </Link>
          </div>
          <div
            className="py-3 px-4 w-full rounded-md flex gap-2"
            style={{ backgroundColor: "rgba(28, 100, 242, 0.2)" }}
          >
            <div className="flex justify-start items-center gap-3 w-1/3">
              <div>
                <ZeitgeistIcon variant="blue" height={32} width={32} />
              </div>
              <div>
                <div className="text-lg font-medium">Zeitgeist</div>
                <div className="text-sm">
                  {chainProperties.tokenSymbol.toString()}
                </div>
              </div>
            </div>
            <div className="flex center w-1/3">
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
            <div className="flex justify-end items-center gap-2 flex-1">
              <div>
                <div className="font-semibold text-md text-center">
                  ${latestPrice.toFixed(3)}
                </div>
                <div className="text-sm text-center">
                  {!isNaN(prctChange) ? prctChange.toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-64 md:h-auto relative rounded-lg overflow-hidden mb-8 md:mb-0">
          <Image
            alt="Futuristic City Image"
            fill={true}
            sizes="100vw"
            priority
            className="object-cover"
            blurDataURL={bannerPlaceholder}
            placeholder="blur"
            src="/banner.png"
          />
        </div>
      </div>
    </div>
  );
};
