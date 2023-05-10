import { useQueryClient } from "@tanstack/react-query";
import {
  getIndexOf,
  IndexerContext,
  isRpcSdk,
  Market,
  MarketOutcomeAssetId,
} from "@zeitgeistpm/sdk-next";
import TransactionButton from "components/ui/TransactionButton";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import {
  marketDisputesRootKey,
  useMarketDisputes,
} from "lib/hooks/queries/useMarketDisputes";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";

const CategoricalDisputeBox = ({
  market,
  assetId,
  onSuccess,
}: {
  market: Market<IndexerContext>;
  assetId: MarketOutcomeAssetId;
  onSuccess?: () => void;
}) => {
  const [sdk, id] = useSdkv2();
  const { data: disputes } = useMarketDisputes(market);
  const notificationStore = useNotifications();
  const queryClient = useQueryClient();
  const { data: constants } = useChainConstants();

  const disputeBond = constants?.markets.disputeBond;
  const disputeFactor = constants?.markets.disputeFactor;
  const tokenSymbol = constants?.tokenSymbol;

  const lastDispute = disputes?.[disputes.length - 1];
  const assetName = market.categories[getIndexOf(assetId)].name;
  const bondAmount = disputes
    ? disputeBond + disputes.length * disputeFactor
    : disputeBond;

  const { send: dispute, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        return sdk.api.tx.predictionMarkets.dispute(market.marketId, {
          Categorical: getIndexOf(assetId),
        });
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          id,
          marketDisputesRootKey,
          market.marketId,
        ]);
        notificationStore.pushNotification(
          `Successfully disputed. New report: ${assetName}`,
          {
            type: "Success",
          },
        );
        onSuccess?.();
      },
    },
  );

  const getPreviousReportName = () => {
    const reportIndex =
      lastDispute?.outcome.asCategorical.toNumber() ??
      market.report?.outcome.categorical;

    return market.categories[reportIndex].name;
  };

  return (
    <>
      <div className="text-ztg-12-150 mb-ztg-5">
        Bond will start at {disputeBond} {tokenSymbol}, increasing by{" "}
        {disputeFactor} {tokenSymbol} for each dispute
      </div>
      <div className="text-ztg-12-150 mb-ztg-5 font-bold">
        Bonds will be slashed if the reported outcome is deemed to be incorrect
      </div>

      <div className="my-ztg-10">
        <div className="h-ztg-18 flex justify-between text-ztg-12-150 font-bold text-sky-600">
          <span>Previous Report:</span>
          <span className="font-mono">{getPreviousReportName()}</span>
        </div>
        <div className="h-ztg-18 flex justify-between text-ztg-12-150 font-bold text-sky-600">
          <span>New Report:</span>
          <span className="font-mono">{assetName}</span>
        </div>
        {bondAmount !== disputeBond && bondAmount !== undefined ? (
          <div className="h-ztg-18 flex justify-between text-ztg-12-150 font-bold text-sky-600 ">
            <span>Previous Bond:</span>
            <span className="font-mono">{bondAmount - disputeFactor}</span>
          </div>
        ) : (
          <></>
        )}
      </div>
      <TransactionButton
        className="my-ztg-10 shadow-ztg-2"
        onClick={dispute}
        disabled={isLoading}
      >
        Confirm Dispute
      </TransactionButton>
    </>
  );
};

export default CategoricalDisputeBox;
