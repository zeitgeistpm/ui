import { Transition } from "@headlessui/react";
import { FullPoolFragment } from "@zeitgeistpm/indexer";
import { parseAssetId } from "@zeitgeistpm/sdk-next";
import { MarketDispute, Report } from "@zeitgeistpm/sdk/dist/types";
import LiquidityModal from "components/liquidity/LiquidityModal";
import PoolTable from "components/liquidity/PoolTable";
import MarketAddresses from "components/markets/MarketAddresses";
import MarketAssetDetails from "components/markets/MarketAssetDetails";
import MarketChart from "components/markets/MarketChart";
import MarketHeader from "components/markets/MarketHeader";
import PoolDeployer from "components/markets/PoolDeployer";
import { MarketPromotionCallout } from "components/markets/PromotionCallout";
import MarketMeta from "components/meta/MarketMeta";
import MarketImage from "components/ui/MarketImage";
import Modal from "components/ui/Modal";
import { filters } from "components/ui/TimeFilters";
import { ChartSeries } from "components/ui/TimeSeriesChart";
import { GraphQLClient } from "graphql-request";
import BuySellFullSetsButton from "components/markets/BuySellFullSetsButton";
import {
  getMarketPromotion,
  PromotedMarket,
} from "lib/cms/get-promoted-markets";
import { graphQlEndpoint, ZTG } from "lib/constants";
import {
  getMarket,
  getRecentMarketIds,
  MarketPageIndexedData,
} from "lib/gql/markets";
import { getResolutionTimestamp } from "lib/gql/resolution-date";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useMarketPoolId } from "lib/hooks/queries/useMarketPoolId";
import {
  getPriceHistory,
  PriceHistory,
} from "lib/hooks/queries/useMarketPriceHistory";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { usePoolLiquidity } from "lib/hooks/queries/usePoolLiquidity";
import { usePrizePool } from "lib/hooks/queries/usePrizePool";
import { formatNumberLocalized } from "lib/util";
import { calcPriceHistoryStartDate } from "lib/util/calc-price-history-start";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown } from "react-feather";
import Decimal from "decimal.js";

export const QuillViewer = dynamic(
  () => import("../../components/ui/QuillViewer"),
  {
    ssr: false,
  },
);

