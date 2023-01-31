import { Skeleton } from "@material-ui/lab";
import {
  AssetId,
  IndexerContext,
  IOMarketOutcomeAssetId,
  IOPoolShareAssetId,
  Market,
  ZTG,
} from "@zeitgeistpm/sdk-next";
import DisputeButton from "components/assets/AssetActionButtons/DisputeButton";
import RedeemButton from "components/assets/AssetActionButtons/RedeemButton";
import ReportButton from "components/assets/AssetActionButtons/ReportButton";
import Decimal from "decimal.js";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { useStore } from "lib/stores/Store";
import { formatNumberLocalized } from "lib/util";
import Link from "next/link";

export type MarketPositionsProps = {
  usdZtgPrice: Decimal;
  positions: MarketPosition[];
  market: Market<IndexerContext>;
  className?: string;
};

export type MarketPosition = {
  outcome: string;
  balance: Decimal;
  price: Decimal;
  assetId: AssetId;
  changePercentage: number;
};

export const MarketPositions = ({
  positions,
  usdZtgPrice,
  market,
  className,
}: MarketPositionsProps) => {
  const { data: marketStage } = useMarketStage(market);

  const store = useStore();
  const userAddress = store.wallets?.getActiveSigner()?.address;
  const isOracle = market?.oracle === userAddress;

  return (
    <div className={`${className}`}>
      <h2 className="text-xl text-center font-light mb-6">
        <Link href={`/markets/${market.marketId}`}>
          <span className="hover:text-blue-600">{market.question}</span>
        </Link>
      </h2>
      <table className="table-auto w-full">
        <thead className="border-b-1 border-gray-300 ">
          <tr className="text-gray-500 ">
            <th className="py-5 pl-5 font-normal bg-gray-100 rounded-tl-md text-left">
              Outcomes
            </th>
            <th className="py-5 px-2 font-normal bg-gray-100 text-right">
              Balance
            </th>
            <th className="py-5 px-2 font-normal bg-gray-100 text-right">
              Price
            </th>
            <th className="py-5 px-2 font-normal bg-gray-100 text-right">
              Total Value
            </th>
            <th className="py-5 px-2 font-normal bg-gray-100 text-right">
              24 Hrs
            </th>
            <th className="py-5 pr-5 font-normal bg-gray-100 rounded-tr-md text-right"></th>
          </tr>
        </thead>
        <tbody className="border-b-4 border-gray-200">
          {positions.map(
            ({
              outcome,
              balance,
              price,
              assetId,
              changePercentage: dailyChangePercentage,
            }) => {
              return (
                <tr
                  key={outcome}
                  className="text-lg border-b-1 border-gray-200"
                >
                  <td className="py-5 pl-5 text-left max-w-sm overflow-hidden">
                    <span className="">{outcome}</span>
                  </td>
                  <td className="py-6 px-2 text-right pl-0">
                    <span className="text-blue-500">
                      {formatNumberLocalized(balance.div(ZTG).toNumber())}
                    </span>
                  </td>
                  <td className="py-6 px-2 text-right pl-0">
                    <div className="font-bold mb-2">
                      {formatNumberLocalized(price.toNumber())}
                    </div>
                    <div className="text-gray-400 font-light">
                      ≈ $
                      {formatNumberLocalized(usdZtgPrice.mul(price).toNumber())}
                    </div>
                  </td>
                  <td className="py-6 px-2 text-right pl-0">
                    <div className="font-bold mb-2">
                      {formatNumberLocalized(
                        balance.mul(price).div(ZTG).toNumber(),
                      )}
                    </div>
                    <div className="text-gray-400 font-light">
                      ≈ $
                      {formatNumberLocalized(
                        usdZtgPrice.mul(balance.mul(price).div(ZTG)).toNumber(),
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-2 text-right pl-0">
                    <div
                      className={`font-bold ${
                        dailyChangePercentage === 0 ||
                        isNaN(dailyChangePercentage)
                          ? "text-gray-800"
                          : dailyChangePercentage > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {dailyChangePercentage > 0 ? "+" : ""}
                      {isNaN(dailyChangePercentage)
                        ? "0"
                        : dailyChangePercentage.toFixed(1)}
                      %
                    </div>
                  </td>
                  <td className="py-5 pr-5 text-right w-64">
                    {IOPoolShareAssetId.is(assetId) ? (
                      <Link href={`/liquidity/${market.pool?.poolId}`}>
                        <span className="text-blue-600 font-bold">
                          View Pool
                        </span>
                      </Link>
                    ) : marketStage?.type === "Trading" ? (
                      <Link href={`/markets/${market.marketId}`}>
                        <span className="text-blue-600 font-bold">Trade</span>
                      </Link>
                    ) : marketStage?.type === "Resolved" ? (
                      <RedeemButton
                        market={market}
                        value={balance.mul(price).div(ZTG)}
                      />
                    ) : marketStage?.type === "Reported" ? (
                      <DisputeButton market={market} assetId={assetId} />
                    ) : IOMarketOutcomeAssetId.is(assetId) &&
                      (marketStage?.type === "OpenReportingPeriod" ||
                        (marketStage?.type === "OracleReportingPeriod" &&
                          isOracle)) ? (
                      <ReportButton market={market} assetId={assetId} />
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
};

export const MarketPositionsSkeleton = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <div className={`${className}`}>
      <Skeleton
        variant="rect"
        className="mb-6 center mx-auto rounded-md"
        height={20}
        width={"70%"}
      />
      <Skeleton
        variant="rect"
        className="mb-2 rounded-md"
        height={50}
        width={"100%"}
      />
      <Skeleton
        variant="rect"
        className="mb-2 rounded-md"
        height={90}
        width={"100%"}
      />
      <Skeleton
        variant="rect"
        className="rounded-md"
        height={90}
        width={"100%"}
      />
    </div>
  );
};
