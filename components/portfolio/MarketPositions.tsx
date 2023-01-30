import { Skeleton } from "@material-ui/lab";
import {
  AssetId,
  CategoricalAssetId,
  getIndexOf,
  IndexerContext,
  IOMarketOutcomeAssetId,
  isRpcSdk,
  Market,
  ScalarAssetId,
  ZTG,
} from "@zeitgeistpm/sdk-next";
import * as AE from "@zeitgeistpm/utility/dist/aeither";
import DisputeButton from "components/assets/AssetActionButtons/DisputeButton";
import ReportButton from "components/assets/AssetActionButtons/ReportButton";

import Decimal from "decimal.js";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { formatNumberLocalized } from "lib/util";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import Link from "next/link";
import { useState } from "react";

export type MarketPositionsProps = {
  title: string;
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
  title,
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
      <h2 className="text-xl text-center font-light mb-6">{title}</h2>
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
        <tbody>
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
                  className="text-lg border-b-1 border-gray-300"
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
                    {marketStage?.type === "Trading" ? (
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

const RedeemButton = ({
  market,
  value,
}: {
  market: Market<IndexerContext>;
  value: Decimal;
}) => {
  const [sdk] = useSdkv2();

  const store = useStore();
  const { wallets } = store;
  const signer = wallets?.getActiveSigner();
  const notificationStore = useNotificationStore();

  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);

  const handleClick = async () => {
    if (!isRpcSdk(sdk)) return;

    setIsRedeeming(true);

    const callback = extrinsicCallback({
      notificationStore,
      successCallback: async () => {
        notificationStore.pushNotification(`Redeemed ${value.toFixed(2)} ZTG`, {
          type: "Success",
        });
        setIsRedeeming(false);
        setIsRedeemed(true);
      },
      failCallback: ({ index, error }) => {
        notificationStore.pushNotification(
          store.getTransactionError(index, error),
          {
            type: "Error",
          },
        );
        setIsRedeeming(false);
      },
    });

    const tx = sdk.context.api.tx.predictionMarkets.redeemShares(
      market.marketId,
    );

    await AE.from(() => signAndSend(tx, signer, callback));

    setIsRedeeming(false);
  };

  return (
    <>
      {isRedeemed ? (
        <span className="text-green-500 font-bold">Redeemed Tokens!</span>
      ) : (
        <button
          onClick={handleClick}
          className={`text-blue-600 font-bold ${
            isRedeeming && "animate-pulse"
          }`}
          disabled={isRedeeming}
        >
          Redeem Tokens
        </button>
      )}
    </>
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
