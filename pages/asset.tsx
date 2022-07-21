import { NextPage } from "next";
import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import { observer } from "mobx-react";
import InfoBoxes from "components/ui/InfoBoxes";
import TimeSeriesChart, { ChartData } from "components/ui/TimeSeriesChart";
import { ArrowLeft } from "react-feather";
import { useEffect, useState } from "react";
import { useMarketsStore } from "lib/stores/MarketsStore";
import { useStore } from "lib/stores/Store";
import { createBlocksArray, formatBal, paramsForBlocksArray } from "lib/util";
import { useRouter } from "next/router";
import { DAY_SECONDS } from "lib/constants";
import { usePoolsStore } from "lib/stores/PoolsStore";

interface AssetDetailProps {
  header: string;
  middle: string;
  bottom: string;
}

const AssetDetail = ({ header, middle, bottom }: AssetDetailProps) => {
  return (
    <div className="flex flex-col h-ztg-89 w-full rounded-ztg-10 bg-sky-100 dark:bg-black p-ztg-15 mx-ztg-10">
      <div className="font-lato text-sky-600 text-ztg-12-150 font-bold">
        {header}
      </div>
      <div className="font-bold font-mono text-ztg-14-150">{middle}</div>
      <div className="font-mono text-ztg-12-150 text-sky-600">{bottom}</div>
    </div>
  );
};

const AssetPage: NextPage = observer(() => {
  const markets = useMarketsStore();
  const poolStore = usePoolsStore();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [pricePerShare, setPricePerShare] = useState<number>();
  const [totalValue, setTotalValue] = useState<number>();
  const [change24hrs, setChange24hrs] = useState<string>();
  const [assetTicker, setAssetTicker] = useState<string>();
  const [assetColor, setAssetColor] = useState<string>();
  const [assetAmount, setAssetAmount] = useState<string>();
  const store = useStore();
  const router = useRouter();

  const marketId = Number(router.query.marketId);
  const assetId: AssetId = JSON.parse(
    router.query.assetId as string
  ) as AssetId;

  const getAssetAmountForAddress = async (address: string) => {
    const assetData = await store.sdk.api.query.tokens.accounts(
      address,
      assetId
    );
    const assetDataJson = assetData.toJSON();
    //@ts-ignore
    return assetDataJson ? formatBal(assetDataJson.free.toString()) : "0";
  };

  useEffect(() => {
    const blockTime = store.config.blockTimeSec;

    const { blockResolution, startBlock: startingBlockNumber } =
      paramsForBlocksArray(
        store.blockNumber.toNumber() - 219000,
        store.blockNumber.toNumber(),
        2000 // ~every 200 mins
      );

    const blocks = createBlocksArray(
      startingBlockNumber,
      blockResolution,
      store.blockNumber.toNumber()
    );

    const startingTime =
      new Date().getTime() -
      blockTime * (blocks[blocks.length - 1] - blocks[0]) * 1000;

    (async () => {
      if (store.wallets.activeAccount?.address) {
        const amount = await getAssetAmountForAddress(
          store.wallets.activeAccount.address
        );
        setAssetAmount(amount);
      }
      //@ts-ignore
      const asset = assetId.categoricalOutcome[1];

      const market = await markets.getMarket(marketId);
      const marketOutcome = market.getMarketOutcome(assetId);
      setAssetColor(marketOutcome.metadata["color"]);
      setAssetTicker(marketOutcome.metadata["ticker"]);
      const poolId = market.pool.poolId;
      if (poolId) {
        const dateOneWeekAgo = new Date(
          new Date().getTime() - DAY_SECONDS * 28 * 1000
        ).toISOString();
        const priceHistory = await store.sdk.models.getAssetPriceHistory(
          marketId,
          asset,
          dateOneWeekAgo
        );

        const chartData = priceHistory.map((history) => {
          return {
            t: new Date(history.timestamp).getTime(),
            v: history.newPrice,
          };
        });
        const pool = await poolStore.getPoolFromChain(poolId);
        setChartData(chartData);

        const sharePrice = pool.assets.find((a) => a.id === asset)?.price ?? 0;
        setPricePerShare(sharePrice);

        const percentageChange = 0;

        setChange24hrs(
          `${percentageChange > 0 ? "+" : ""}${percentageChange}%`
        );
        const totalSupply = await store.sdk.api.query.tokens.totalIssuance(
          assetId
        );

        setTotalValue(Math.round(Number(totalSupply) / 10000000000));
      }
    })();
  }, [store.wallets.activeAccount?.address]);

  const calculate24hrChange = (
    blockTime: number,
    blockResolution: number,
    priceHistory: { v: number; t: number }[]
  ) => {
    const timePerBlock = blockTime * blockResolution;
    const blockArrayDistance24hrsAgo = Math.round(
      (24 * 60 * 60) / timePerBlock
    );
    const currentPrice = priceHistory[priceHistory.length - 1].v;
    let Hr24AgoId = priceHistory.length - 1 - blockArrayDistance24hrsAgo;
    Hr24AgoId = Hr24AgoId < 0 ? 0 : Hr24AgoId;
    const price24hrAgo = priceHistory[Hr24AgoId].v;

    return currentPrice !== 0 && price24hrAgo !== 0
      ? Math.round((currentPrice / price24hrAgo - 1) * 100)
      : 0;
  };

  const navigateBack = () => {
    router.back();
  };

  return (
    <>
      <InfoBoxes />
      <div className="flex my-ztg-28 items-center">
        <ArrowLeft
          className="cursor-pointer text-sky-600"
          onClick={navigateBack}
        />
        <h2 className="header ml-ztg-16">Portfolio</h2>
      </div>
      <div className="flex">
        <div className="flex flex-col">
          <div className="text-ztg-10-150 font-lato uppercase font-bold text-sky-600 mb-ztg-4">
            Asset
          </div>
          <div className="flex items-center justify-center h-ztg-38 bg-sky-300 text-black dark:bg-sky-700 dark:text-white  px-ztg-10 font-space text-ztg-22-120 font-bold rounded-ztg-5">
            <div
              className="rounded-full w-ztg-20 h-ztg-20 mr-ztg-10 border-sky-600 border-2"
              style={{ background: assetColor }}
            ></div>
            <div>{assetTicker}</div>
          </div>
        </div>
        <div className="flex flex-col ml-ztg-19">
          <div className="text-ztg-10-150 font-lato uppercase font-bold text-sky-600 mb-ztg-4">
            Amount
          </div>
          <div className="flex items-center font-mono text-ztg-18-150 font-bold h-ztg-38 dark:bg-black px-ztg-15 rounded-ztg-5">
            <span className="">{assetAmount}</span>
          </div>
        </div>
      </div>
      <div className="-ml-ztg-10 mt-ztg-20">
        <TimeSeriesChart
          data={chartData}
          series={[{ accessor: "v", label: "Price" }]}
        />
      </div>
      <div className="flex flex-row mt-ztg-39 mb-ztg-69">
        <AssetDetail
          header="Price per Share"
          middle={`${pricePerShare} ${store.config.tokenSymbol}`}
          bottom="$0"
        />
        <AssetDetail
          header="Total Supply"
          middle={`${totalValue}`}
          bottom="$0"
        />
        <AssetDetail header="24hrs" middle={change24hrs} bottom="" />
      </div>
    </>
  );
});

export default AssetPage;