export async function getStaticPaths() {
  const client = new GraphQLClient(graphQlEndpoint);
  const marketIds = await getRecentMarketIds(client);

  const paths = marketIds.map((market) => ({
    params: { marketid: market.toString() },
  }));

  return { paths, fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const client = new GraphQLClient(graphQlEndpoint);

  const [market, promotionData] = await Promise.all([
    getMarket(client, params.marketid),
    getMarketPromotion(Number(params.marketid)),
  ]);

  const chartSeries: ChartSeries[] = market?.categories?.map(
    (category, index) => {
      return {
        accessor: `v${index}`,
        label: category.name,
        color: category.color,
      };
    },
  );

  let priceHistory: PriceHistory[];
  let resolutionTimestamp: string;
  if (market.pool) {
    const chartFilter = filters[1];

    resolutionTimestamp = await getResolutionTimestamp(client, market.marketId);

    const chartStartDate = calcPriceHistoryStartDate(
      market.status,
      chartFilter,
      new Date(market.pool.createdAt),
      new Date(resolutionTimestamp),
    );

    priceHistory = await getPriceHistory(
      client,
      market.marketId,
      chartFilter.intervalUnit,
      chartFilter.intervalValue,
      chartStartDate.toISOString(),
    );
  }

  return {
    props: {
      indexedMarket: market ?? null,
      chartSeries: chartSeries ?? null,
      priceHistory: priceHistory ?? null,
      resolutionTimestamp: resolutionTimestamp ?? null,
      promotionData,
    },
    revalidate: 10 * 60, //10mins
  };
}

type MarketPageProps = {
  indexedMarket: MarketPageIndexedData;
  chartSeries: ChartSeries[];
  priceHistory: PriceHistory[];
  resolutionTimestamp: string;
  promotionData: PromotedMarket | null;
};

const Market: NextPage<MarketPageProps> = ({
  indexedMarket,
  chartSeries,
  priceHistory,
  resolutionTimestamp,
  promotionData,
}) => {
  const [lastDispute, setLastDispute] = useState<MarketDispute>(null);
  const [report, setReport] = useState<Report>(null);
  const router = useRouter();
  const { marketid } = router.query;
  const marketId = Number(marketid);
  const { data: prizePool } = usePrizePool(marketId);
  const { data: marketSdkv2, isLoading: marketIsLoading } = useMarket({
    marketId,
  });
  const { data: disputes } = useMarketDisputes(marketId);

  const { data: marketStage } = useMarketStage(marketSdkv2);
  const { data: spotPrices } = useMarketSpotPrices(marketId);
  const { data: liquidity } = usePoolLiquidity({ marketId });
  const { data: poolId, isLoading: poolIdLoading } = useMarketPoolId(marketId);
  const baseAsset = parseAssetId(indexedMarket.pool?.baseAsset).unrightOr(null);
  const { data: metadata } = useAssetMetadata(baseAsset);

  const [liquidityOpen, setLiquidityOpen] = useState(false);

  if (indexedMarket == null) {
    return <NotFoundPage backText="Back To Markets" backLink="/" />;
  }

  useEffect(() => {
    if (disputes && marketSdkv2?.status === "Disputed") {
      const lastDispute = disputes?.[disputes.length - 1];
      const at = lastDispute.at.toNumber();
      const by = lastDispute.by.toString();
      const outcome = marketSdkv2?.marketType.scalar
        ? lastDispute?.outcome?.asScalar.toNumber()
        : lastDispute?.outcome?.asCategorical.toNumber();
      const marketDispute: MarketDispute = {
        at,
        by,
        outcome: {
          categorical: outcome,
          scalar: outcome,
        },
      };
      setLastDispute(marketDispute);
    }
    if (marketSdkv2?.report && marketSdkv2?.status === "Reported") {
      const report: Report = {
        at: marketSdkv2?.report?.at,
        by: marketSdkv2?.report?.by,
        outcome: {
          categorical: marketSdkv2?.report?.outcome?.categorical,
          scalar: marketSdkv2?.report?.outcome?.scalar,
        },
      };
      setReport(report);
    }
  }, [disputes, marketSdkv2?.report]);

  //data for MarketHeader
  const token = metadata?.symbol;

  const subsidy =
    marketSdkv2?.pool?.poolId == null ? 0 : liquidity?.div(ZTG).toNumber();

  return (
    <>
      <MarketMeta market={indexedMarket} />
      <div>
        <MarketImage
          image={indexedMarket.img}
          alt={`Image depicting ${indexedMarket.question}`}
          size="120px"
          status={indexedMarket.status}
          className="mx-auto"
        />

        <div className="mt-4">
          {promotionData && (
            <MarketPromotionCallout
              market={indexedMarket}
              promotion={promotionData}
            />
          )}
        </div>

        <MarketHeader
          market={indexedMarket}
          resolvedOutcome={marketSdkv2?.resolvedOutcome}
          report={report}
          disputes={lastDispute}
          token={token}
          prizePool={prizePool?.div(ZTG).toNumber()}
          subsidy={subsidy}
          marketStage={marketStage}
          rejectReason={marketSdkv2?.rejectReason}
        />
        {marketSdkv2?.rejectReason && marketSdkv2.rejectReason.length > 0 && (
          <div className="mt-[10px] text-ztg-14-150">
            Market rejected: {marketSdkv2.rejectReason}
          </div>
        )}

        {chartSeries && indexedMarket?.pool?.poolId ? (
          <MarketChart
            marketId={indexedMarket.marketId}
            chartSeries={chartSeries}
            initialData={priceHistory}
            baseAsset={indexedMarket.pool.baseAsset}
            poolCreationDate={new Date(indexedMarket.pool.createdAt)}
            marketStatus={indexedMarket.status}
            resolutionDate={new Date(resolutionTimestamp)}
          />
        ) : (
          <></>
        )}
        {poolId == null && poolIdLoading === false && (
          <div className="flex h-ztg-22 items-center bg-vermilion-light text-vermilion p-ztg-20 rounded-ztg-5">
            <div className="w-ztg-20 h-ztg-20">
              <AlertTriangle size={20} />
            </div>
            <div
              className="text-ztg-12-120 ml-ztg-10 "
              data-test="liquidityPoolMessage"
            >
              This market doesn't have a liquidity pool and therefore cannot be
              traded
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-center text-2xl mt-10 mb-8">Predictions</h3>
          <MarketAssetDetails marketId={Number(marketid)} />
        </div>

        <div className="lg:px-36 mb-12">
          {indexedMarket.description?.length > 0 && (
            <>
              <h3 className="text-center text-2xl mb-5">About Market</h3>
              <QuillViewer value={indexedMarket.description} />
            </>
          )}
          <PoolDeployer marketId={Number(marketid)} />
          <h3 className="text-center text-2xl mt-10 mb-8">Market Cast</h3>
          <MarketAddresses
            oracleAddress={indexedMarket.oracle}
            creatorAddress={indexedMarket.creator}
          />
        </div>

        <div className="mb-12">
          <div
            className="flex center mb-8 text-mariner cursor-pointer"
            onClick={() => setLiquidityOpen(!liquidityOpen)}
          >
            <div>Show Liquidity</div>
            <ChevronDown
              size={12}
              viewBox="6 6 12 12"
              className={`box-content px-2 ${liquidityOpen && "rotate-180"}`}
            />
          </div>

          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 "
            enterTo="transform opacity-100 "
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 "
            leaveTo="transform opacity-0 "
            show={liquidityOpen && Boolean(marketSdkv2?.pool)}
          >
            <div className="mb-8">
              <LiquidityHeader pool={marketSdkv2?.pool} />
            </div>
            <PoolTable
              poolId={marketSdkv2?.pool?.poolId}
              marketId={Number(marketid)}
              blacklistFields={["manage"]}
            />
          </Transition>
        </div>
      </div>
    </>
  );
};

const LiquidityHeader = ({ pool }: { pool: FullPoolFragment }) => {
  const { data: liquidity } = usePoolLiquidity({ poolId: pool.poolId });
  const swapFee = Number(pool?.swapFee ?? 0);
  const baseAssetId = parseAssetId(pool?.baseAsset).unrightOr(null);
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const [manageLiquidityOpen, setManageLiquidityOpen] = useState(false);

  return (
    <div className="flex">
      <div className="flex-1 border-r-1 border-gray-300 py-3">
        <h4 className="text-gray-400 text-sm mb-2">Pool Value</h4>
        <div className="font-semibold">
          {formatNumberLocalized(liquidity?.div(ZTG).abs().toNumber() ?? 0)}{" "}
          {metadata?.symbol}
        </div>
      </div>
      <div className="flex-1 border-r-1 border-gray-300 pl-6 py-3">
        <h4 className="text-gray-400 text-sm mb-2">Fees</h4>
        <div className="font-semibold">
          {new Decimal(swapFee).div(ZTG).mul(100).toNumber()} %
        </div>
      </div>
      <div className="flex-1 border-r-1 border-gray-300 py-3 center">
        <BuySellFullSetsButton
          marketId={pool.marketId}
          buttonClassName="border-gray-300 text-sm border-2 rounded-full py-2 px-5"
        />
      </div>
      <div className="flex-1 center py-3">
        <button
          className="border-gray-300 text-sm border-2 rounded-full py-2 px-5"
          onClick={() => setManageLiquidityOpen(true)}
        >
          Add/Remove Liquidity
        </button>
      </div>

      <Modal
        open={manageLiquidityOpen}
        onClose={() => setManageLiquidityOpen(false)}
      >
        <LiquidityModal poolId={pool.poolId} />
      </Modal>
    </div>
  );
};

export default Market;
